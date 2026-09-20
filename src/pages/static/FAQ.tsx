import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ShieldCheck, Truck, Sparkles, Wrench } from 'lucide-react';

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
      category: "Materials & Craftsmanship",
      question: "What materials and finishes are used in Elite Bath Collections fittings?",
      answer: "Every fitting in our collection is forged from high-purity, lead-free brass or surgical-grade 304/316 stainless steel. Our ceramics are crafted from premium vitreous china fired at 1280°C with anti-bacterial self-cleaning glazes. For our designer finishes (Matte Black, Brushed Gold, Rose Gold, Gunmetal), we utilize Physical Vapor Deposition (PVD) and multi-tier electroplating, delivering unmatched resistance against corrosion, tarnishing, and hard-water deposits."
    },
    {
      category: "Plumbing & Technical",
      question: "What are the recommended water pressure requirements for your rain showers and faucets?",
      answer: "Our faucets and rain showers operate optimally between 1.5 bar to 3.5 bar (approx. 22 to 50 PSI). While they function adequately on standard overhead gravity tanks (minimum 1.0 bar), we recommend pressure booster pumps or pressure-regulating valves for multi-flow thermostatic shower panels and cascade waterfall spouts to experience the full luxury flow."
    },
    {
      category: "Payment & Security",
      question: "What payment methods are supported on Elite Bath Collections?",
      answer: "We support 100% secure online transactions via the Razorpay payment gateway, accepting all major Credit Cards (Visa, Mastercard, RuPay, Amex), Debit Cards, UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking across 50+ banks, and flexible EMI plans. We also provide a Direct UPI QR option for fast mobile checkouts with instant verification."
    },
    {
      category: "Packaging & Logistics",
      question: "How are fragile ceramic basins, commodes, and luxury fittings packaged for safe transit?",
      answer: "We employ specialized heavy-goods packaging protocols. Ceramic washbasins and commodes are encased in customized high-density EPS foam cushions and secured inside reinforced wooden crates. Brassware and shower systems are individually wrapped in scratch-resistant microfiber pouches and shock-absorbing cartons. Every shipment is 100% insured against transit damage from our warehouse to your doorstep."
    },
    {
      category: "Warranty & Longevity",
      question: "What is the warranty coverage on your bathroom fittings and sanitaryware?",
      answer: "We stand behind the engineering of our products with industry-leading warranties: a 10-Year Comprehensive Warranty on solid brass faucet bodies and ceramic disc cartridges, a 5-Year Warranty on thermostatic mixer valves and digital shower displays, and a 10-Year Warranty against glaze discoloration or crazing on all vitreous china sanitaryware."
    },
    {
      category: "Installation & Maintenance",
      question: "Do you supply installation templates and plumbing guidelines?",
      answer: "Yes, each product includes a 1:1 scale drilling template, plumbing rough-in diagrams, and standard thread specification guides (compatible with standard 1/2-inch and 3/4-inch BSP plumbing connections in India). Our concierge technical support team is also available to assist your licensed plumber or project contractor."
    },
    {
      category: "Trade & Architectural Projects",
      question: "Do you accept bulk trade or customized orders for villas, hotels, and interior projects?",
      answer: "Absolutely. Our Architectural & Trade division collaborates with architects, interior designers, builders, and hospitality developers. We offer volume-tiered commercial pricing, bespoke finish batch matching, and dedicated project managers for residential developments and commercial luxury bathrooms."
    },
    {
      category: "Returns & Transit Claims",
      question: "What should I do if my package arrives damaged or incomplete?",
      answer: "In the unlikely event of transit breakage or packaging compromise, simply record an unboxing video and notify our concierge support at care@elitebathcollections.com or via your Dashboard within 7 days of delivery. We will initiate an immediate expedited replacement at zero additional cost."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Page Header */}
      <div className="text-center space-y-3 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Customer Help Center</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
          Everything you need to know about our architectural sanitaryware, technical specifications, insured shipping, and lifetime warranty coverage.
        </p>
      </div>

      {/* Trust Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-1.5" />
          <p className="font-bold text-xs text-gray-900">10-Year Warranty</p>
          <p className="text-[10px] text-gray-500">Brass & Ceramics</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <Truck className="h-6 w-6 text-primary mx-auto mb-1.5" />
          <p className="font-bold text-xs text-gray-900">Insured Crating</p>
          <p className="text-[10px] text-gray-500">Zero transit breakage</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <Sparkles className="h-6 w-6 text-primary mx-auto mb-1.5" />
          <p className="font-bold text-xs text-gray-900">PVD Finishes</p>
          <p className="text-[10px] text-gray-500">Tarnish-resistant</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <Wrench className="h-6 w-6 text-primary mx-auto mb-1.5" />
          <p className="font-bold text-xs text-gray-900">Tech Support</p>
          <p className="text-[10px] text-gray-500">Plumber guidelines</p>
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
        <h3 className="text-lg font-bold text-gray-900">Still have questions regarding your project?</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Our specialized sanitaryware concierges are available to assist with technical drawings, plumbing compatibility, and finish selections.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary-hover shadow-sm transition-colors"
          >
            Contact Customer Concierge
          </a>
          <a
            href="mailto:care@elitebathcollections.com"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Email Technical Team
          </a>
        </div>
      </div>
    </div>
  );
};
