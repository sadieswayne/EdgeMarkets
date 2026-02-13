import { Zap } from 'lucide-react';

export function MobileGuard() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-8 text-center"
      style={{ backgroundColor: 'var(--bg-primary)', zIndex: 9999 }}
    >
      <div className="flex items-center gap-2.5 mb-6">
        <Zap size={22} style={{ color: 'var(--accent-primary)' }} />
        <span className="text-[24px] font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
          EDGE
        </span>
      </div>
      <p className="text-[15px] leading-relaxed mb-2" style={{ color: 'var(--text-secondary)', maxWidth: 320 }}>
        EDGE is best experienced on desktop.
      </p>
      <p className="text-[13px]" style={{ color: 'var(--text-tertiary)', maxWidth: 320 }}>
        Our trading terminal requires a larger screen for the full data-dense experience. Please switch to a desktop browser.
      </p>
    </div>
  );
}
