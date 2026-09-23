import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  ShieldAlert,
  ShoppingBag,
  Truck,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { Order } from '../types/database';
import { TrackingStepper } from '../components/order/TrackingStepper';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const TrackOrder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const queryId = searchParams.get('id') || searchParams.get('orderId') || '';
  const queryContact = searchParams.get('contact') || searchParams.get('email') || searchParams.get('phone') || '';

  const [orderId, setOrderId] = useState(queryId);
  const [contactInfo, setContactInfo] = useState(queryContact || user?.email || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searched, setSearched] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Helper to search local device orders store
  const findInLocalOrders = (cleanId: string): any | null => {
    try {
      const raw =
        localStorage.getItem('elitebath_local_orders') ||
        localStorage.getItem('animemaze_local_orders');
      if (!raw) return null;
      const parsed: any[] = JSON.parse(raw);
      return (
        parsed.find((o) => {
          const oId = String(o.id || '').toLowerCase().trim();
          const oRef = String(o.shipping_address?.order_ref || '').toLowerCase().trim();
          const oTx = String(o.shipping_address?.transactionId || '').toLowerCase().trim();
          const oTrack = String(o.tracking_number || '').toLowerCase().trim();
          const target = cleanId.toLowerCase().trim();

          return oId === target || oRef === target || oTx === target || oTrack === target;
        }) || null
      );
    } catch (e) {
      console.warn('Error reading local orders storage:', e);
      return null;
    }
  };

  const executeTrack = async (targetId: string, targetContact: string) => {
    const cleanOrderId = targetId.trim();
    const cleanContact = targetContact.trim().toLowerCase();

    if (!cleanOrderId) {
      setErrorMsg('Please enter a valid Order ID.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrder(null);
    setSearched(true);

    try {
      let foundOrder: any = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleanOrderId);

      // 1. Attempt Supabase lookup
      try {
        if (isUuid) {
          const { data: dbOrder, error } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items (
                *,
                product:products (*)
              )
            `)
            .eq('id', cleanOrderId)
            .maybeSingle();

          if (!error && dbOrder) {
            foundOrder = dbOrder;
          }
        } else {
          // If not UUID, query shipping_address->>order_ref
          const { data: dbOrders, error } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items (
                *,
                product:products (*)
              )
            `)
            .filter('shipping_address->>order_ref', 'eq', cleanOrderId)
            .limit(1);

          if (!error && dbOrders && dbOrders.length > 0) {
            foundOrder = dbOrders[0];
          } else {
            // Also check tracking_number
            const { data: trackOrders } = await supabase
              .from('orders')
              .select(`
                *,
                items:order_items (
                  *,
                  product:products (*)
                )
              `)
              .eq('tracking_number', cleanOrderId)
              .limit(1);

            if (trackOrders && trackOrders.length > 0) {
              foundOrder = trackOrders[0];
            }
          }
        }
      } catch (dbErr) {
        console.warn('Supabase order tracking query warning:', dbErr);
      }

      // 2. If not found in DB or DB inaccessible, check local resilient storage
      const localMatch = findInLocalOrders(cleanOrderId);
      if (!foundOrder && localMatch) {
        foundOrder = localMatch;
      }

      if (!foundOrder) {
        setErrorMsg(
          `No order found with Order ID "${cleanOrderId}". Please verify the ID from your confirmation email/SMS or checkout screen.`
        );
        return;
      }

      // 3. Contact verification
      const orderEmail = String(foundOrder.shipping_address?.email || '').toLowerCase().trim();
      const orderPhone = String(foundOrder.shipping_address?.phone || '').replace(/\D/g, '');
      const contactDigits = cleanContact.replace(/\D/g, '');

      const isOwnerLoggedIn = Boolean(user?.id && foundOrder.user_id === user.id);
      const isDeviceLocal = Boolean(localMatch);

      if (cleanContact) {
        const matchesEmail = orderEmail === cleanContact;
        const matchesPhone = contactDigits.length >= 6 && orderPhone.endsWith(contactDigits);

        if (!matchesEmail && !matchesPhone && !isOwnerLoggedIn && !isDeviceLocal) {
          setErrorMsg('Order ID found, but the provided Email / Phone does not match order records.');
          return;
        }
      }

      // 4. Map & normalize items
      let rawItems: any[] = [];
      if (Array.isArray(foundOrder.items) && foundOrder.items.length > 0) {
        rawItems = foundOrder.items;
      } else if (foundOrder.shipping_address?.item_variants && Array.isArray(foundOrder.shipping_address.item_variants)) {
        rawItems = foundOrder.shipping_address.item_variants.map((iv: any, i: number) => ({
          id: `item-var-${i}`,
          product_id: iv.product_id,
          quantity: 1,
          price: 0,
          selected_variant: iv.selected_variant,
          product: {
            name: 'Apparel Item',
            main_image_url: '/placeholder.jpg',
            price: 0
          }
        }));
      }

      const mappedItems = rawItems.map((item: any) => ({
        ...item,
        price: Number(item.price || 0),
        product: item.product ? {
          ...item.product,
          price: Number(item.product.price || item.price || 0),
          main_image_url: item.product.main_image_url || item.image_url || '/placeholder.jpg'
        } : {
          name: item.product_name || 'Apparel Item',
          main_image_url: item.image_url || '/placeholder.jpg',
          price: Number(item.price || 0)
        }
      }));

      setOrder({
        ...foundOrder,
        id: foundOrder.shipping_address?.order_ref || foundOrder.id,
        items: mappedItems,
        total_amount: Number(foundOrder.total_amount || 0)
      } as Order);

      // Auto-populate contact if it was empty
      if (!contactInfo && orderEmail) {
        setContactInfo(orderEmail);
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      setErrorMsg('Failed to fetch tracking details. Please verify your connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-track if URL query params exist on mount
  useEffect(() => {
    if (queryId) {
      setOrderId(queryId);
      executeTrack(queryId, queryContact || user?.email || '');
    }
  }, [queryId]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTrack(orderId, contactInfo);
  };

  const copyShareLink = () => {
    const currentUrl = `${window.location.origin}/track-order?id=${encodeURIComponent(order?.id || orderId)}`;
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const trackingInfo = (order?.shipping_address as any)?.tracking_info || {
    carrier: (order as any)?.tracking_carrier,
    tracking_number: (order as any)?.tracking_number
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-2">
          <Truck className="h-3.5 w-3.5" />
          Live Logistics Status
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2.5">
          <span>Track Your Shipment</span>
        </h1>
        <p className="text-sm text-gray-600">
          Enter your Order ID (e.g. <code className="font-mono text-primary font-semibold">ord-172...</code>) and your registered Email or Phone number to view live status.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-8 border border-gray-200 rounded-2xl shadow-sm max-w-2xl mx-auto bg-white">
        <form onSubmit={handleTrackSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Order ID / Reference"
              type="text"
              required
              placeholder="e.g. ord-1726857123-ab3f"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              helperText="Find this on your receipt or dashboard"
            />
            <Input
              label="Email or Mobile Phone (Optional)"
              type="text"
              placeholder="name@example.com / 9876543210"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              helperText="Used to verify order ownership"
            />
          </div>
          <Button type="submit" fullWidth loading={loading} className="py-3">
            <Search className="h-4 w-4 mr-2" />
            Track Shipment Status
          </Button>
        </form>
      </div>

      {errorMsg && (
        <div className="max-w-2xl mx-auto p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl text-xs sm:text-sm font-semibold flex items-start space-x-3">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>{errorMsg}</p>
            {user && (
              <p className="text-xs font-normal text-gray-600">
                You can also view all your confirmed orders directly on your{' '}
                <Link to="/dashboard?tab=orders" className="underline font-bold text-primary">
                  User Dashboard Orders
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      )}

      {searched && !loading && order && (
        <div className="space-y-8 animate-fadeIn">
          {/* Order Header Summary Card */}
          <div className="glass-card p-6 rounded-2xl border border-gray-200 shadow-sm bg-white flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    Order Reference
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                    <code className="font-mono text-primary select-all bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                      {order.id}
                    </code>
                    <button
                      onClick={copyShareLink}
                      className="p-1.5 text-gray-400 hover:text-primary rounded-lg border border-gray-200 hover:border-primary transition-all text-xs flex items-center gap-1"
                      title="Copy direct tracking link"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Placed: {new Date(order.created_at).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>
                    Destination: {order.shipping_address?.city}, {order.shipping_address?.state}
                  </span>
                </span>
                {order.estimated_delivery_date && (
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="font-bold text-primary">
                      Est. Delivery:{' '}
                      {new Date(order.estimated_delivery_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left md:text-right space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                Grand Total
              </span>
              <p className="text-2xl font-extrabold text-gray-900">₹{order.total_amount}</p>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                {order.payment_status?.replace('_', ' ') || 'PAID'}
              </span>
            </div>
          </div>

          {/* Real-time Progress Stepper */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Logistics Journey</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Status: {order.status?.replace('_', ' ')}
              </span>
            </div>

            <TrackingStepper
              status={order.status}
              trackingInfo={trackingInfo}
            />
          </div>

          {/* Delivery Address & Package Items Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shipping Recipient Info */}
            <div className="glass-card p-6 rounded-2xl border border-gray-200 shadow-sm bg-white space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Shipping Address</span>
              </h3>
              <div className="space-y-1 text-xs text-gray-600">
                <p className="font-bold text-gray-900 text-sm">
                  {order.shipping_address?.fullName}
                </p>
                <p>{order.shipping_address?.address}</p>
                {order.shipping_address?.landmark && (
                  <p className="text-gray-500">Near: {order.shipping_address.landmark}</p>
                )}
                <p>
                  {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
                </p>
                <p className="pt-2 text-gray-500 font-medium">
                  Contact: {order.shipping_address?.phone}
                </p>
                {order.shipping_address?.email && (
                  <p className="text-gray-500 font-medium">{order.shipping_address.email}</p>
                )}
              </div>
            </div>

            {/* Package Items */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-gray-200 shadow-sm bg-white space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>Package Contents ({order.items?.length || 0})</span>
              </h3>

              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto pr-1">
                {order.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                        <img
                          src={item.product?.main_image_url || '/placeholder.jpg'}
                          alt={item.product?.name || ''}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1">
                          {item.product?.name || 'Apparel Item'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>
                            Qty: {item.quantity} x ₹{item.price}
                          </span>
                          {(item as any).selected_variant && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[9px]">
                              {(item as any).selected_variant}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-extrabold text-gray-900 text-sm">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
