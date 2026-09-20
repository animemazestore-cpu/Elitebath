import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Download, Sparkles } from 'lucide-react';

export const AppDownloadPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('elitebath_brochure_dismissed');
    if (!dismissed) {
      // Show once after 10s for new visitors
      const timer = setTimeout(() => {
        setIsOpen(false); // keep disabled by default for clean UX
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('elitebath_brochure_dismissed', 'true');
    setIsOpen(false);
  };

  const handleDownload = () => {
    alert("The 2026 Elite Bath Collections digital catalog will be available shortly. Browse our online shop for current models.");
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-primary" />
                </div>
              </div>

              <div className="inline-flex items-center justify-center gap-1.5 w-full text-center text-xs font-bold uppercase tracking-wider text-primary mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>2026 Lookbook</span>
              </div>

              <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-2">
                Elite Bath Collections
              </h2>

              <p className="text-center text-gray-600 text-sm mb-6 leading-relaxed">
                Explore our full architectural catalog featuring luxury sanitaryware, rain showers, precision faucets, and bathroom accessories.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Digital Catalog</span>
                </button>

                <button
                  onClick={handleClose}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all text-sm"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
