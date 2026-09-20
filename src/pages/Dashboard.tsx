import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/database';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { User, ShoppingBag, Heart, Settings, CreditCard, ChevronDown, ChevronUp, RefreshCcw, X, Truck } from 'lucide-react';
import { TrackingStepper } from '../components/order/TrackingStepper';


export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const { user, profile, updateProfile, initialized } = useAuthStore();
  const { items: wishlistItems, fetchWishlist, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Edit Profile States
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Replacement Request States
  const [replacementOrderId, setReplacementOrderId] = useState<string | null>(null);
  const [replacementReason, setReplacementReason] = useState('Damaged Item');
  const [replacementDesc, setReplacementDesc] = useState('');
  const [replacementPhoto, setReplacementPhoto] = useState<File | null>(null);
  const [replacementSubmitting, setReplacementSubmitting] = useState(false);
  const [replacementSuccess, setReplacementSuccess] = useState(false);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/auth?redirect=/dashboard');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Fetch wishlist & orders
  useEffect(() => {
    if (!user) return;

    fetchWishlist(user.id);

    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        let dbOrders: any[] = [];
        try {
          const { data, error } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items (
                *,
                product:products (*)
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            dbOrders = data;
          }
        } catch (dbErr) {
          console.warn('Error fetching user orders from Supabase:', dbErr);
        }

        // Also fetch orders matching user email in shipping_address (in case user purchased as guest or before login)
        if (user.email) {
          try {
            const { data: emailOrders } = await supabase
              .from('orders')
              .select(`
                *,
                items:order_items (
                  *,
                  product:products (*)
                )
              `)
              .filter('shipping_address->>email', 'eq', user.email)
              .order('created_at', { ascending: false });

            if (emailOrders && emailOrders.length > 0) {
              const existingIds = new Set(dbOrders.map((o) => o.id));
              for (const eo of emailOrders) {
                if (!existingIds.has(eo.id)) {
                  dbOrders.push(eo);
                  existingIds.add(eo.id);
                }
              }
            }
          } catch (_) {}
        }

        // Read local offline/resilience orders from localStorage
        let localOrders: any[] = [];
        try {
          const raw =
            localStorage.getItem('elitebath_local_orders') ||
            localStorage.getItem('animemaze_local_orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localOrders = parsed.filter((lo: any) => {
                const matchesUser = lo.user_id === user.id;
                const matchesEmail =
                  user.email &&
                  lo.shipping_address?.email &&
                  String(lo.shipping_address.email).toLowerCase() === user.email.toLowerCase();
                return matchesUser || matchesEmail;
              });
            }
          }
        } catch (e) {
          console.warn('Error reading local orders in dashboard:', e);
        }

        // Combine DB orders & local orders, avoiding duplicates
        const existingRefs = new Set();
        dbOrders.forEach((o) => {
          if (o.id) existingRefs.add(String(o.id).toLowerCase());
          if (o.shipping_address?.order_ref)
            existingRefs.add(String(o.shipping_address.order_ref).toLowerCase());
          if (o.shipping_address?.transactionId)
            existingRefs.add(String(o.shipping_address.transactionId).toLowerCase());
        });

        const normalizedLocalOrders = localOrders
          .filter((lo: any) => {
            const loId = String(lo.id || '').toLowerCase();
            const loRef = String(lo.shipping_address?.order_ref || '').toLowerCase();
            return !existingRefs.has(loId) && (!loRef || !existingRefs.has(loRef));
          })
          .map((lo: any) => ({
            ...lo,
            items: (lo.items || []).map((it: any) => ({
              ...it,
              product: it.product || {
                name: it.product_name || 'Sanitaryware Item',
                main_image_url: it.image_url || '/placeholder.jpg',
                sku: it.sku || null,
                price: Number(it.price || 0),
              },
            })),
          }));

        const combinedRaw = [...dbOrders, ...normalizedLocalOrders].sort((a: any, b: any) => {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA;
        });

        const ordersWithVariantsMapped = combinedRaw.map((order: any) => {
          const itemVariants = order.shipping_address?.item_variants || [];
          const rawItems =
            Array.isArray(order.items) && order.items.length > 0
              ? order.items
              : itemVariants.map((iv: any, idx: number) => ({
                  id: `var-${idx}`,
                  product_id: iv.product_id,
                  price: 0,
                  quantity: 1,
                  selected_variant: iv.selected_variant,
                  product: {
                    name: 'Sanitaryware Fixture',
                    main_image_url: '/placeholder.jpg',
                    price: 0,
                  },
                }));

          return {
            ...order,
            id: order.shipping_address?.order_ref || order.id,
            items: rawItems.map((item: any) => {
              const matchedVariant = itemVariants.find(
                (iv: any) => iv.product_id === item.product_id
              );
              return {
                ...item,
                price: Number(item.price || 0),
                selected_variant:
                  item.selected_variant || matchedVariant?.selected_variant || null,
                product: item.product
                  ? {
                      ...item.product,
                      price: Number(item.product.price || item.price || 0),
                      main_image_url:
                        item.product.main_image_url || item.image_url || '/placeholder.jpg',
                    }
                  : {
                      name: item.product_name || 'Sanitaryware Product',
                      main_image_url: item.image_url || '/placeholder.jpg',
                      price: Number(item.price || 0),
                    },
              };
            }),
          };
        });

        setOrders(ordersWithVariantsMapped as Order[]);
      } catch (err) {
        console.error('Error fetching user orders:', err);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Sync profile details if store changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim()
      });
      setProfileMsg('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      setProfileMsg('Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replacementOrderId) return;
    setReplacementSubmitting(true);
    try {
      let photoUrl: string | null = null;

      // Upload photo if provided
      if (replacementPhoto) {
        const fileExt = replacementPhoto.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        try {
          const { error: uploadErr } = await supabase.storage
            .from('replacement-photos')
            .upload(filePath, replacementPhoto);
          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('replacement-photos')
              .getPublicUrl(filePath);
            photoUrl = publicUrl;
          }
        } catch (_) {}
      }

      const dbPayload = {
        order_id: replacementOrderId,
        user_id: user.id,
        reason: replacementReason,
        description: replacementDesc,
        photo_url: photoUrl,
        status: 'PENDING',
        admin_notes: null
      };

      // Try DB insertion
      const { error: dbErr } = await supabase
        .from('replacement_requests')
        .insert(dbPayload);

      if (dbErr) throw dbErr;

      // Spinner stays active during delay, then modal closes
      setTimeout(() => {
        setReplacementSubmitting(false);
        setReplacementOrderId(null);
        setReplacementDesc('');
        setReplacementPhoto(null);
        setReplacementSuccess(false);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit replacement request.');
      setReplacementSubmitting(false);
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
      case 'PENDING_VERIFICATION': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'PAID': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'PROCESSING': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'PACKED': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'SHIPPED': return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'OUT_FOR_DELIVERY': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'DELIVERED': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'CANCELLED': return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
      case 'PENDING_VERIFICATION': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'PAID':
      case 'COMPLETED': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'FAILED':
      case 'REJECTED': return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            
            {/* User Profile Header */}
            <div className="text-center space-y-3 pb-6 border-b border-gray-200">
              <div className="h-16 w-16 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center text-primary font-bold text-2xl mx-auto overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (profile.full_name || user.email || 'U')[0].toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base truncate">{profile.full_name || 'Elite Customer'}</h3>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Tab buttons */}
            <nav className="flex flex-row lg:flex-col gap-1 w-full overflow-x-auto pb-2 lg:pb-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  activeTab === 'profile' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <User className="h-4.5 w-4.5" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  activeTab === 'orders' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                <span>My Orders</span>
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  activeTab === 'wishlist' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Heart className="h-4.5 w-4.5" />
                <span>Wishlist</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  activeTab === 'settings' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Settings className="h-4.5 w-4.5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-grow">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <User className="h-5.5 w-5.5 text-primary" />
                <span>Profile Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email Address</span>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">User Role</span>
                  <p className="text-gray-900 font-medium capitalize">{profile.role}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Account Created</span>
                  <p className="text-gray-900 font-medium">
                    {profile.created_at && !isNaN(Date.parse(profile.created_at))
                      ? new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Orders */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <ShoppingBag className="h-5.5 w-5.5 text-primary" />
                <span>My Orders</span>
              </h2>

              {ordersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl bg-white p-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-2 w-full">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                          <div className="h-3 bg-gray-100 rounded w-24" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-6 bg-gray-200 rounded w-20" />
                          <div className="h-5 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">You have not placed any orders yet.</p>
                  <Button size="sm" onClick={() => navigate('/shop')}>Browse Collections</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const itemsList = order.items || [];
                    return (
                      <div key={order.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden transition-all">
                        {/* Summary Header */}
                        <div
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Order ID: <span className="font-bold text-gray-900">{order.id}</span></p>
                            <p className="text-xs text-gray-400">Placed on: {order.created_at && !isNaN(Date.parse(order.created_at)) ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</p>
                            {order.estimated_delivery_date && (
                              <p className="text-xs text-primary font-semibold flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                Est. Delivery: {new Date(order.estimated_delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                              to={`/track-order?id=${encodeURIComponent(order.shipping_address?.order_ref || order.id)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Track</span>
                            </Link>

                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${getOrderStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                            
                            <span className="text-sm font-extrabold text-gray-900">₹{order.total_amount}</span>
                            {isExpanded ? <ChevronUp className="h-4.5 w-4.5 text-gray-400" /> : <ChevronDown className="h-4.5 w-4.5 text-gray-400" />}
                          </div>
                        </div>

                        {/* Order Items Details */}
                        {isExpanded && (
                          <div className="p-5 bg-gray-50 border-t border-gray-200 space-y-6 text-sm">
                            <div className="border-b border-gray-200 pb-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Order Shipment Progress:</h4>
                                <Link
                                  to={`/track-order?id=${encodeURIComponent(order.shipping_address?.order_ref || order.id)}`}
                                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                >
                                  Open Full Tracker <Truck className="h-3 w-3" />
                                </Link>
                              </div>
                              <TrackingStepper 
                                status={order.status} 
                                trackingInfo={(order.shipping_address as any)?.tracking_info} 
                              />
                            </div>

                            <div>
                              <h4 className="font-bold text-gray-500 mb-2 text-xs uppercase tracking-wider">Shipping Details:</h4>
                              <p className="text-xs text-gray-700">{order.shipping_address?.fullName} | {order.shipping_address?.phone}</p>
                              <p className="text-xs text-gray-600">{order.shipping_address?.address}, {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
                              {order.shipping_address?.transactionId && (
                                <p className="text-xs text-amber-600 font-mono mt-1 select-all">UPI Transaction ID: {order.shipping_address.transactionId}</p>
                              )}
                            </div>

                            <div className="space-y-2.5">
                              <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Order Items:</h4>
                              {itemsList.map((item, idx) => (
                                <div key={item.id || `${order.id}-item-${idx}`} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                      <img src={item.product?.main_image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1">{item.product?.name || 'Sanitary Product'}</p>
                                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                                        <span>Qty: {item.quantity} x ₹{item.price}</span>
                                        {(item as any).selected_variant && (
                                          <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[9px]">
                                            Option: {(item as any).selected_variant}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="font-bold text-xs sm:text-sm text-gray-900">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2">
                              <span className="text-gray-500 flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5" /> Payment Status:
                              </span>
                              <span className={`font-semibold px-2 py-0.5 rounded border uppercase text-[10px] ${getPaymentStatusColor(order.payment_status)}`}>
                                {order.payment_status.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Request Replacement Button - only for DELIVERED orders */}
                            {order.status === 'DELIVERED' && (
                              <div className="pt-3 border-t border-gray-200">
                                <button
                                  onClick={() => {
                                    setReplacementOrderId(order.id);
                                    setReplacementReason('Damaged Item');
                                    setReplacementDesc('');
                                    setReplacementPhoto(null);
                                    setReplacementSuccess(false);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/25 rounded-lg hover:bg-amber-400/20 transition-all"
                                >
                                  <RefreshCcw className="h-3.5 w-3.5" />
                                  Request Replacement
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Heart className="h-5.5 w-5.5 text-primary" />
                <span>My Wishlist</span>
              </h2>

              {wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-4">Your wishlist is empty.</p>
                  <Button size="sm" onClick={() => navigate('/shop')}>Browse Merch</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {wishlistItems.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden flex flex-col group shadow-sm">
                      <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                        <img src={product.main_image_url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => toggleWishlist(user.id, product)}
                          className="absolute top-3 right-3 p-2 bg-danger/25 text-danger rounded-full border border-danger/30"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                      </div>

                      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-primary">
                            <Link to={`/product/${product.slug}`}>{product.name}</Link>
                          </h4>
                          <p className="font-bold text-xs text-gray-400 mt-1">₹{product.price}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            fullWidth
                            onClick={() => {
                              addItem(product, 1);
                              alert('Added to cart!');
                            }}
                          >
                            Add To Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Settings (Edit Profile) */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Settings className="h-5.5 w-5.5 text-primary" />
                <span>Account Settings</span>
              </h2>

              {profileMsg && (
                <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-sm font-semibold rounded-xl">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                <Input
                  label="Display Name"
                  type="text"
                  required
                  placeholder="Rajesh Mehra"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <Input
                  label="Avatar Image URL"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  helperText="Leave empty to use default initials icon."
                />

                <Button type="submit" loading={profileSaving}>
                  Save Changes
                </Button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Replacement Request Modal */}
      {replacementOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <button
              onClick={() => setReplacementOrderId(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full border border-gray-200 bg-gray-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
                <RefreshCcw className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Request Replacement</h3>
                <p className="text-xs text-gray-500">Order #{replacementOrderId.slice(-8)}</p>
              </div>
            </div>

            {replacementSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto">
                  <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-900 font-bold">Request Submitted!</p>
                <p className="text-xs text-gray-400">Our team will review your request and get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleReplacementSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Reason for Replacement</label>
                  <select
                    value={replacementReason}
                    onChange={(e) => setReplacementReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option>Damaged Item</option>
                    <option>Wrong Item Received</option>
                    <option>Missing Item</option>
                    <option>Poor Quality</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Describe the Issue</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Please describe what went wrong in detail..."
                    value={replacementDesc}
                    onChange={(e) => setReplacementDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Attach Photo (Optional)</label>
                  {replacementPhoto ? (
                    <div className="flex items-center gap-3">
                      <img src={URL.createObjectURL(replacementPhoto)} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                      <button type="button" onClick={() => setReplacementPhoto(null)} className="text-xs text-danger hover:underline">Remove</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-300 hover:border-primary cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-400">Click to upload a photo of the issue</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setReplacementPhoto(e.target.files[0])} />
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setReplacementOrderId(null)} fullWidth>Cancel</Button>
                  <Button type="submit" loading={replacementSubmitting} fullWidth>Submit Request</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
