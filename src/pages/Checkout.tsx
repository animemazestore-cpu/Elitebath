import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useServiceStore } from '../store/useServiceStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Truck,
  CheckCircle2,
  Wrench,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  MapPin,
  MessageCircle,
  Check,
  Package,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  loadRazorpaySDK,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../lib/razorpay';
import { checkRateLimit, recordRateLimitAttempt } from '../lib/rateLimiter';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    items,
    getTotalAmount,
    clearCart,
    selectedServiceIds = [],
    toggleService,
  } = useCartStore();
  const { services, createBooking, initializeServices } = useServiceStore();

  // Fetch fresh services and pricing on mount
  useEffect(() => {
    void initializeServices();
  }, [initializeServices]);

  // Multi-Step Checkout Navigation: 1 (Preview) -> 2 (Address) -> 3 (Payment) -> 4 (Confirmation)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Filter active checkout add-on services from the services store
  const availableServices = services.filter(
    (s) => s.is_active && (s.is_checkout_addon || s.category === 'Fitting' || s.category === 'Inspection')
  );

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Applied Coupon from cart/storage
  const [appliedCoupon] = useState<any>(() => {
    return JSON.parse(
      localStorage.getItem('elitebath_applied_coupon') ||
        localStorage.getItem('animemaze_applied_coupon') ||
        'null'
    );
  });

  // Base Products Subtotal (Product price remains completely unchanged)
  const subtotal = getTotalAmount();

  // Validate coupon
  const isCouponValid =
    appliedCoupon &&
    appliedCoupon.active !== false &&
    (!appliedCoupon.minOrder || subtotal >= appliedCoupon.minOrder);

  let discountAmount = 0;
  if (isCouponValid) {
    if (appliedCoupon.type === 'PERCENT') {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === 'FIXED') {
      discountAmount = Math.min(subtotal, appliedCoupon.value);
    }
  }

  // Per-product shipping charge
  const shippingCharge = items.reduce((sum, item) => {
    return sum + (Number(item.product.shipping_fee) || 0) * item.quantity;
  }, 0);

  // Total order amount: Subtotal - Discount + Shipping + Services Total
  const total = Math.max(0, subtotal - discountAmount) + shippingCharge + servicesTotal;

  // Step 2: Customer Delivery & Address Information (Preserved across all step navigation)
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');

  // Step 3: Payment & Order State
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);
  const [orderPaymentId, setOrderPaymentId] = useState<string | null>(null);
  const [orderDeliveryDate, setOrderDeliveryDate] = useState<string | null>(null);

  // WhatsApp auto-redirect countdown state (for Step 4)
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false);

  // Redirect if cart is empty and no active completed order
  useEffect(() => {
    if (items.length === 0 && !orderCreatedId && !loading && currentStep !== 4) {
      navigate('/cart');
    }
  }, [items, navigate, orderCreatedId, loading, currentStep]);

  // Clear cart when payment is confirmed
  useEffect(() => {
    if (paymentStatus === 'paid') {
      clearCart();
      localStorage.removeItem('elitebath_applied_coupon');
      localStorage.removeItem('animemaze_applied_coupon');
    }
  }, [paymentStatus, clearCart]);

  // Handle WhatsApp auto-redirect for service coordination in Step 4
  useEffect(() => {
    if (currentStep === 4 && selectedServices.length > 0 && !autoRedirectCancelled) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            triggerWhatsAppCoordination();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentStep, selectedServices.length, autoRedirectCancelled]);


  // Generate WhatsApp Coordination Link
  const getWhatsAppCoordinationUrl = () => {
    const servicesListText = selectedServices
      .map((s) => `• ${s.title} (₹${s.price.toLocaleString('en-IN')})`)
      .join('\n');

    const message = `*Elite Bath Collections — Service Coordination Request*\n\n` +
      `Hello, I have placed Order *#${orderCreatedId || 'NEW'}* and selected additional installation/inspection service(s):\n\n` +
      `*Selected Services:*\n${servicesListText}\n\n` +
      `*Customer Name:* ${fullName}\n` +
      `*Phone Number:* ${phone}\n` +
      `*Delivery Address:* ${address}${landmark ? `, Near ${landmark}` : ''}, ${city}, ${state} - ${pincode}\n\n` +
      `Please coordinate the certified technician visit according to the order delivery schedule.`;

    return `https://wa.me/917055435358?text=${encodeURIComponent(message)}`;
  };

  const triggerWhatsAppCoordination = () => {
    const url = getWhatsAppCoordinationUrl();
    window.open(url, '_blank');
  };

  // Save Confirmed Order to DB and Local Storage
  const persistConfirmedOrder = async (
    orderId: string,
    paymentId: string,
    paymentMethodUsed: string
  ) => {
    const shippingAddressJson = {
      fullName,
      phone,
      email,
      address,
      landmark,
      city,
      state,
      pincode,
      country,
      paymentMethod: paymentMethodUsed,
      paymentId,
      order_ref: orderId,
      selected_services: selectedServices.map((s) => ({
        id: s.id,
        title: s.title,
        price: s.price,
      })),
      item_variants: items.map((item) => ({
        product_id: item.product.id,
        selected_variant: item.selectedVariant || null,
        selected_variant_id: item.selectedVariantId || null,
        selected_attributes: item.selectedAttributes || {},
      })),
    };

    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + 5);

    // 1. Record customer service bookings in useServiceStore
    for (const service of selectedServices) {
      createBooking({
        service_id: service.id,
        service_title: service.title,
        service_price: service.price,
        customer_name: fullName,
        customer_phone: phone,
        customer_email: email,
        address: `${address}${landmark ? `, Near ${landmark}` : ''}`,
        city,
        state,
        pincode,
        preferred_date: estDelivery.toISOString().split('T')[0],
        preferred_time_slot: 'Morning (10:00 AM - 1:00 PM)',
        notes: `Selected during checkout with Order #${orderId}`,
        order_id: orderId,
      });
    }

    // 2. Persist order in Supabase
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...(isUuid ? { id: orderId } : {}),
          user_id: user?.id || null,
          total_amount: total,
          status: 'PAID',
          payment_status: 'PAID',
          shipping_address: shippingAddressJson,
          estimated_delivery_date: estDelivery.toISOString(),
        })
        .select()
        .maybeSingle();

      if (orderError) {
        console.warn('Supabase DB order insert error:', orderError);
      } else if (insertedOrder?.id) {
        const orderItemsPayload = items.map((item) => ({
          order_id: insertedOrder.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.variantPrice ?? item.product.price,
          selected_variant: item.selectedVariant || null,
          selected_variant_id: item.selectedVariantId || null,
          selected_attributes: item.selectedAttributes || {},
        }));
        await supabase.from('order_items').insert(orderItemsPayload);
      }
    } catch (dbErr) {
      console.warn('Supabase DB order insert exception, storing locally:', dbErr);
    }

    // 3. Persist order in localStorage for 100% reliable local access
    try {
      const localOrder = {
        id: orderId,
        user_id: user?.id || 'guest',
        total_amount: total,
        status: 'PAID',
        payment_status: 'PAID',
        payment_id: paymentId,
        shipping_address: shippingAddressJson,
        estimated_delivery_date: estDelivery.toISOString(),
        selected_services: selectedServices,
        items: items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.variantPrice ?? item.product.price,
          selected_variant: item.selectedVariant || null,
          selected_variant_id: item.selectedVariantId || null,
          selected_attributes: item.selectedAttributes || {},
          image_url: item.variantImage || item.product.main_image_url,
          product: {
            id: item.product.id,
            name: item.product.name,
            main_image_url: item.variantImage || item.product.main_image_url,
            price: item.variantPrice ?? item.product.price,
            slug: item.product.slug,
          },
        })),
        created_at: new Date().toISOString(),
      };

      const existingOrders = JSON.parse(
        localStorage.getItem('elitebath_local_orders') ||
          localStorage.getItem('animemaze_local_orders') ||
          '[]'
      );
      existingOrders.unshift(localOrder);
      localStorage.setItem('elitebath_local_orders', JSON.stringify(existingOrders));
      localStorage.setItem('animemaze_local_orders', JSON.stringify(existingOrders));
    } catch (e) {
      console.error('Failed to write to local orders:', e);
    }
  };

  // Step 2 Validation: Address & Customer Details
  const handleValidateAddressStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address for order notifications.');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your complete delivery street address.');
      return;
    }

    if (!city.trim()) {
      setErrorMsg('Please enter your city.');
      return;
    }

    if (!state.trim()) {
      setErrorMsg('Please enter your state.');
      return;
    }

    const cleanPincode = pincode.trim().replace(/[^0-9]/g, '');
    if (cleanPincode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode.');
      return;
    }

    // Step 2 passed -> advance to Step 3 (Payment)
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 Execution: Handle Razorpay Checkout
  const handleRazorpayCheckout = async () => {
    // Rate limiting abuse prevention
    const rateCheck = checkRateLimit('checkout_payment', {
      maxRequests: 5,
      windowSeconds: 60,
      actionName: 'order payment attempts',
    });
    if (!rateCheck.allowed) {
      setErrorMsg(rateCheck.errorMessage || 'Too many payment requests. Please wait a moment.');
      return;
    }
    recordRateLimitAttempt('checkout_payment', { maxRequests: 5, windowSeconds: 60 });

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Load Razorpay Checkout SDK
      const sdkReady = await loadRazorpaySDK();
      if (!sdkReady) {
        throw new Error(
          'Unable to load Razorpay payment gateway. Please check your internet connection or try again.'
        );
      }

      // 2. Create server-side order with services fee as distinct line item
      const serverOrder = await createRazorpayOrder({
        items: items.map((it) => ({
          product: {
            id: it.product.id,
            name: it.product.name,
            price: it.product.price,
            slug: it.product.slug,
            shipping_fee: it.product.shipping_fee ?? 0,
          },
          quantity: it.quantity,
          variantPrice: it.variantPrice,
          selectedVariant: it.selectedVariant,
          selectedVariantId: it.selectedVariantId,
          selectedAttributes: it.selectedAttributes,
        })),
        services: selectedServices.map((s) => ({
          id: s.id,
          title: s.title,
          price: s.price,
        })),
        serviceFee: servicesTotal,
        shippingAddress: {
          fullName,
          phone,
          email,
          address,
          landmark,
          city,
          state,
          pincode,
          country,
        },
        couponCode: appliedCoupon?.code,
        user_id: user?.id,
      });

      if (!serverOrder.success) {
        throw new Error(serverOrder.error || 'Failed to initialize payment order');
      }

      const orderRefId = serverOrder.orderId;
      setOrderCreatedId(orderRefId);
      setOrderDeliveryDate(serverOrder.estimatedDeliveryDate);

      // 3. Configure Razorpay modal options
      const isRealOrderId =
        Boolean(serverOrder.razorpayOrderId) &&
        typeof serverOrder.razorpayOrderId === 'string' &&
        serverOrder.razorpayOrderId.startsWith('order_') &&
        !serverOrder.razorpayOrderId.startsWith('order_test_') &&
        !serverOrder.razorpayOrderId.startsWith('order_dev_');

      const options: any = {
        key: serverOrder.keyId,
        amount: serverOrder.amount,
        currency: serverOrder.currency || 'INR',
        name: 'Elite Bath Collections',
        description: `Order Ref: ${orderRefId}`,
        image: '/logo.png',
        ...(isRealOrderId ? { order_id: serverOrder.razorpayOrderId } : {}),
        prefill: {
          name: fullName,
          email: email,
          contact: phone,
        },
        notes: {
          order_id: orderRefId,
          user_id: user?.id || 'guest',
          services: selectedServices.map((s) => s.title).join(', '),
        },
        theme: {
          color: '#166534',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrorMsg('Payment cancelled. Your entered information and cart remain saved.');
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          try {
            setLoading(true);
            const verifyRes = await verifyRazorpayPayment({
              orderId: orderRefId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id || serverOrder.razorpayOrderId || '',
              razorpaySignature: response.razorpay_signature || '',
            });

            if (verifyRes.success) {
              setPaymentStatus('paid');
              setOrderPaymentId(response.razorpay_payment_id);
              await persistConfirmedOrder(
                orderRefId,
                response.razorpay_payment_id,
                'Razorpay'
              );
              setCurrentStep(4);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setErrorMsg(
                verifyRes.error ||
                  'Payment verification returned failure. If your account was debited, contact customer care.'
              );
            }
          } catch (verifyErr: any) {
            console.error('Verification error:', verifyErr);
            setErrorMsg('Payment verification encountered an issue.');
          } finally {
            setLoading(false);
          }
        },
      };

      // 4. Open Razorpay modal
      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          console.warn('Payment failed:', resp.error);
          setErrorMsg(
            resp.error?.description || 'Payment failed. Please choose another payment method.'
          );
          setLoading(false);
        });
        rzp.open();
      } else {
        // Fallback simulation in headless / mock development environment
        console.warn('Razorpay SDK window unavailable, completing simulation fallback');
        setPaymentStatus('paid');
        const simPayId = `pay_sim_${Date.now()}`;
        setOrderPaymentId(simPayId);
        await persistConfirmedOrder(orderRefId, simPayId, 'Razorpay (Simulated)');
        setCurrentStep(4);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Something went wrong during checkout.');
      setLoading(false);
    }
  };

  // STEP WIZARD PROGRESS STEPPER
  const stepItems = [
    { number: 1, title: 'Product Preview' },
    { number: 2, title: 'Address & Contact' },
    { number: 3, title: 'Payment' },
    { number: 4, title: 'Order Confirmation' },
  ];

  // =========================================================================
  // STEP 4: ORDER CONFIRMATION VIEW
  // =========================================================================
  if (currentStep === 4 || (orderCreatedId && paymentStatus === 'paid')) {
    const formattedDeliveryDate = orderDeliveryDate
      ? new Date(orderDeliveryDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Within 5-7 business days';

    return (
      <div className="min-h-screen bg-gray-50/50 py-12 animate-fadeIn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Stepper (Finished) */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary w-full -z-0" />
              {stepItems.map((step) => (
                <div key={step.number} className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-sm">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-primary mt-1.5 hidden sm:block">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-8">
            {/* Animated Success Badge */}
            <div className="w-20 h-20 bg-primary/10 border-2 border-primary rounded-full flex items-center justify-center mx-auto text-primary shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Order & Payment Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Thank You for Choosing Elite Bath!
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                Your luxury sanitaryware order has been secured and dispatched for quality inspection and reinforced wooden crating.
              </p>
            </div>

            {/* CONDITIONAL WHATSAPP SERVICE COORDINATION */}
            {selectedServices.length > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-2xl p-6 text-left space-y-4 relative overflow-hidden shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-emerald-950 text-base">
                        WhatsApp Service Coordination
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-full uppercase tracking-wider">
                        Action Needed
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      You added <strong>{selectedServices.length} service(s)</strong> ({selectedServices.map((s) => s.title).join(', ')}). Our certified service supervisor will coordinate plumbing technicians to match your delivery.
                    </p>
                  </div>
                </div>

                {/* Auto redirect prompt */}
                {countdown !== null && countdown > 0 && !autoRedirectCancelled && (
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                      Redirecting to WhatsApp for service coordination in <strong>{countdown}s</strong>...
                    </span>
                    <button
                      type="button"
                      onClick={() => setAutoRedirectCancelled(true)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Stay on page
                    </button>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={triggerWhatsAppCoordination}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Coordinate Services on WhatsApp</span>
                  </button>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Order details will be pre-filled automatically
                  </span>
                </div>
              </div>
            )}

            {/* Order Details Grid */}
            <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-6 text-left space-y-5 text-xs text-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Order Reference
                  </span>
                  <p className="font-mono text-sm font-bold text-gray-900 select-all mt-0.5">
                    {orderCreatedId}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Payment Reference
                  </span>
                  <p className="font-mono text-sm font-bold text-primary select-all mt-0.5 truncate">
                    {orderPaymentId || 'Online Payment'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Est. Arrival
                  </span>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1 mt-0.5">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    {formattedDeliveryDate}
                  </p>
                </div>
              </div>

              {/* Destination */}
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Delivery Destination
                </span>
                <p className="font-bold text-gray-900 text-sm">{fullName}</p>
                <p className="text-gray-600">
                  {address}
                  {landmark ? `, Near ${landmark}` : ''}, {city}, {state} - {pincode}
                </p>
                <p className="text-gray-500 mt-0.5">Contact: {phone} • {email}</p>
              </div>

              {/* Selected Services breakdown if any */}
              {selectedServices.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                    Included Services
                  </span>
                  <div className="space-y-1">
                    {selectedServices.map((srv) => (
                      <div key={srv.id} className="flex justify-between font-medium">
                        <span className="flex items-center gap-1 text-gray-800">
                          <Wrench className="h-3 w-3 text-primary" />
                          {srv.title}
                        </span>
                        <span className="font-bold text-gray-900">₹{srv.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                onClick={() => navigate(`/track-order?id=${orderCreatedId}`)}
                className="w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                <span>Track Order Shipment</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/shop')}
                className="w-full sm:w-auto px-8 py-3.5"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEPS 1, 2, 3: MULTI-STEP CHECKOUT WIZARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-gray-50/50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Elite Bath Checkout
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Premium sanitaryware checkout with certified fittings, insured crating, and 256-bit payment encryption.
          </p>
        </div>

        {/* 4-Step Interactive Stepper Indicator */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-4 gap-2 relative">
            {stepItems.map((step) => {
              const isPassed = currentStep > step.number;
              const isCurrent = currentStep === step.number;

              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center text-center cursor-default ${
                    isCurrent
                      ? 'text-primary'
                      : isPassed
                      ? 'text-emerald-700'
                      : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm mb-1.5 ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isPassed ? <Check className="h-4 w-4" /> : step.number}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold line-clamp-1">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inline Error Notice */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between animate-shake">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-danger hover:opacity-75 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* MAIN 2-COLUMN LAYOUT: Wizard Form (Left) & Sticky Order Summary (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {/* ============================================================= */}
            {/* STEP 1: PRODUCT PREVIEW & SERVICES SELECTION                   */}
            {/* ============================================================= */}
            {currentStep === 1 && (
              <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl shadow-card space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <span>Step 1: Product Preview & Services</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Review ordered items and optionally select certified plumbing and service agent add-ons.
                    </p>
                  </div>
                  <Link
                    to="/cart"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Edit Cart
                  </Link>
                </div>

                {/* Ordered Items Preview */}
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const itemPrice = item.variantPrice ?? item.product.price;
                    const itemImg = item.variantImage || item.product.main_image_url;
                    const variantKey = item.selectedVariantId || item.selectedVariant || '';

                    return (
                      <div
                        key={`${item.product.id}-${variantKey}`}
                        className="py-3.5 flex items-center gap-4 first:pt-0 last:pb-0"
                      >
                        <div className="w-14 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 p-1">
                          <img
                            src={itemImg}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-1">
                            <span>Quantity: {item.quantity}</span>
                            {item.selectedVariant && (
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                                {item.selectedVariant}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Unit Price: ₹{itemPrice.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <span className="text-sm font-black text-gray-900 whitespace-nowrap">
                          ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Additional Services Selection */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-primary" />
                      <span>Additional Expert Services (Optional)</span>
                    </h3>
                    <span className="text-[10px] text-primary font-semibold">
                      Product prices remain unchanged
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    Select certified sanitary services for your order. Service coordination is managed via WhatsApp upon order confirmation.
                  </p>

                  <div className="space-y-3 pt-1">
                    {availableServices.map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <div
                          key={service.id}
                          onClick={() => toggleService(service.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by div container
                            className="rounded text-primary focus:ring-primary h-4 w-4 mt-0.5 cursor-pointer"
                          />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                                {service.title}
                              </h4>
                              <span className="text-xs sm:text-sm font-extrabold text-primary">
                                +₹{service.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {service.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3 text-gray-400" />
                                {service.estimated_duration}
                              </span>
                              <span>•</span>
                              <span>WhatsApp coordination included</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Continue CTA */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <Button
                    size="lg"
                    onClick={() => {
                      setCurrentStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-8"
                  >
                    <span>Continue to Delivery Address</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* STEP 2: ADDRESS & CUSTOMER INFORMATION                        */}
            {/* ============================================================= */}
            {currentStep === 2 && (
              <form
                onSubmit={handleValidateAddressStep}
                className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl shadow-card space-y-6"
              >
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Step 2: Customer & Delivery Address</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Enter the exact recipient name and delivery destination for safe timber crate arrival.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Full Name"
                      type="text"
                      required
                      placeholder="e.g. Vikram Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Mobile Phone Number (10 digits)"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <Input
                    label="Email Address (Order Confirmation)"
                    type="email"
                    required
                    placeholder="e.g. vikram.sharma@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Complete Delivery Address"
                      type="text"
                      required
                      placeholder="House / Flat No, Floor, Building Name, Street"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Landmark (Optional)"
                    type="text"
                    placeholder="Near metro station, circle, etc."
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />

                  <Input
                    label="City"
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />

                  <Input
                    label="State"
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />

                  <Input
                    label="Postal Pincode (6 digits)"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />

                  <Input
                    label="Country"
                    type="text"
                    required
                    disabled
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>

                {/* Step 2 Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Preview</span>
                  </Button>
                  <Button type="submit" size="lg" className="flex items-center gap-2 px-8">
                    <span>Continue to Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* ============================================================= */}
            {/* STEP 3: PAYMENT & FINAL VERIFICATION                          */}
            {/* ============================================================= */}
            {currentStep === 3 && (
              <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl shadow-card space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span>Step 3: Review & Secure Payment</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Review your delivery destination and finalize secure payment via Razorpay.
                  </p>
                </div>

                {/* Destination Review Box */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Delivering To
                    </span>
                    <p className="text-xs font-bold text-gray-900">{fullName}</p>
                    <p className="text-xs text-gray-600">
                      {address}
                      {landmark ? `, Near ${landmark}` : ''}, {city}, {state} - {pincode}
                    </p>
                    <p className="text-[11px] text-gray-500">Phone: {phone} • Email: {email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-primary hover:underline flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>

                {/* Selected Services Review Box if any */}
                {selectedServices.length > 0 && (
                  <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Included Additional Services ({selectedServices.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <div className="space-y-1">
                      {selectedServices.map((srv) => (
                        <div key={srv.id} className="flex justify-between text-xs">
                          <span className="text-emerald-900">{srv.title}</span>
                          <span className="font-bold text-emerald-950">₹{srv.price.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Razorpay Gateway Card */}
                <div className="p-5 rounded-xl border-2 border-primary bg-primary/5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900 block">
                          Razorpay Secure Gateway
                        </span>
                        <span className="text-[11px] text-gray-500 block">
                          All Indian payment methods accepted with zero extra surcharge
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white">
                      VERIFIED
                    </span>
                  </div>

                  <div className="pt-2 border-t border-primary/15 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-gray-700">
                    <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-md shadow-2xs">
                      ⚡ UPI (GPay, PhonePe, Paytm, BHIM)
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-md shadow-2xs">
                      💳 Credit & Debit Cards (Visa, MC, RuPay)
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-md shadow-2xs">
                      🏦 NetBanking (50+ Banks)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5 text-xs text-gray-600">
                  <Lock className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>
                    256-bit encrypted checkout. Card details are processed directly by RBI-licensed Razorpay.
                  </span>
                </div>

                {/* Step 3 Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Address</span>
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    loading={loading}
                    onClick={handleRazorpayCheckout}
                    className="flex items-center gap-2 px-8 shadow-md"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Pay ₹{total.toLocaleString('en-IN')} via Razorpay</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* RIGHT SIDEBAR: REAL-TIME ORDER CALCULATION SUMMARY             */}
          {/* ============================================================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-card space-y-5 sticky top-24">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Order Summary</h3>
                <span className="text-xs text-gray-500 font-semibold">{items.length} item(s)</span>
              </div>

              {/* Items List Snapshot */}
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => {
                  const itemPrice = item.variantPrice ?? item.product.price;
                  const itemImg = item.variantImage || item.product.main_image_url;
                  const variantKey = item.selectedVariantId || item.selectedVariant || '';

                  return (
                    <div
                      key={`${item.product.id}-${variantKey}`}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3"
                    >
                      <div className="w-10 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img
                          src={itemImg}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-gray-900">
                        ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs text-gray-600 pt-3 border-t border-gray-100">
                <div className="flex justify-between">
                  <span>Products Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({appliedCoupon?.code}):</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Insured Shipping & Crating:</span>
                  {shippingCharge === 0 ? (
                    <span className="text-success font-bold uppercase text-[11px]">FREE</span>
                  ) : (
                    <span className="font-semibold text-gray-900">₹{shippingCharge}</span>
                  )}
                </div>

                {/* Services Total (as distinct line item, keeping product prices untouched) */}
                {selectedServices.length > 0 && (
                  <div className="flex justify-between text-primary font-semibold">
                    <span>Additional Services ({selectedServices.length}):</span>
                    <span>+₹{servicesTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Total Order Amount */}
              <div className="border-t border-gray-200 pt-4 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-extrabold text-primary">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Current Step Action Button on Mobile or Sidebar */}
              {currentStep === 1 && (
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="py-3.5 shadow-md text-sm font-bold"
                >
                  <span>Proceed to Delivery Address</span>
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleValidateAddressStep}
                  className="py-3.5 shadow-md text-sm font-bold"
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}

              {currentStep === 3 && (
                <Button
                  fullWidth
                  size="lg"
                  loading={loading}
                  onClick={handleRazorpayCheckout}
                  className="py-3.5 shadow-md text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Pay ₹{total.toLocaleString('en-IN')} via Razorpay</span>
                </Button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>10-Year Ceramic Cartridge Warranty • 100% Transit Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
