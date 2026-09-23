import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Award, Scale } from 'lucide-react';

const PolicyPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-sm space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
          <FileText className="h-3.5 w-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500 mt-2">Effective Date: June 20, 2026 • TRYVOAL Studio Pvt. Ltd.</p>
      </div>
      <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
        {children}
      </div>
    </div>
  </div>
);

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="space-y-2">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
    <div className="text-gray-600 space-y-2 pl-0 sm:pl-6">{children}</div>
  </section>
);

export const TermsConditions: React.FC = () => (
  <PolicyPage title="Terms & Conditions of Sale">
    <p>
      Welcome to <strong>TRYVOAL</strong>. These Terms & Conditions govern your access to, use of, and purchases made through our online store, digital catalog, and architectural concierge services. By placing an order, you agree to be bound by these legal terms.
    </p>

    <Section title="1. Product Specifications & Artisan Variations" icon={<CheckCircle2 className="h-4 w-4 text-primary" />}>
      <p>
        TRYVOAL manufactures luxury apparel and crafted accessories using heavyweight ring-spun organic cotton, European flax linen, and artisanal dying processes:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Vitreous china ceramic washbasins and commodes carry a standard dimensional tolerance of ±2mm to ±3mm.</li>
        <li>Physical Vapor Deposition (PVD) finishes (Matte Black, Brushed Gold, Rose Gold, Gunmetal) exhibit subtle, luxurious undertone reflections under varying ambient lighting conditions.</li>
        <li>All product photographs and lifestyle renderings are designed to represent color, texture, and scale as faithfully as possible.</li>
      </ul>
    </Section>

    <Section title="2. Pricing, Orders & Invoicing" icon={<Scale className="h-4 w-4 text-primary" />}>
      <p>
        All prices are listed in Indian Rupees (INR) and are inclusive of applicable Goods & Services Tax (GST). Official GST-compliant tax invoices are generated upon order dispatch and available in your Customer Dashboard.
      </p>
      <p>
        We reserve the right to decline, adjust, or cancel orders arising from typographical pricing errors or system inventory synchronization delays, in which case any captured funds are promptly refunded.
      </p>
    </Section>

    <Section title="3. Payment Security & Settlement" icon={<CheckCircle2 className="h-4 w-4 text-primary" />}>
      <p>
        Payments must be completed in full before order processing and crate dispatch. We support Razorpay encrypted payment gateway processing (Credit/Debit cards, UPI, NetBanking, EMI) and Direct UPI QR payments. Submitting fraudulent transaction IDs or fabricated payment proofs is strictly prohibited and results in immediate order termination.
      </p>
    </Section>

    <Section title="4. Garment Care & Washing Guidelines" icon={<AlertCircle className="h-4 w-4 text-primary" />}>
      <p>
        To maintain fabric weight, hand-feel, and longevity of your TRYVOAL apparel:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Machine wash cold (30°C or below) on a gentle cycle with like colors, inside out.</li>
        <li>Do not use chlorine bleach, harsh chemical detergents, or aggressive fabric softeners.</li>
        <li>Air dry flat or tumble dry on low heat. Avoid excessive direct sunlight during line drying.</li>
        <li><strong>Ironing Notice:</strong> Warm iron on reverse side; never iron directly over printed graphics or heat-sealed monograms.</li>
      </ul>
    </Section>

    <Section title="5. Quality Guarantee & 7-Day Doorstep Exchanges" icon={<Award className="h-4 w-4 text-primary" />}>
      <p>
        Our garments are backed by the TRYVOAL Craft & Longevity Guarantee:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Pre-Shrunk Guarantee:</strong> Ring-spun combed cotton is bio-washed to eliminate post-wash shrinkage when washed as instructed.</li>
        <li><strong>7-Day Doorstep Exchange:</strong> Complimentary size exchanges arranged directly from your doorstep for unwashed, unworn garments with original tags intact.</li>
        <li><strong>Craftsmanship Warranty:</strong> 6-month coverage against seam unraveling, collar rib distortion, and dye bleeding defects.</li>
      </ul>
    </Section>

    <Section title="6. Studio Capsules & Wholesale Distribution">
      <p>
        Orders placed through our Studio & Wholesale program for retail boutiques, styling agencies, or corporate capsules are subject to agreed delivery schedules and production milestone timelines specified in customized quotations.
      </p>
    </Section>

    <Section title="7. Intellectual Property & Governing Jurisdiction">
      <p>
        All trademarks, logos, catalog layouts, product photography, and digital assets are the proprietary property of TRYVOAL Studio Pvt. Ltd. Any unauthorized reproduction is prohibited. These terms are governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts in Gurugram, Haryana.
      </p>
    </Section>
  </PolicyPage>
);
