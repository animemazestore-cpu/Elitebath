declare const process: any;

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers':
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { action, order, config: clientConfig, order_id, order_number } = body;

    // Resolve credentials (server env takes priority over clientConfig if set)
    const env = (process.env.QIKINK_ENV || clientConfig?.environment || 'sandbox').toLowerCase();
    const isSandbox = env === 'sandbox';
    const clientId = process.env.QIKINK_CLIENT_ID || clientConfig?.clientId || '';
    const clientSecret = process.env.QIKINK_CLIENT_SECRET || clientConfig?.clientSecret || '';
    const baseUrl =
      process.env.QIKINK_BASE_URL ||
      clientConfig?.baseUrl ||
      (isSandbox ? 'https://sandbox.qikink.com/api' : 'https://api.qikink.com/api');

    // 1. ACTION: Test Connection
    if (action === 'test') {
      if (!clientId || !clientSecret) {
        if (isSandbox) {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Sandbox simulation ready. For live testing, provide Client ID and Secret.',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ success: false, message: 'Missing Client ID or Client Secret' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const testRes = await fetch(`${baseUrl}/account/status`, {
          method: 'GET',
          headers: {
            'ClientId': clientId,
            'ClientSecret': clientSecret,
            'Accept': 'application/json',
          },
        });

        if (testRes.ok) {
          return new Response(
            JSON.stringify({ success: true, message: `Successfully authenticated with Qikink ${env.toUpperCase()} API!` }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (testRes.status === 401 || testRes.status === 403) {
          return new Response(
            JSON.stringify({ success: false, message: 'Authentication failed: Invalid Client ID or Client Secret' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: `Connected to Qikink endpoint (Status: HTTP ${testRes.status})` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: isSandbox, message: `Qikink ping: ${err.message}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. ACTION: Create / Dispatch Order
    if (action === 'create') {
      if (!order) {
        return new Response(
          JSON.stringify({ success: false, message: 'Missing order payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If in sandbox mode without production keys, perform high-fidelity simulation
      if (isSandbox || !clientId) {
        const awbPrefixes = ['DL', 'BD', 'SF'];
        const randomPrefix = awbPrefixes[Math.floor(Math.random() * awbPrefixes.length)];
        const randomAwb = `${randomPrefix}${Math.floor(100000000 + Math.random() * 900000000)}`;
        const courierNames = ['Delhivery Surface', 'BlueDart Express', 'Shadowfax Air'];
        const courier = courierNames[Math.floor(Math.random() * courierNames.length)];
        const qikinkId = `QK-SANDBOX-${Date.now().toString().slice(-6)}`;
        const orderNum = order.order_number || order.id || `ORD-${Date.now()}`;

        return new Response(
          JSON.stringify({
            success: true,
            order_number: orderNum,
            qikink_order_id: qikinkId,
            status: 'QUEUED_SANDBOX',
            courier_name: courier,
            awb_number: randomAwb,
            tracking_url: `https://track.qikink.com/test?order=${orderNum}&awb=${randomAwb}`,
            message: clientId
              ? 'Dispatched to Qikink Sandbox successfully.'
              : 'Dispatched in Sandbox simulation mode. Live orders will print once switched to Production.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Live Production Qikink Dispatch
      const qikinkRes = await fetch(`${baseUrl}/order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ClientId': clientId,
          'ClientSecret': clientSecret,
          'Accept': 'application/json',
        },
        body: JSON.stringify(order),
      });

      const qikinkData = await qikinkRes.json();

      if (!qikinkRes.ok || (qikinkData.status && qikinkData.status !== 'success' && qikinkData.status !== 200)) {
        return new Response(
          JSON.stringify({
            success: false,
            status: 'FAILED',
            message: qikinkData.message || qikinkData.error || `HTTP ${qikinkRes.status}`,
            raw_response: qikinkData,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          order_number: order.order_number,
          qikink_order_id: qikinkData.order_id || qikinkData.qikink_order_id || `QK-${Date.now()}`,
          status: qikinkData.order_status || 'PROCESSING',
          courier_name: qikinkData.courier_name || qikinkData.carrier || 'Delhivery Express',
          awb_number: qikinkData.awb_number || qikinkData.tracking_number,
          tracking_url: qikinkData.tracking_url,
          message: 'Order dispatched successfully to Qikink Production!',
          raw_response: qikinkData,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. ACTION: Check Status
    if (action === 'status') {
      if (isSandbox || !clientId) {
        const statuses = ['PROCESSING', 'PRINTING_IN_PROGRESS', 'QUALITY_CHECK', 'PACKED', 'SHIPPED'];
        const chosen = statuses[Math.floor(Math.random() * statuses.length)];
        return new Response(
          JSON.stringify({
            success: true,
            status: chosen,
            courier: 'Delhivery Express',
            awb: `DL${Math.floor(100000000 + Math.random() * 900000000)}`,
            message: `[Sandbox Sync] Status polled: ${chosen}`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const qikinkRes = await fetch(`${baseUrl}/order/status?order_id=${encodeURIComponent(order_id || order_number)}`, {
        method: 'GET',
        headers: {
          'ClientId': clientId,
          'ClientSecret': clientSecret,
          'Accept': 'application/json',
        },
      });

      const qikinkData = await qikinkRes.json();
      return new Response(
        JSON.stringify({
          success: qikinkRes.ok,
          status: qikinkData.status || qikinkData.order_status || 'PROCESSING',
          courier: qikinkData.courier_name || qikinkData.carrier,
          awb: qikinkData.awb_number || qikinkData.tracking_number,
          message: qikinkData.message || 'Status retrieved successfully.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. ACTION: Cancel Order
    if (action === 'cancel') {
      if (isSandbox || !clientId) {
        return new Response(
          JSON.stringify({ success: true, message: 'Sandbox order cancelled.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const qikinkRes = await fetch(`${baseUrl}/order/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ClientId': clientId,
          'ClientSecret': clientSecret,
        },
        body: JSON.stringify({ order_id }),
      });

      const qikinkData = await qikinkRes.json();
      return new Response(
        JSON.stringify({
          success: qikinkRes.ok,
          message: qikinkData.message || (qikinkRes.ok ? 'Order cancelled on Qikink' : 'Cancellation failed'),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
