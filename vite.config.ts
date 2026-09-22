import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function razorpayDevApiPlugin(): Plugin {
  return {
    name: 'razorpay-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/razorpay-create-order') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const items = data.items || [];
              let subtotal = 0;
              for (const it of items) {
                const unit = Number(it.variantPrice ?? it.product?.price ?? 0);
                const q = Math.max(1, Number(it.quantity ?? 1));
                subtotal += unit * q;
              }
              let discount = 0;
              const coupon = (data.couponCode || '').toUpperCase();
              if (coupon === 'ELITE10') discount = Math.round((subtotal * 10) / 100);
              else if (coupon === 'LUXURY20' && subtotal >= 5000) discount = Math.round((subtotal * 20) / 100);
              else if (coupon === 'BATH500' && subtotal >= 2500) discount = 500;

              let shipping = 0;
              for (const it of items) {
                const fee = Number(it.product?.shipping_fee || 0);
                shipping += fee * Math.max(1, Number(it.quantity ?? 1));
              }
              const serviceFee = Number(data.serviceFee || 0);
              const total = Math.max(0, subtotal - discount) + shipping + serviceFee;
              const deliveryDate = new Date();
              deliveryDate.setDate(deliveryDate.getDate() + 5);

              const response = {
                success: true,
                orderId: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                razorpayOrderId: `order_dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                amount: Math.round(total * 100),
                currency: 'INR',
                keyId: process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_elitebath',
                subtotal,
                discountAmount: discount,
                shippingCharge: shipping,
                serviceFee,
                total,
                estimatedDeliveryDate: deliveryDate.toISOString(),
              };

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(response));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to process order' }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/razorpay-verify') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const response = {
                success: true,
                message: 'Payment verified successfully',
                orderId: data.orderId,
                paymentId: data.razorpayPaymentId || `pay_dev_${Date.now()}`,
                verifiedAt: new Date().toISOString(),
              };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(response));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to verify payment' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), razorpayDevApiPlugin()],
  server: {
    proxy: {
      '/api/fampay-qr': {
        target: 'https://py.freepanel.in',
        changeOrigin: true,
        rewrite: (path) => {
          const mainPath = path.replace(/^\/api\/fampay-qr/, '/qr');
          const separator = mainPath.includes('?') ? '&' : '?';
          return `${mainPath}${separator}api_key=fmpay_c0deedbc77d3d29dfbac858498bfd10d262a48a2`;
        },
      },
      '/api/fampay-verify': {
        target: 'https://py.freepanel.in',
        changeOrigin: true,
        rewrite: (path) => {
          const mainPath = path.replace(/^\/api\/fampay-verify/, '/verify_order');
          const separator = mainPath.includes('?') ? '&' : '?';
          return `${mainPath}${separator}api_key=fmpay_c0deedbc77d3d29dfbac858498bfd10d262a48a2`;
        },
      },
    },
  },
});
