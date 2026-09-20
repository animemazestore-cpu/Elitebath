import React, { useState } from 'react';
import { Search, MapPin, Calendar, Clock, ShieldAlert, ShoppingBag, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/database';
import { TrackingStepper } from '../components/order/TrackingStepper';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const TrackOrder: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searched, setSearched] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !contactInfo.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setOrder(null);
    setSearched(true);

    const cleanOrderId = orderId.trim();
    const cleanContact = contactInfo.trim().toLowerCase();

    try {
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

      if (error) throw error;

      if (dbOrder) {
        const matchesEmail = dbOrder.shipping_address?.email?.toLowerCase() === cleanContact;
        const matchesPhone = dbOrder.shipping_address?.phone === cleanContact;

        if (matchesEmail || matchesPhone) {
          const mappedItems = dbOrder.items?.map((item: any) => ({
            ...item,
            price: Number(item.price),
            product: item.product ? {
              ...item.product,
              price: Number(item.product.price)
            } : undefined
          }));

          setOrder({
            ...dbOrder,
            items: mappedItems
          } as Order);
        } else {
          setErrorMsg('Order ID found, but contact information (Email/Phone) does not match.');
        }
      } else {
        setErrorMsg('No order found with the specified Order ID and Contact Information.');
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      setErrorMsg('Failed to fetch tracking details. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2.5">
          <Search className="h-7 w-7 text-primary" />
          <span>Track Your Order Journey</span>
        </h1>
        <p className="text-sm text-gray-600">
          Enter your Order ID (received during checkout) and checkout email or phone number to track shipment progress.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-8 border border-gray-200 rounded-2xl shadow-sm max-w-2xl mx-auto">
        <form onSubmit={handleTrackSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Order ID"
              type="text"
              required
              placeholder="e.g. order-171893040..."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <Input
              label="Email Address / Phone"
              type="text"
              required
              placeholder="customer@example.com / +91..."
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>
          <Button type="submit" fullWidth loading={loading}>
            Track Shipment Status
          </Button>
        </form>
      </div>

      {errorMsg && (
        <div className="max-w-2xl mx-auto p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl text-xs sm:text-sm font-semibold flex items-start space-x-2">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {searched && !loading && order && (
        <div className="space-y-8 animate-fadeIn">
          <div className="glass-card p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                  Order Details
                </span>
                <h3 className="text-sm font-bold text-gray-900 mt-0.5">ID: <code className="font-mono text-primary select-all">{order.id}</code></h3>
              </div>
              
              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Placed: {new Date(order.created_at).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>Shipping: {order.shipping_address?.city}, {order.shipping_address?.state}</span>
                </span>
                {order.estimated_delivery_date && (
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">
                      Est. Delivery: {new Date(order.estimated_delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left md:text-right space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                Grand Total Amount
              </span>
              <p className="text-2xl font-extrabold text-gray-900">₹{order.total_amount}</p>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-6 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Real-Time Shipment Progress</span>
            </h3>
            
            <TrackingStepper 
              status={order.status} 
              trackingInfo={(order.shipping_address as any)?.tracking_info} 
            />
          </div>

          <div className="glass-card p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span>Shipment Package Items ({order.items?.length || 0})</span>
            </h3>

            <div className="divide-y divide-gray-200">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={item.product?.main_image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.product?.name || 'Sanitary Fitting'}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>Qty: {item.quantity} x ₹{item.price}</span>
                        {(item as any).selected_variant && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[9px]">
                            {(item as any).selected_variant}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-extrabold text-gray-900 text-sm">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
