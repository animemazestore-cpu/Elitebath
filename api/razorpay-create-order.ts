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
    const { items, shippingAddress, couponCode, user_id } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart items are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. Server-side subtotal calculation
    let subtotal = 0;
    for (const item of items) {
      const unitPrice = Number(item.variantPrice ?? item.product?.price ?? 0);
      const qty = Math.max(1, Number(item.quantity ?? 1));
      if (isNaN(unitPrice) || unitPrice < 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid product pricing detected' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      subtotal += unitPrice * qty;
    }

    // 2. Server-side coupon verification
    let discountAmount = 0;
    if (couponCode) {
      const code = String(couponCode).trim().toUpperCase();
      if (code === 'TRYVOAL10' || code === 'ELITE10') {
        discountAmount = Math.round((subtotal * 10) / 100);
      } else if (code === 'LUXURY20' && subtotal >= 5000) {
        discountAmount = Math.round((subtotal * 20) / 100);
      } else if ((code === 'BATH500' || code === 'TRY500') && subtotal >= 2500) {
        discountAmount = 500;
      } else if (code === 'FREESHIP') {
        discountAmount = 0; // Handled in shipping
      }
    }

    // 3. Per-product shipping fee calculation
    let shippingCharge = 0;
    for (const item of items) {
      const fee = Number(item.product?.shipping_fee || 0);
      shippingCharge += fee * Math.max(1, Number(item.quantity ?? 1));
    }

    // 4. Final total in rupees and paise
    const finalTotal = Math.max(0, subtotal - discountAmount) + shippingCharge;
    const amountInPaise = Math.round(finalTotal * 100);

    // 5. Razorpay Key Configuration
    const keyId =
      (typeof process !== 'undefined' && process.env?.RAZORPAY_KEY_ID) ||
      (typeof process !== 'undefined' && process.env?.VITE_RAZORPAY_KEY_ID) ||
      'rzp_test_demo_tryvoal';
    const keySecret =
      typeof process !== 'undefined' ? process.env?.RAZORPAY_KEY_SECRET : null;

    let razorpayOrderId: string | null = null;

    // If real keys are provided, create actual order on Razorpay
    if (keySecret && keyId && !keyId.includes('demo') && !keyId.includes('placeholder')) {
      try {
        const credentials = btoa(`${keyId.trim()}:${keySecret.trim()}`);
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: {
              customer_name: shippingAddress?.fullName || 'Customer',
              customer_email: shippingAddress?.email || '',
              user_id: user_id || 'guest',
            },
          }),
        });

        if (rzpResponse.ok) {
          const rzpData = await rzpResponse.json();
          razorpayOrderId = rzpData.id;
        } else {
          const errData = await rzpResponse.json().catch(() => ({}));
          console.error('Razorpay API returned error:', errData);
          const errorMsg =
            errData?.error?.description ||
            `Razorpay API error (${rzpResponse.status}): Your Razorpay key or account activation status may be invalid.`;
          return new Response(
            JSON.stringify({
              success: false,
              error: errorMsg,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (rzpErr: any) {
        console.error('Razorpay API request failed:', rzpErr);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Razorpay connection error: ${rzpErr?.message || 'Unknown network error'}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    const generatedOrderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    return new Response(
      JSON.stringify({
        success: true,
        orderId: generatedOrderId,
        razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId,
        subtotal,
        discountAmount,
        shippingCharge,
        total: finalTotal,
        estimatedDeliveryDate: estimatedDeliveryDate.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create order',
        details: error?.message || 'Server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
