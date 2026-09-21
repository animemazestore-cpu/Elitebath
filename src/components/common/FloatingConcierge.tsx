import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export const FloatingConcierge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultMsg = encodeURIComponent(
    'Hi Elite Bath Collections! I would like assistance with bathroom fittings, product dimensions, or ordering.'
  );

  return (
    <aside aria-label="Customer Support Concierge" className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Expanded Concierge Popup Menu */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">
          {/* Header */}
          <div className="bg-primary text-white p-4 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3.5 right-3.5 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close concierge menu"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-300">
                Live Sanitary Concierge
              </span>
            </div>
            <h3 className="text-base font-extrabold mt-1 text-white">Elite Bath Collections</h3>
            <p className="text-xs text-white/80 mt-0.5">
              Direct assistance with luxury fittings, finishes & express delivery.
            </p>
          </div>

          {/* Body Options */}
          <div className="p-4 space-y-3 bg-gray-50/50">
            {/* Primary WhatsApp Action */}
            <a
              href={`https://wa.me/917055435358?text=${defaultMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/20">
                  <MessageCircle className="h-4 w-4 fill-current" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">Chat on WhatsApp</p>
                  <p className="text-[10px] text-emerald-100 font-normal mt-0.5">+91 70554 35358</p>
                </div>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase font-extrabold">
                Instant
              </span>
            </a>

            {/* Direct Phone Helplines */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
                Direct Dial Helplines (Mon–Sat 9AM–8PM)
              </span>
              <div className="space-y-1.5 text-xs">
                <a
                  href="tel:+917055435358"
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-primary/5 text-gray-800 hover:text-primary transition-colors font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>+91 70554 35358</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">Primary</span>
                </a>

                <a
                  href="tel:+919084339649"
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-primary/5 text-gray-800 hover:text-primary transition-colors font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>+91 90843 39649</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">Dispatch</span>
                </a>

                <a
                  href="tel:+916399525356"
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-primary/5 text-gray-800 hover:text-primary transition-colors font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>+91 63995 25356</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">Technical</span>
                </a>
              </div>
            </div>

            {/* Email Support */}
            <a
              href="mailto:muhammad1211junaid@gmail.com"
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary/40 text-xs font-semibold text-gray-700 hover:text-primary transition-all"
            >
              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">muhammad1211junaid@gmail.com</span>
            </a>

            <div className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Insured Transit & Genuine Ceramic Warranty</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Pill/Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-white"
        aria-label="Open luxury sanitary concierge chat"
      >
        <div className="relative">
          <MessageCircle className="h-5 w-5 fill-current" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-emerald-600" />
        </div>
        <span className="font-bold text-xs sm:text-sm tracking-wide hidden sm:inline">
          Need Help? Chat & Call
        </span>
        <span className="font-bold text-xs sm:hidden">Help</span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>
    </aside>
  );
};
