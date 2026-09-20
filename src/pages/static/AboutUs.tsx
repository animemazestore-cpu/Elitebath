import React from 'react';
import { ShieldCheck, Heart, Sparkles, Truck, Droplets } from 'lucide-react';

export const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>About Our Brand</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          About Elite Bath Collections
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Bathrooms for a better tomorrow. Engineering elegance, durability, and innovation to elevate modern living spaces.
        </p>
      </div>

      <div className="space-y-12">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span>Our Mission</span>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            At Elite Bath Collections, our mission is to deliver premium, architect-grade sanitaryware, faucets, and bathroom fittings directly to homeowners, architects, and interior designers. We believe luxury should be accessible, durable, and uncompromising in quality. Every fitting in our catalog is engineered to withstand daily domestic and commercial use while maintaining a timeless visual aesthetic.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Elite Bath Collections?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Architectural Grade</h3>
              <p className="text-xs text-gray-600">
                Precision cartridges, lead-free brass cores, and flawless PVD and electroplated finishes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="mx-auto w-12 h-12 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Tested Quality</h3>
              <p className="text-xs text-gray-600">
                100% water-pressure tested valves and corrosion-tested multi-layer coatings.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Safe Transport</h3>
              <p className="text-xs text-gray-600">
                Reinforced cushioning ensures sensitive ceramics and fixtures reach your doorstep safely.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Droplets className="h-6 w-6 text-primary" />
            <span>Our Product Range</span>
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We feature a curated catalog of bathroom fittings and sanitary solutions, including:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-700 font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Luxury Basin & Sink Faucets</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Thermostatic Shower Panels</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Designer Ceramic Wash Basins</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Wall-Hung & One-Piece Commodes</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Anti-Odor Drains & Floor Traps</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Solid Brass Bath Accessories</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
