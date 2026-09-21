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
    // Check if dismissed in this session
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

  // When user closes the ad, return null so the entire separate space collapses and disappears
  if (!isVisible) return null;

  return (
    <section
      aria-label="Sponsored Announcement"
      className="w-full bg-neutral-900/5 border-b border-gray-200 transition-all duration-300"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 relative flex items-center justify-center">
        {/* Banner Container with original aspect ratio & compact height */}
        <div className="relative inline-flex items-center justify-center max-w-full group">
          <a
            href="https://t.me/lennoxislive"
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            title="Open Telegram @lennoxislive"
          >
            {!imgError ? (
              <img
                src={CANDIDATE_IMAGES[imgIndex]}
                alt="Elite Bath Announcement"
                className="w-auto h-14 sm:h-18 md:h-22 max-w-[92vw] sm:max-w-2xl md:max-w-3xl object-contain rounded-xl group-hover:opacity-95 transition-opacity"
                onError={handleImageError}
              />
            ) : (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-inner">
                <span className="text-sky-400">Telegram VIP:</span>
                <span>Connect with @lennoxislive for exclusive deals</span>
                <ExternalLink className="h-4 w-4 text-sky-400 ml-1" />
              </div>
            )}
          </a>

          {/* Close Button (X) - positioned neatly on top-right of ad space */}
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 sm:-right-3 z-10 p-1 rounded-full bg-gray-900/80 hover:bg-black text-white shadow-md hover:scale-105 transition-all cursor-pointer border border-white/40"
            title="Close ad banner"
            aria-label="Close ad banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
