import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, X, Rocket } from 'lucide-react';

// Bump this when there's a new announcement to surface — anyone who
// previously dismissed an older version will see it again, but the same
// version won't pop up twice on the same browser.
const ANNOUNCEMENT_VERSION = 'ipo-markets-v1';
const STORAGE_KEY = 'edge-announcement-seen';
const AUTO_DISMISS_MS = 6000;

export function AnnouncementModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen === ANNOUNCEMENT_VERSION) return;
    } catch { /* storage unavailable — show anyway */ }
    // Small delay so it appears after the table starts populating.
    const showTimer = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [open]);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, ANNOUNCEMENT_VERSION); } catch {}
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={dismiss}
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2"
            style={{ width: 460 }}
          >
            <div
              data-testid="announcement-modal"
              className="relative rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-accent)',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.55)',
              }}
            >
              <button
                data-testid="button-announcement-close"
                onClick={dismiss}
                aria-label="Close"
                className="absolute top-3 right-3 p-1.5 rounded-md transition-colors duration-150 z-10"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <X size={16} />
              </button>

              {/* Hero banner */}
              <div
                className="flex items-center justify-center"
                style={{
                  height: 160,
                  background:
                    'radial-gradient(120% 100% at 50% 0%, rgba(236, 72, 153, 0.18) 0%, rgba(59, 130, 246, 0.08) 60%, transparent 100%)',
                  borderBottom: '1px solid var(--border-primary)',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-2xl"
                  style={{
                    width: 76,
                    height: 76,
                    backgroundColor: 'rgba(236, 72, 153, 0.12)',
                    border: '1px solid rgba(236, 72, 153, 0.35)',
                  }}
                >
                  <Briefcase size={34} style={{ color: '#EC4899' }} />
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pt-5 pb-5 text-center">
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3"
                  style={{
                    backgroundColor: 'rgba(236, 72, 153, 0.12)',
                    color: '#EC4899',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                  }}
                >
                  New
                </div>
                <h2
                  className="text-[18px] font-semibold mb-1.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  IPO Markets are live
                </h2>
                <p
                  className="text-[13px] leading-relaxed mb-4"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Trade real pre-IPO exposure through our Hyperliquid wrapper,
                  alongside crypto, prediction markets and forex — all in one
                  terminal.
                </p>

                <button
                  data-testid="button-announcement-cta"
                  onClick={dismiss}
                  className="w-full rounded-lg py-2.5 text-[13px] font-semibold transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
                >
                  Got it
                </button>
              </div>

              {/* Updated footer */}
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{ borderTop: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
              >
                <Rocket size={12} style={{ color: 'var(--accent-primary)' }} />
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  EDGE just updated!
                </span>
              </div>

              {/* Auto-dismiss progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-[2px]"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
