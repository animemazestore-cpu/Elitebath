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
              if (coupon === 'TRYVOAL10' || coupon === 'ELITE10') discount = Math.round((subtotal * 10) / 100);
              else if (coupon === 'LUXURY20' && subtotal >= 5000) discount = Math.round((subtotal * 20) / 100);
              else if (coupon === 'TRY500' && subtotal >= 2500) discount = 500;

              let shipping = 0;
              for (const it of items) {
                const fee = Number(it.product?.shipping_fee || 0);
                shipping += fee * Math.max(1, Number(it.quantity ?? 1));
              }
              const total = Math.max(0, subtotal - discount) + shipping;
              const deliveryDate = new Date();
              deliveryDate.setDate(deliveryDate.getDate() + 5);

              const response = {
                success: true,
                orderId: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                razorpayOrderId: `order_dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                amount: Math.round(total * 100),
                currency: 'INR',
                keyId: process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_tryvoal',
                subtotal,
                discountAmount: discount,
                shippingCharge: shipping,
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

function qikinkDevApiPlugin(): Plugin {
  return {
    name: 'qikink-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/qikink') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const { action, order, config: clientConfig, order_id, order_number } = parsed;

              const env = (process.env.QIKINK_ENV || clientConfig?.environment || 'sandbox').toLowerCase();
              const isSandbox = env === 'sandbox';
              const clientId = process.env.QIKINK_CLIENT_ID || clientConfig?.clientId || '960194484867280';
              const clientSecret = process.env.QIKINK_CLIENT_SECRET || clientConfig?.clientSecret || 'd2a534e5d0a4310a0bfae9f11f5bc2c95b709b9bb3633a0f722dbbd59205ad01';
              const baseUrl =
                process.env.QIKINK_BASE_URL ||
                clientConfig?.baseUrl ||
                (isSandbox ? 'https://sandbox.qikink.com' : 'https://api.qikink.com');

              const buildUrl = (base: string, path: string) => {
                const cb = (base || '').trim().replace(/\/+$/, '');
                const cp = path.startsWith('/') ? path : `/${path}`;
                if (cb.endsWith('/api') && cp.startsWith('/api/')) return `${cb}${cp.slice(4)}`;
                if (!cb.endsWith('/api') && !cp.startsWith('/api/')) return `${cb}/api${cp}`;
                return `${cb}${cp}`;
              };

              const getToken = async (bUrl: string, cId: string, cSecret: string) => {
                const tokenUrl = buildUrl(bUrl, '/token');
                const form = new URLSearchParams();
                form.append('ClientId', cId);
                form.append('client_secret', cSecret);
                const tRes = await fetch(tokenUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                  },
                  body: form.toString(),
                });
                const tData = (await tRes.json().catch(() => ({}))) as any;
                if (tRes.ok && (tData.Accesstoken || tData.access_token || tData.token)) {
                  return { success: true, token: tData.Accesstoken || tData.access_token || tData.token };
                }
                return { success: false, error: tData.error || tData.message || `HTTP ${tRes.status}` };
              };

              res.setHeader('Content-Type', 'application/json');

              if (action === 'test') {
                if (!clientId || !clientSecret) {
                  if (isSandbox) {
                    res.end(
                      JSON.stringify({
                        success: true,
                        is_simulation: true,
                        message:
                          '🧪 Sandbox Mode Active: Mock dispatches, simulated carrier AWB generation, and delivery updates are ready. When you obtain live keys from dashboard.qikink.com, enter them to connect directly.',
                      })
                    );
                    return;
                  }
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, message: 'Missing Client ID or Client Secret.' }));
                  return;
                }

                const tokenRes = await getToken(baseUrl, clientId, clientSecret);
                if (tokenRes.success && tokenRes.token) {
                  res.end(
                    JSON.stringify({
                      success: true,
                      message: `✅ Successfully authenticated with Qikink ${env.toUpperCase()} API! Access token acquired.`,
                    })
                  );
                  return;
                }

                res.end(
                  JSON.stringify({
                    success: false,
                    message: `❌ Authentication Failed: ${tokenRes.error || 'Invalid credentials'}. Please verify Client ID & Secret in dashboard.qikink.com > Integrations.`,
                  })
                );
                return;
              }

              // Create Order
              if (action === 'create') {
                if (isSandbox || !clientId) {
                  const awbs = ['DL883920192', 'BD749102931', 'SF910283741'];
                  const randomAwb = awbs[Math.floor(Math.random() * awbs.length)];
                  const couriers = ['Delhivery Surface', 'BlueDart Express', 'Shadowfax Air'];
                  const courier = couriers[Math.floor(Math.random() * couriers.length)];
                  const orderNum = order?.order_number || `ORD${Date.now().toString().slice(-8)}`;
                  res.end(
                    JSON.stringify({
                      success: true,
                      order_number: orderNum,
                      qikink_order_id: `QK-SANDBOX-${Date.now().toString().slice(-6)}`,
                      status: 'QUEUED_SANDBOX',
                      courier_name: courier,
                      awb_number: randomAwb,
                      tracking_url: `https://track.qikink.com/test?order=${orderNum}&awb=${randomAwb}`,
                      message: clientId ? 'Dispatched to Qikink Sandbox successfully.' : 'Dispatched in Sandbox simulation mode.',
                    })
                  );
                  return;
                }

                const tokenRes = await getToken(baseUrl, clientId, clientSecret);
                const createUrl = buildUrl(baseUrl, '/order/create');
                const qRes = await fetch(createUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ClientId': clientId,
                    'Accesstoken': tokenRes.token || '',
                  },
                  body: JSON.stringify(order),
                });
                const qData = await qRes.json().catch(() => ({}));
                res.end(JSON.stringify(qData));
                return;
              }

              // Status
              if (action === 'status') {
                if (isSandbox || !clientId) {
                  const statuses = ['PROCESSING', 'PRINTING_IN_PROGRESS', 'QUALITY_CHECK', 'PACKED', 'SHIPPED'];
                  const chosen = statuses[Math.floor(Math.random() * statuses.length)];
                  res.end(
                    JSON.stringify({
                      success: true,
                      status: chosen,
                      courier: 'Delhivery Express',
                      awb: `DL${Math.floor(100000000 + Math.random() * 900000000)}`,
                      message: `[Sandbox Sync] Status polled: ${chosen}`,
                    })
                  );
                  return;
                }

                const tokenRes = await getToken(baseUrl, clientId, clientSecret);
                const statusUrl = buildUrl(baseUrl, `/order/status?order_id=${encodeURIComponent(order_id || order_number)}`);
                const qRes = await fetch(statusUrl, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                    'ClientId': clientId,
                    'Accesstoken': tokenRes.token || '',
                  },
                });
                const qData = await qRes.json().catch(() => ({}));
                res.end(JSON.stringify(qData));
                return;
              }

              res.statusCode = 400;
              res.end(JSON.stringify({ error: `Unknown action: ${action}` }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Internal error' }));
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
  plugins: [react(), razorpayDevApiPlugin(), qikinkDevApiPlugin()],
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
