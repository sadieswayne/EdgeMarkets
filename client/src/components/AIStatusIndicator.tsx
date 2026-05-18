import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

interface AIStatusData {
  available: boolean;
  connected: boolean;
  callsToday: number;
  costToday: number;
  dailyLimit: number;
  isWarning: boolean;
  isLimited: boolean;
}

interface AIStatusIndicatorProps {
  onChatOpen: () => void;
}

export function AIStatusIndicator({ onChatOpen }: AIStatusIndicatorProps) {
  const [status, setStatus] = useState<AIStatusData | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/ai/status');
        const data = await res.json();
        setStatus(data);
      } catch {
        setStatus(null);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = status?.available && status?.connected;
  const statusColor = !status?.available ? 'var(--text-tertiary)' :
    status.isLimited ? 'var(--red)' :
    status.isWarning ? 'var(--amber)' :
    'var(--accent-primary)';

  return (
    <div className="relative">
      <button
        data-testid="button-ai-status"
        onClick={onChatOpen}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-150"
        style={{
          border: '1px solid var(--border-primary)',
          color: statusColor,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
          setShowTooltip(true);
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)';
          setShowTooltip(false);
        }}
      >
        <Brain size={14} />
        <span className="uppercase tracking-[0.05em] font-medium">AI</span>
        <div
          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse-dot' : ''}`}
          style={{ backgroundColor: statusColor }}
        />
      </button>

      {showTooltip && status && (
        <div
          className="absolute top-full right-0 mt-1 p-3 rounded-lg z-50 min-w-[180px]"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Status</span>
              <span className="text-[10px] font-medium" style={{ color: statusColor }}>
                {status.isLimited ? 'LIMIT REACHED' : status.isWarning ? 'WARNING' : isActive ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Calls Today</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                {status.callsToday}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Cost</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                ${status.costToday.toFixed(2)} / ${status.dailyLimit}
              </span>
            </div>
            <div
              className="h-1 rounded-full mt-1"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (status.costToday / status.dailyLimit) * 100)}%`,
                  backgroundColor: statusColor,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
