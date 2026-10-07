declare const process: any;

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Qikink-Signature',
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
    const payload = await req.json();
    console.log('[Qikink Webhook Received]:', payload);

    // Qikink webhook schema standard fields
    const orderNumber = payload.order_number || payload.order_id || payload.client_order_id;
    const qikinkStatus = (payload.status || payload.order_status || '').toUpperCase();
    const awb = payload.awb_number || payload.tracking_number || payload.waybill;
    const courier = payload.courier_name || payload.carrier || 'Delhivery Express';
    const trackingUrl = payload.tracking_url;

    if (!orderNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing order_number in webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Map Qikink status to internal store order status
      let internalStatus = 'PROCESSING';
      if (['SHIPPED', 'DISPATCHED', 'IN_TRANSIT'].includes(qikinkStatus)) {
        internalStatus = 'SHIPPED';
      } else if (['DELIVERED', 'COMPLETED'].includes(qikinkStatus)) {
        internalStatus = 'DELIVERED';
      } else if (['CANCELLED', 'CANCELED'].includes(qikinkStatus)) {
        internalStatus = 'CANCELLED';
      }

      // Query order by id or shipping_address->>order_ref
      const findUrl = `${supabaseUrl}/rest/v1/orders?or=(id.eq.${orderNumber},shipping_address->>order_ref.eq.${orderNumber})&select=*`;
      const findRes = await fetch(findUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json',
        },
      });

      const orders = await findRes.json();
      if (Array.isArray(orders) && orders.length > 0) {
        const order = orders[0];
        const currentShipping = order.shipping_address || {};

        const updatedShipping = {
          ...currentShipping,
          qikink_info: {
            ...(currentShipping.qikink_info || {}),
            status: qikinkStatus,
            awb_number: awb || currentShipping.qikink_info?.awb_number,
            courier_name: courier || currentShipping.qikink_info?.courier_name,
            tracking_url: trackingUrl || currentShipping.qikink_info?.tracking_url,
            updated_at: new Date().toISOString(),
          },
          ...(awb ? {
            tracking_info: {
              carrier: courier,
              tracking_number: awb,
              shipped_at: new Date().toISOString(),
            }
          } : {}),
        };

        const updateUrl = `${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`;
        await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            status: internalStatus,
            shipping_address: updatedShipping,
          }),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Qikink webhook processed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Qikink webhook handler error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
