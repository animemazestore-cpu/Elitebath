import React from 'react';
import { ShieldCheck, Heart, Sparkles, Truck, Shirt } from 'lucide-react';

export const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>About Our Brand</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          About TRYVOAL
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Modern luxury streetwear & premium apparel. Defined by relaxed drop-shoulder tailoring, heavyweight organic textiles, and timeless presence.
        </p>
      </div>

      <div className="space-y-12">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span>Our Philosophy</span>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            At TRYVOAL, our mission is to redefine modern luxury everyday apparel. We merge contemporary streetwear silhouettes with heritage-grade textiles—utilizing 240+ GSM ring-spun combed organic cotton, French terry, breezy European linen, and full-grain leather. We believe true luxury lies in fabric density, tactile drape, and clean timeless lines that age gracefully.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why TRYVOAL?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Heavyweight Textiles</h3>
              <p className="text-xs text-gray-600">
                240+ GSM ring-spun combed cotton, pre-shrunk and bio-washed for lasting structure and zero pilling.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="mx-auto w-12 h-12 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Precision Tailoring</h3>
              <p className="text-xs text-gray-600">
                Relaxed drop-shoulder silhouettes, reinforced double-needle seams, and shape-retaining dense collar ribs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Doorstep Exchanges</h3>
              <p className="text-xs text-gray-600">
                Insured express delivery across India with 7-day complimentary doorstep size exchange coverage.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shirt className="h-6 w-6 text-primary" />
            <span>Curated Apparel Categories</span>
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Our seasonal catalog focuses on refined wardrobe staples and artisanal accessories:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-700 font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Heavyweight Boxy T-Shirts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Vintage Acid-Washed Tees</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Peruvian Pima Crewnecks</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Pure Riviera Linen Shirts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Oxford Button-Down Shirts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Full-Grain Leather & Canvas Accessories</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
