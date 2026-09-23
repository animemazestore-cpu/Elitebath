import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useCatalogStore } from './store/useCatalogStore';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AppDownloadPopup } from './components/common/AppDownloadPopup';
import { FloatingConcierge } from './components/common/FloatingConcierge';
import { TelegramAdBanner } from './components/common/TelegramAdBanner';

// Import Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
import { TrackOrder } from './pages/TrackOrder';

// Import Static Pages
import { AboutUs } from './pages/static/AboutUs';
import { FAQ } from './pages/static/FAQ';
import { PrivacyPolicy } from './pages/static/PrivacyPolicy';
import { TermsConditions } from './pages/static/TermsConditions';
import { ShippingPolicy } from './pages/static/ShippingPolicy';
import { RefundPolicy } from './pages/static/RefundPolicy';

// Scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  const checkSession = useAuthStore((state) => state.checkSession);
  const initializeCatalog = useCatalogStore((state) => state.initializeCatalog);

  // Initialize session state and preload catalog on startup
  useEffect(() => {
    checkSession();
    void initializeCatalog();
  }, [checkSession, initializeCatalog]);

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-white text-gray-900">
        <Navbar />
        
        {/* Dedicated Separate Ad Space (Non-overlapping, Collapsible) */}
        <TelegramAdBanner />

        {/* Main Content Area */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/track-order" element={<TrackOrder />} />

            {/* Static pages routes */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
          </Routes>
        </main>

        <Footer />
      </div>

      {/* Global Concierge & Support Floating Widget */}
      <FloatingConcierge />

      {/* Global App Download Popup */}
      <AppDownloadPopup />
    </Router>
  );
};

export default App;
