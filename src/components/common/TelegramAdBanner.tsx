import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, ExternalLink } from 'lucide-react';

const CANDIDATE_IMAGES = [
  '/img/adbanner.jpg',
  '/img/banner.jpg',
  '/img/banner.png',
  '/img/banner.webp',
  '/img/banner.jpeg',
];

// Safe positions on the site that never block essential buttons or the WhatsApp concierge (bottom-right)
const SAFE_POSITIONS = [
  'bottom-5 left-5', // Bottom Left (Safe from bottom-right concierge)
  'bottom-5 left-1/2 -translate-x-1/2', // Bottom Center
  'top-28 right-5', // Top Right (Below Navbar)
];

export const TelegramAdBanner: React.FC = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [positionClass, setPositionClass] = useState(SAFE_POSITIONS[0]);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('elitebath_tg_ad_dismissed');
    if (isDismissed) return;

    // Pick a safe area on page visit/navigation
    const randomPos = SAFE_POSITIONS[Math.floor(Math.random() * SAFE_POSITIONS.length)];
    setPositionClass(randomPos);

    // Subtle entrance delay for a smooth, premium feel
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

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

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Sponsored Announcement"
      className={`fixed z-40 max-w-[280px] sm:max-w-[320px] transition-all duration-500 ease-in-out animate-fadeInUp ${positionClass}`}
    >
      <div className="relative group bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-primary/25 hover:border-primary/40">
        {/* Close Button (X) */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/65 hover:bg-black text-white transition-colors shadow-md backdrop-blur-sm cursor-pointer"
          title="Close ad"
          aria-label="Close ad"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Clickable Banner Link to Telegram */}
        <a
          href="https://t.me/lennoxislive"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {!imgError ? (
            <div className="relative aspect-[16/9] w-full bg-gray-100 overflow-hidden">
              <img
                src={CANDIDATE_IMAGES[imgIndex]}
                alt="Elite Bath Announcement"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={handleImageError}
              />
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Send className="h-3 w-3 text-sky-400" />
                <span>@lennoxislive</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-80" />
              </div>
            </div>
          ) : (
            /* Elegant Fallback Card until user places banner image in /public/img/ */
            <div className="p-3.5 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Official Telegram</p>
                  <p className="text-[10px] text-sky-300">@lennoxislive</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Exclusive bath fitting deals, instant catalog releases & direct inquiries.
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] font-bold text-sky-400 group-hover:underline">
                <span>Join Channel Now</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          )}
        </a>
      </div>
    </aside>
  );
};
