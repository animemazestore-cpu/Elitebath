import React from 'react';
import { ShieldCheck, Lock, Eye, Server, RefreshCw } from 'lucide-react';

const PolicyPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-sm space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Trust & Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500 mt-2">Effective Date: June 20, 2026 • TRYVOAL Apparel Studio Pvt. Ltd.</p>
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

export const PrivacyPolicy: React.FC = () => (
  <PolicyPage title="Privacy & Data Protection Policy">
    <p>
      At <strong>TRYVOAL</strong> ("we", "us", or "our"), we are committed to safeguarding the privacy, confidentiality, and security of our clients, architects, and visitors. This Privacy Policy details how we collect, process, and protect your personal information across our e-commerce platform and concierge services.
    </p>

    <Section title="1. Information We Collect" icon={<Eye className="h-4 w-4 text-primary" />}>
      <p>
        When you interact with TRYVOAL, we may collect the following categories of information:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Contact & Identity Data:</strong> Full name, email address, contact telephone number, and company/firm name for architectural trade accounts.</li>
        <li><strong>Delivery & Logistics Data:</strong> Shipping address, landmark, city, state, postal code, and delivery access instructions for heavy-goods freight.</li>
        <li><strong>Transaction Data:</strong> Order references, purchased apparel and accessories, custom finish specifications, invoice numbers, and payment confirmation status.</li>
        <li><strong>Technical & Account Credentials:</strong> Account login authentication data, encrypted passwords (managed via Supabase Auth), IP address, and browser attributes.</li>
      </ul>
    </Section>

    <Section title="2. Payment Processing & Financial Security" icon={<Lock className="h-4 w-4 text-primary" />}>
      <p>
        We prioritize the utmost financial security for all transactions:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>All online credit card, debit card, NetBanking, and UPI transactions are securely routed through <strong>Razorpay</strong>, a PCI-DSS Level 1 certified payment gateway.</li>
        <li>We <strong>never store, log, or have access to</strong> your raw credit card numbers, CVV codes, bank credentials, or UPI PINs on our servers.</li>
        <li>For direct UPI payments, transaction reference IDs (UTR) and voluntarily submitted verification slips are encrypted and accessible only by authorized billing concierges.</li>
      </ul>
    </Section>

    <Section title="3. Purpose & Legal Basis for Processing" icon={<Server className="h-4 w-4 text-primary" />}>
      <p>We process your data exclusively for legitimate business purposes:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Processing orders, organizing wooden crate fabrication, and coordinating insured doorstep transport.</li>
        <li>Generating certified GST tax invoices and 10-year warranty certificates for your fittings.</li>
        <li>Providing real-time SMS/email consignment tracking updates via our logistics partners.</li>
        <li>Responding to customer support, technical plumbing inquiries, and replacement requests.</li>
      </ul>
    </Section>

    <Section title="4. Data Storage, Architecture & Encryption" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
      <p>
        Client data is stored securely in enterprise-grade cloud databases powered by Supabase (PostgreSQL) hosted in high-availability data centers. All communications between your web browser and our servers are encrypted using 256-bit Transport Layer Security (TLS/SSL). Row-Level Security (RLS) policies ensure that your personal order history is strictly isolated and accessible only by your verified credentials.
      </p>
    </Section>

    <Section title="5. Cookies & Local Session Persistence">
      <p>
        Our platform utilizes standard HTTP cookies and browser LocalStorage to provide an intuitive shopping experience. This includes remembering your shopping cart items, selected finish options (e.g. Brushed Gold vs. Matte Black), wishlist items, and active session tokens. You may disable cookies through your browser settings, though doing so may limit cart functionality.
      </p>
    </Section>

    <Section title="6. Third-Party Sharing & Freight Disclosures">
      <p>
        We strictly <strong>do not sell, rent, or monetize</strong> your personal information. We share only necessary delivery details (name, phone number, destination address) with vetted heavy-goods logistics providers (such as Delhivery, Blue Dart, and specialized freight carriers) solely to execute delivery and installation coordination.
      </p>
    </Section>

    <Section title="7. Your Rights & Data Governance" icon={<RefreshCw className="h-4 w-4 text-primary" />}>
      <p>
        You retain full rights under applicable data protection laws to inspect, amend, or request the deletion of your account and personal records. To exercise these rights or request data removal, please contact our team at <a href="mailto:muhammad1211junaid@gmail.com" className="text-primary font-bold hover:underline">muhammad1211junaid@gmail.com</a> or call <a href="tel:+917055435358" className="text-primary font-bold hover:underline">+91 70554 35358</a>.
      </p>
    </Section>
  </PolicyPage>
);
