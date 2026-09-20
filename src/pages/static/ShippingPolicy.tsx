import React from 'react';
import { Truck, Package, Clock, ShieldCheck, MapPin } from 'lucide-react';

const PolicyPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-sm space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
          <Truck className="h-3.5 w-3.5" />
          <span>Fulfillment & Logistics</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500 mt-2">Effective Date: June 20, 2026 • Elite Bath Collections Logistics Division</p>
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

export const ShippingPolicy: React.FC = () => (
  <PolicyPage title="Shipping & Heavy-Goods Logistics Policy">
    <p>
      Elite Bath Collections delivers architectural sanitaryware, porcelain commodes, basins, and luxury brassware nationwide across India. Because sanitaryware involves heavy, delicate, and precision-engineered ceramics, we enforce rigorous logistics, custom wooden crating, and 100% transit insurance.
    </p>

    <Section title="1. Protective Packaging & Wooden Crating" icon={<Package className="h-4 w-4 text-primary" />}>
      <p>
        Every product in our catalog receives tailored packaging engineered for zero transit impact:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Ceramic Commodes & Basins:</strong> High-density expanded polystyrene (EPS) form-fitted cushions, encased in reinforced pine-wood protective crates to eliminate impact vibration.</li>
        <li><strong>Designer Brassware & Showers:</strong> High-durability honeycomb carton cores, interior velvet/microfiber wraps, and shock-dampening foam buffers to shield PVD coatings against scratches.</li>
        <li><strong>Tamper-Evident Security Seals:</strong> All master crates and cartons are stamped with branded tamper-evident tape and inspection stamps.</li>
      </ul>
    </Section>

    <Section title="2. Dispatch & Delivery Timelines" icon={<Clock className="h-4 w-4 text-primary" />}>
      <p>
        Orders are inspected by our quality team and packaged within 24 to 48 business hours after payment confirmation. Typical door-to-door transit timelines:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Metro Cities (Delhi-NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata):</strong> 3 to 5 business days.</li>
        <li><strong>Tier 2 & Tier 3 Cities:</strong> 5 to 7 business days.</li>
        <li><strong>North-East & Remote Regions:</strong> 7 to 10 business days.</li>
        <li><strong>Custom / Bespoke PVD Finishes:</strong> 7 to 12 business days (subject to precision electroplating batch lead time).</li>
      </ul>
    </Section>

    <Section title="3. Shipping Charges & Free Delivery Threshold" icon={<Truck className="h-4 w-4 text-primary" />}>
      <p>
        We believe luxury should include seamless delivery:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Free Insured Shipping:</strong> All orders with a subtotal of <strong>₹999 or greater</strong> qualify for complimentary insured standard shipping across India.</li>
        <li><strong>Standard Shipping Fee:</strong> For orders below ₹999, a nominal flat freight fee of <strong>₹99</strong> is applied at checkout to cover protective packaging.</li>
      </ul>
    </Section>

    <Section title="4. 100% Transit Insurance & Safe Delivery Guarantee" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
      <p>
        Every consignment dispatched by Elite Bath Collections is fully insured against theft, loss, and physical breakage in transit at no additional fee to the customer. In the rare event of transit damage, you are fully covered under our replacement guarantee.
      </p>
    </Section>

    <Section title="5. Live Consignment Tracking" icon={<MapPin className="h-4 w-4 text-primary" />}>
      <p>
        Once your order is handed over to our verified heavy-goods carrier partner (Delhivery, Blue Dart, DTDC, or specialized freight carrier), an Air Waybill (AWB) and live tracking link will be updated in your <strong>User Dashboard</strong> and sent via SMS and email. You can track your shipment anytime through our public <a href="/track" className="text-primary font-bold hover:underline">Track Order Portal</a>.
      </p>
    </Section>

    <Section title="6. Delivery Protocol & Receipt Inspection">
      <p>
        Upon receiving the consignment from the delivery personnel:
      </p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Inspect the exterior wooden crate and carton seals for any visible puncture or transit crushing before signing the Proof of Delivery (POD).</li>
        <li>If noticeable external damage is present, note "Package Received Damaged" on the courier delivery sheet.</li>
        <li>Record a brief continuous unboxing video while uncrating the ceramic and brassware items. If any product is broken, contact our concierge at <a href="mailto:care@elitebathcollections.com" className="text-primary font-bold hover:underline">care@elitebathcollections.com</a> within 7 days for an immediate priority replacement.</li>
      </ol>
    </Section>
  </PolicyPage>
);
