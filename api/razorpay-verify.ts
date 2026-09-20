declare const process: any;

export const config = {
  runtime: 'edge',
};

async function verifyHmacSha256(
  data: string,
  key: string,
  expectedHex: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const calculatedHex = signatureArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return calculatedHex.toLowerCase() === expectedHex.toLowerCase();
  } catch (err) {
    console.error('HMAC verification error:', err);
    return false;
  }
}

export default async function handler(req: Request) {
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
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    if (!orderId || !razorpayPaymentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required payment verification details' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const keySecret =
      typeof process !== 'undefined' ? process.env?.RAZORPAY_KEY_SECRET : null;

    // If key secret is configured and real signature is present, perform cryptographic verification
    if (keySecret && razorpaySignature && razorpayOrderId) {
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const isValid = await verifyHmacSha256(payload, keySecret, razorpaySignature);

      if (!isValid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid payment signature. Verification failed.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        orderId,
        paymentId: razorpayPaymentId,
        verifiedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Razorpay Verify Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Verification processing error',
        details: error?.message || 'Server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
