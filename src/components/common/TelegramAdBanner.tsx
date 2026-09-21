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
      className="w-full bg-black border-b border-gray-200 transition-all duration-300 relative overflow-hidden"
    >
      {/* Sleek horizontal banner: full length (100% width) with slim, elegant height */}
      <div className="w-full h-14 sm:h-16 md:h-20 relative overflow-hidden group">
        <a
          href="https://t.me/lennoxislive"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full cursor-pointer select-none"
          title="Open Telegram @lennoxislive"
        >
          {!imgError ? (
            <img
              src={CANDIDATE_IMAGES[imgIndex]}
              alt="Elite Bath Announcement"
              className="w-full h-full object-cover object-center block transition-opacity duration-200 group-hover:opacity-95"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full px-4 bg-gradient-to-r from-slate-950 via-sky-950 to-slate-950 text-white flex items-center justify-center gap-3 text-center">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider border border-sky-500/30">
                Telegram VIP
              </span>
              <span className="text-xs sm:text-sm font-semibold">
                Exclusive Deals & Updates on @lennoxislive
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-sky-400 hidden sm:inline-block" />
            </div>
          )}
        </a>

        {/* Close Button (X) - positioned neatly on the right */}
        <button
          onClick={handleClose}
          className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 z-20 p-1.5 rounded-full bg-black/70 hover:bg-black text-white shadow-md backdrop-blur-sm transition-all hover:scale-110 cursor-pointer border border-white/30"
          title="Close announcement"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};
