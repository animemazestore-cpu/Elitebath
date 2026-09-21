import React, { useState } from 'react';
import { X, Send, ExternalLink, Code2 } from 'lucide-react';

export const TelegramAdBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    return !sessionStorage.getItem('elitebath_tg_ad_dismissed');
  });

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
      className="w-full bg-gradient-to-r from-slate-950 via-[#0d1322] to-slate-950 border-b border-indigo-500/20 transition-all duration-300 relative overflow-hidden shadow-sm"
    >
      {/* Background ambient glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Main Container - Full Length, Perfectly Proportioned */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 relative flex items-center justify-between gap-3">
        {/* Clickable Area linking to Telegram */}
        <a
          href="https://t.me/lennoxislive"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-grow flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6 group cursor-pointer pr-8 sm:pr-0"
          title="Contact Website Developer @lennoxislive"
        >
          {/* Left: Developer Badge & Tagline */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
              <Code2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>WEBSITE DEVELOPER</span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
              <span>Modern websites</span>
              <span className="mx-2 text-indigo-400 font-bold">•</span>
              <span>Fast performance</span>
              <span className="mx-2 text-indigo-400 font-bold hidden xs:inline">•</span>
              <span className="hidden xs:inline">Clean & scalable code</span>
            </p>
          </div>

          {/* Right: Telegram Contact Pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all group-hover:scale-105 whitespace-nowrap">
              <Send className="h-3.5 w-3.5 fill-current" />
              <span>Contact @lennoxislive</span>
              <ExternalLink className="h-3 w-3 opacity-80" />
            </span>
          </div>
        </a>

        {/* Close Button (X) - collapses space immediately */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close announcement"
          aria-label="Close announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};
