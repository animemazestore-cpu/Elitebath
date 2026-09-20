import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { CartItemSkeleton } from '../components/skeleton/CartItemSkeleton';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount, getTotalItems } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(() => {
    return JSON.parse(localStorage.getItem('elitebath_applied_coupon') || localStorage.getItem('animemaze_applied_coupon') || 'null');
  });
  const [couponError, setCouponError] = useState('');
  const [dbCoupons, setDbCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const subtotal = getTotalAmount();

  // Fetch coupons from database
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const { data: coupons, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('active', true);
        
        if (error) throw error;
        
        const mappedCoupons = coupons ? coupons.map((c: any) => ({
          id: c.id,
          code: c.code,
          type: c.discount_type || c.type,
          value: Number(c.discount_value !== undefined ? c.discount_value : c.value),
          minOrder: Number(c.min_order_amount !== undefined ? c.min_order_amount : c.min_order),
          active: c.active,
          created_at: c.created_at
        })) : [];
        
        setDbCoupons(mappedCoupons);
      } catch (err) {
        console.warn('Failed to fetch coupons from DB:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoupons();
  }, []);

  // Auto-remove coupon if subtotal falls below minimum order amount
  React.useEffect(() => {
    if (appliedCoupon && appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) {
      setAppliedCoupon(null);
      localStorage.removeItem('elitebath_applied_coupon');
      localStorage.removeItem('animemaze_applied_coupon');
      setCouponError(`Coupon removed: requires a minimum order of ₹${appliedCoupon.minOrder}`);
    }
  }, [subtotal, appliedCoupon]);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    const localCoupons = JSON.parse(localStorage.getItem('elitebath_coupons') || localStorage.getItem('animemaze_coupons') || '[]');
    const defaultCoupons = [
      { code: 'ELITE10', type: 'PERCENT', value: 10, minOrder: 0, active: true },
      { code: 'LUXURY20', type: 'PERCENT', value: 20, minOrder: 5000, active: true },
      { code: 'BATH500', type: 'FIXED', value: 500, minOrder: 2500, active: true },
      { code: 'FREESHIP', type: 'FIXED', value: 99, minOrder: 0, active: true }
    ];

    const allCoupons = [...defaultCoupons, ...dbCoupons];
    localCoupons.forEach((c: any) => {
      if (!allCoupons.some(ac => ac.code === c.code)) {
        allCoupons.push(c);
      } else {
        const idx = allCoupons.findIndex(ac => ac.code === c.code);
        if (idx >= 0) allCoupons[idx] = { ...allCoupons[idx], ...c };
      }
    });

    const coupon = allCoupons.find(c => c.code === code);
    if (!coupon) {
      setCouponError('Invalid coupon code!');
      setAppliedCoupon(null);
      localStorage.removeItem('elitebath_applied_coupon');
      localStorage.removeItem('animemaze_applied_coupon');
      return;
    }

    if (coupon.active === false) {
      setCouponError('This coupon is currently disabled.');
      setAppliedCoupon(null);
      localStorage.removeItem('elitebath_applied_coupon');
      localStorage.removeItem('animemaze_applied_coupon');
      return;
    }

    if (coupon.minOrder && subtotal < coupon.minOrder) {
      setCouponError(`This coupon requires a minimum order of ₹${coupon.minOrder}`);
      setAppliedCoupon(null);
      localStorage.removeItem('elitebath_applied_coupon');
      localStorage.removeItem('animemaze_applied_coupon');
      return;
    }

    setAppliedCoupon(coupon);
    localStorage.setItem('elitebath_applied_coupon', JSON.stringify(coupon));
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('elitebath_applied_coupon');
    localStorage.removeItem('animemaze_applied_coupon');
    setCouponError('');
  };

  let discountAmount = 0;
  if (appliedCoupon && appliedCoupon.active !== false && (!appliedCoupon.minOrder || subtotal >= appliedCoupon.minOrder)) {
    if (appliedCoupon.type === 'PERCENT') {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === 'FIXED') {
      discountAmount = Math.min(subtotal, appliedCoupon.value);
    }
  }

  // Calculate shipping: use per-product shipping_fee when defined, otherwise apply global rule
  const shippingCharge = (() => {
    let totalShipping = 0;
    let hasProductShippingFees = false;
    for (const item of items) {
      const fee = item.product.shipping_fee;
      // If shipping_fee is defined (even as 0), admin has set it — use it
      if (fee !== undefined && fee !== null) {
        hasProductShippingFees = true;
        totalShipping += Number(fee) * item.quantity;
      }
    }
    // If any product has an explicit shipping_fee (including 0 = free), use that total
    if (hasProductShippingFees) return totalShipping;
    // Fallback: global rule for legacy products without shipping_fee
    return subtotal >= 999 ? 0 : 99;
  })();
  const total = Math.max(0, subtotal - discountAmount) + shippingCharge;

  const handleCheckoutClick = () => {
    if (!user) {
      navigate('/auth?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8 text-sm">Explore our curated collection of architectural faucets, rainfall showers, designer basins, and luxury bath accessories.</p>
        <Link to="/shop">
          <Button fullWidth>Browse Sanitary Collections</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-500">{getTotalItems()} Items</span>
            <button
              onClick={clearCart}
              className="text-xs text-danger hover:underline font-semibold"
            >
              Clear Cart
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                <CartItemSkeleton />
                <CartItemSkeleton />
                <CartItemSkeleton />
              </>
            ) : items.map((item) => {
              const itemPrice = item.variantPrice ?? item.product.price;
              const itemImage = item.variantImage || item.product.main_image_url;
              const variantIdentifier = item.selectedVariantId || item.selectedVariant;

              return (
                <div
                  key={`${item.product.id}-${variantIdentifier || ''}`}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                >
                  {/* Product Image */}
                  <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={itemImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow text-center sm:text-left space-y-1">
                    <h3 className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-1">
                      <Link to={`/product/${item.product.slug}`}>{item.product.name}</Link>
                    </h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                      <span className="text-gray-900 font-semibold">₹{itemPrice.toLocaleString('en-IN')}</span>
                      {item.selectedVariant && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px]">
                          {item.selectedVariant}
                        </span>
                      )}
                      {(item.variantSku || item.product.sku) && (
                        <span className="text-gray-400 font-mono text-[10px]">
                          SKU: {item.variantSku || item.product.sku}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, variantIdentifier)}
                      className="px-2.5 py-1 text-gray-400 hover:text-gray-900"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, variantIdentifier)}
                      className="px-2.5 py-1 text-gray-400 hover:text-gray-900"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto">
                    <span className="font-extrabold text-sm text-gray-900">
                      ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => removeItem(item.product.id, variantIdentifier)}
                      className="text-gray-500 hover:text-danger transition-colors p-1"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-gray-900 font-semibold">₹{subtotal}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount ({appliedCoupon?.code}):</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping:</span>
                {shippingCharge === 0 ? (
                  <span className="text-success font-bold">FREE</span>
                ) : (
                  <span className="text-gray-900 font-semibold">₹{shippingCharge}</span>
                )}
              </div>

              {shippingCharge > 0 && (
                <div className="text-[10px] text-primary italic leading-tight">
                  Add ₹{999 - subtotal} more to unlock FREE shipping!
                </div>
              )}
            </div>

            {/* Coupon input */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Apply Promo Coupon</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-600 font-medium">
                  <div className="flex flex-col">
                    <span className="font-extrabold">{appliedCoupon.code} Applied!</span>
                    <span className="text-[10px] text-emerald-600/80">
                      {appliedCoupon.type === 'PERCENT' ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`}
                    </span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-danger font-bold uppercase hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ELITE10, LUXURY20..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-grow bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary text-gray-900 placeholder-gray-500 uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-semibold rounded-xl text-gray-900 transition-all"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-[10px] text-danger font-semibold">{couponError}</p>}
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between text-base font-extrabold text-gray-900">
              <span>Total Amount:</span>
              <span className="text-secondary">₹{total}</span>
            </div>

            <Button fullWidth size="lg" onClick={handleCheckoutClick}>
              <span>Proceed to Checkout</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Safety badge */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <ShieldCheck className="h-5 w-5 text-success flex-shrink-0" />
            <p className="text-[10px] text-gray-500 leading-normal">
              Safe & secure ordering. 100% genuine architectural sanitaryware backed by comprehensive transit insurance and manufacturer warranty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
