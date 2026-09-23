import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ShieldCheck, Truck, Sparkles, RefreshCw } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  category?: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, category }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex justify-between items-center text-left text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="space-y-0.5 pr-4">
          {category && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
              {category}
            </span>
          )}
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">{question}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50 text-gray-600 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

export const FAQ: React.FC = () => {
  const faqs = [
    {
      category: "Fabrics & Quality",
      question: "What fabrics and GSM weights are used in TRYVOAL garments?",
      answer: "Our signature t-shirts are crafted from 240+ GSM ring-spun combed organic cotton, providing substantial weight, crisp structure, and zero see-through opacity. Our shirts feature 100% fine European flax linen and durable 180 GSM oxford weaves. Accessories use 16 oz heavy cotton canvas and vegetable-tanned full-grain leather."
    },
    {
      category: "Sizing & Fit",
      question: "How do TRYVOAL t-shirts and shirts fit?",
      answer: "Our core collection is engineered with a relaxed, modern drop-shoulder silhouette. It offers a slightly oversized drape through the chest and shoulders while maintaining a clean, structured length. If you prefer a tailored regular fit, we recommend sizing down one size. Detailed chest and length measurements are provided on every product page."
    },
    {
      category: "Garment Care",
      question: "How should I wash and care for my TRYVOAL apparel?",
      answer: "Machine wash cold (30°C or below) on a gentle cycle with like colors, inside out. Avoid bleach or harsh chemical detergents. Air-dry flat or tumble dry on low heat. Warm iron on reverse if necessary. Because all garments are pre-shrunk and silicon bio-washed, you experience minimal to zero post-wash shrinkage."
    },
    {
      category: "Exchanges & Returns",
      question: "How does the 7-day doorstep size exchange work?",
      answer: "If the size doesn't fit you perfectly, you can request an exchange within 7 days of delivery through your Dashboard or by contacting concierge support. We arrange reverse pickup directly from your doorstep and dispatch your requested replacement size promptly at zero extra cost."
    },
    {
      category: "Shipping & Delivery",
      question: "How long does delivery take across India?",
      answer: "All orders are processed and dispatched within 24 to 48 hours from our fulfillment hub. Metro deliveries typically arrive within 2 to 4 business days, while non-metro and regional locations take 4 to 6 business days. Express tracking updates are sent via email and SMS."
    },
    {
      category: "Payment & Security",
      question: "What payment methods are supported on TRYVOAL?",
      answer: "We support 100% secure online transactions via Razorpay, accepting all major Credit Cards (Visa, Mastercard, RuPay, Amex), Debit Cards, UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking across 50+ banks, and 0-payment checkout flows when promotional vouchers or credits are applied."
    },
    {
      category: "Sustainability & Craft",
      question: "Are TRYVOAL products sustainably produced?",
      answer: "Yes. We operate small-batch production schedules to eliminate overproduction waste. We use OEKO-TEX certified reactive dyes that are gentle on skin and aquatic systems, and your order arrives in 100% plastic-free, recyclable matte packaging."
    },
    {
      category: "Wholesale & Collabs",
      question: "Do you offer bulk orders for teams, brands, or retail boutiques?",
      answer: "Yes. Our Studio division accepts custom corporate capsules, brand collaborations, and select retail partnerships. Contact our styling concierge at muhammad1211junaid@gmail.com with your quantities and timeline."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Page Header */}
      <div className="text-center space-y-3 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Client Help Center</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
          Everything you need to know about our luxury heavyweight apparel, fabric specifications, sizing guide, and express doorstep delivery.
        </p>
      </div>

      {/* Trust Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-1.5" />
          <p className="font-bold text-xs text-gray-900">240+ GSM Cotton</p>
          <p className="text-[10px] text-gray-500">Organic ring-spun</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <Truck className="h-6 w-6 text-primary mx-auto mb-1.5" />
          <p className="font-bold text-xs text-gray-900">Insured Shipping</p>
          <p className="text-[10px] text-gray-500">Fast pan-India delivery</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <Sparkles className="h-6 w-6 text-primary mx-auto mb-1.5" />
          <p className="font-bold text-xs text-gray-900">Pre-Shrunk</p>
          <p className="text-[10px] text-gray-500">Bio-washed drape</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <RefreshCw className="h-6 w-6 text-primary mx-auto mb-1.5" />
          <p className="font-bold text-xs text-gray-900">7-Day Exchanges</p>
          <p className="text-[10px] text-gray-500">Doorstep size swap</p>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            category={faq.category}
            question={faq.question}
            answer={faq.answer}
          />
        ))}
      </div>

      {/* Still Have Questions CTA */}
      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Still have questions regarding sizing or fabrics?</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Our styling concierge team is available to assist with chest measurements, fabric details, and order tracking.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary-hover shadow-sm transition-colors"
          >
            Contact Styling Concierge
          </a>
          <a
            href="mailto:muhammad1211junaid@gmail.com"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Email: muhammad1211junaid@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
