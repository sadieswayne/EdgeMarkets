import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1500;
    const frame = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setProgress(eased * 100);
      if (pct < 1) {
        requestAnimationFrame(frame);
      } else {
        setTimeout(onComplete, 200);
      }
    };
    requestAnimationFrame(frame);
  }, [onComplete]);

  return (
    <div
      data-testid="loading-screen"
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)', zIndex: 9999 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <img src="/logo.png" alt="EDGE Logo" className="w-6 h-6 object-contain" />
        <span
          className="text-[28px] font-bold tracking-wide"
          style={{ color: 'var(--text-primary)' }}
        >
          EDGE
        </span>
      </div>
      <div
        className="w-64 h-[2px] rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--border-primary)' }}
      >
        <div
          className="h-full rounded-full transition-none"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--accent-primary)',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
          }}
        />
      </div>
      <p
        className="mt-4 text-[13px]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Connecting to markets...
      </p>
    </div>
  );
}
