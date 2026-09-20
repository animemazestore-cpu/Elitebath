import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

const PolicyPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-sm space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Customer Assurance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500 mt-2">Effective Date: June 20, 2026 • Elite Bath Collections Care Guarantee</p>
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

export const RefundPolicy: React.FC = () => (
  <PolicyPage title="Refund, Replacement & Return Policy">
    <p>
      At <strong>Elite Bath Collections</strong>, customer satisfaction and quality assurance are central to our brand. We understand that purchasing architectural sanitaryware and bathroom fittings online requires complete confidence in transit protection, fitment accuracy, and finish excellence.
    </p>

    <Section title="1. 100% Transit Breakage Guarantee" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
      <p>
        Because ceramic wash basins, commodes, and tempered shower glass panels require specialized handling, every single shipment is fully covered under our <strong>Transit Breakage Guarantee</strong>:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>If your product arrives broken, cracked, chipped, or scratched during shipping, we will dispatch an immediate <strong>free priority replacement</strong>.</li>
        <li>To initiate a transit claim, record a brief unboxing video upon uncrating the parcel and notify us at <a href="mailto:care@elitebathcollections.com" className="text-primary font-bold hover:underline">care@elitebathcollections.com</a> or via your Dashboard within <strong>7 days of delivery</strong>.</li>
      </ul>
    </Section>

    <Section title="2. 7-Day Return & Replacement Eligibility" icon={<CheckCircle2 className="h-4 w-4 text-primary" />}>
      <p>You may request a return or replacement under the following qualifying conditions:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>The product delivered does not match the ordered model, SKU, or finish option (e.g. Chrome received instead of Brushed Gold).</li>
        <li>The fitting exhibits verified manufacturing or cartridge defects prior to installation.</li>
        <li>You wish to exchange for an alternative size or finish from our catalog within 7 days of receiving the package.</li>
      </ul>
    </Section>

    <Section title="3. Mandatory Conditions for Return Acceptance" icon={<AlertTriangle className="h-4 w-4 text-primary" />}>
      <p>Due to hygiene and plumbing seal integrity requirements, returned products must satisfy the following criteria:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Uninstalled Condition:</strong> The item must be completely uninstalled, never connected to plumbing lines or water supply, and free of plumber's putty, cement, or wrench marks.</li>
        <li><strong>Original Packaging:</strong> All items must be packed in their original protective inner cartons with foam inserts, instruction manuals, mounting hardware, and intact warranty seals.</li>
        <li><strong>Bespoke Custom Finishes:</strong> Products manufactured under customized client finish specifications or bulk project orders are non-returnable except in cases of verified transit damage.</li>
      </ul>
    </Section>

    <Section title="4. Complimentary Reverse Freight Logistics" icon={<RefreshCw className="h-4 w-4 text-primary" />}>
      <p>
        For approved returns or replacements, Elite Bath Collections arranges complimentary reverse freight pickup from your delivery address via our heavy-goods carrier partners. If reverse pickup is unavailable in certain remote pincodes, our concierge will coordinate and reimburse verified shipping costs.
      </p>
    </Section>

    <Section title="5. Refund Processing Timelines">
      <p>
        Once the returned shipment is received and inspected at our central fulfillment warehouse (typically within 2 business days of arrival):
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>The refund will be credited directly back to the original payment method (Credit/Debit Card, NetBanking, or UPI) via <strong>Razorpay</strong>.</li>
        <li>Refunds typically reflect in your bank account or card statement within <strong>3 to 5 business days</strong> depending on your banking provider.</li>
        <li>You will receive an automated email and SMS notification once the refund transaction is executed.</li>
      </ul>
    </Section>

    <Section title="6. How to Submit a Return or Replacement Request" icon={<HelpCircle className="h-4 w-4 text-primary" />}>
      <p>
        Log into your account, visit your <a href="/dashboard" className="text-primary font-bold hover:underline">Customer Dashboard</a>, and navigate to the <strong>Orders & Replacements</strong> tab to submit your request, or email our concierge team directly at <a href="mailto:care@elitebathcollections.com" className="text-primary font-bold hover:underline">care@elitebathcollections.com</a> with your Order ID and photos.
      </p>
    </Section>
  </PolicyPage>
);
