import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/logo.png"
                alt="Elite Bath Collections"
                className="h-12 w-12 object-contain rounded-full border border-gray-200 shadow-sm"
              />
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-gray-900 leading-none">
                  Elite Bath
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary leading-none mt-1">
                  Collections
                </span>
              </div>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              Bathrooms for a better tomorrow. Engineering elegance, reliability, and precision into luxury faucets, rainfall showers, sanitaryware, and curated bathroom accessories.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Architectural & Sanitary Solutions</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/shop" className="hover:text-primary transition-colors">All Collections</Link></li>
              <li><Link to="/shop?category=Faucets+%26+Taps" className="hover:text-primary transition-colors">Faucets & Taps</Link></li>
              <li><Link to="/shop?category=Showers" className="hover:text-primary transition-colors">Shower Systems</Link></li>
              <li><Link to="/shop?category=Wash+Basins" className="hover:text-primary transition-colors">Wash Basins</Link></li>
              <li><Link to="/shop?category=Toilets+%26+Commodes" className="hover:text-primary transition-colors">Toilets & Commodes</Link></li>
              <li><Link to="/shop?category=Bathroom+Accessories" className="hover:text-primary transition-colors">Bathroom Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">Customer Care</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
              <li><Link to="/track-order" className="hover:text-primary transition-colors">Track Order</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ & Installation</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-primary transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary transition-colors">Returns & Replacements</Link></li>
            </ul>
            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-1">
              <a href="mailto:muhammad1211junaid@gmail.com" className="hover:text-primary block truncate font-semibold text-gray-800">
                muhammad1211junaid@gmail.com
              </a>
              <div className="flex flex-wrap gap-x-1.5 text-[11px] text-gray-600 font-medium">
                <a href="tel:+917055435358" className="hover:text-primary">+91 70554 35358</a>
                <span>•</span>
                <a href="tel:+919084339649" className="hover:text-primary">+91 90843 39649</a>
                <span>•</span>
                <a href="tel:+916399525356" className="hover:text-primary">+91 63995 25356</a>
              </div>
            </div>
          </div>

          {/* Legal & Payments */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">Legal & Security</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
            <div className="mt-6 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-800 mb-1">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Secure Payments</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">
                Encrypted transactions via Razorpay, UPI, NetBanking, and all major cards.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© 2026 Elite Bath Collections. All rights reserved. Bathrooms for a better tomorrow.</p>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>Secure 256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
