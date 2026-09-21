import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

const CANDIDATE_IMAGES = [
  '/img/adbanner.jpg',
  '/img/banner.jpg',
  '/img/banner.png',
  '/img/banner.webp',
  '/img/banner.jpeg',
];

export const TelegramAdBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    return !sessionStorage.getItem('elitebath_tg_ad_dismissed');
  });
  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    if (imgIndex < CANDIDATE_IMAGES.length - 1) {
      setImgIndex((prev) => prev + 1);
    } else {
      setImgError(true);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('elitebath_tg_ad_dismissed', 'true');
  };

  // When user closes the ad, return null so the entire space collapses and disappears
  if (!isVisible) return null;

  return (
    <section
      aria-label="Sponsored Announcement"
      className="w-full relative bg-gray-950 border-b border-gray-200 transition-all duration-300 overflow-hidden"
    >
      {/* Full-width stretch container for maximum visibility on mobile & desktop */}
      <div className="w-full relative group">
        <a
          href="https://t.me/lennoxislive"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full cursor-pointer select-none"
          title="Open Telegram @lennoxislive"
        >
          {!imgError ? (
            <img
              src={CANDIDATE_IMAGES[imgIndex]}
              alt="Elite Bath Announcement"
              className="w-full h-auto max-h-[160px] sm:max-h-[220px] md:max-h-[280px] lg:max-h-[340px] object-cover sm:object-fill block transition-opacity duration-200 group-hover:opacity-95"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full py-4 sm:py-6 px-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-xs uppercase tracking-wider border border-sky-500/30">
                  Telegram VIP
                </span>
                <span>Exclusive Sanitary Deals & Live Updates</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-sky-300 group-hover:text-white transition-colors">
                <span>Join @lennoxislive</span>
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
          )}
        </a>

        {/* Close Button (X) - high contrast, easily tappable on mobile & desktop */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-4 z-20 p-1.5 sm:p-2 rounded-full bg-black/75 hover:bg-black text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 cursor-pointer border border-white/30"
          title="Close announcement"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        </button>
      </div>
    </section>
  );
};
