import { useMemo, memo } from 'react';
import { TrendingUp, Bitcoin, BarChart3, ArrowLeftRight, Zap } from 'lucide-react';
import { type ArbitrageOpportunity, type OpportunityType } from '../lib/types';
import { formatPercent } from '../lib/format';

const TYPE_ICONS: Record<OpportunityType, typeof TrendingUp> = {
  prediction: TrendingUp,
  crypto_spot: Bitcoin,
  futures_basis: BarChart3,
  forex: ArrowLeftRight,
  options: Zap,
};

interface TickerBarProps {
  opportunities: ArbitrageOpportunity[];
}

export const TickerBar = memo(function TickerBar({ opportunities }: TickerBarProps) {
  const tickerItems = useMemo(() => {
    return opportunities
      .filter(o => o.status === 'active')
      .slice(0, 20)
      .map(opp => {
        const Icon = TYPE_ICONS[opp.type];
        return (
          <span key={opp.id} className="flex items-center gap-1.5 whitespace-nowrap">
            <Icon size={11} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{opp.assetShort}</span>
            <span className="font-mono-nums" style={{ color: 'var(--green)' }}>+{formatPercent(opp.rawSpread)}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>{opp.buyPlatform}</span>
            <span style={{ color: 'var(--text-disabled)' }}>&#x2194;</span>
            <span style={{ color: 'var(--text-tertiary)' }}>{opp.sellPlatform}</span>
            <span className="font-mono-nums" style={{ color: 'var(--green)' }}>+${opp.netProfitDollar.toFixed(2)}</span>
            <span style={{ color: 'var(--text-disabled)', opacity: 0.4 }} className="mx-3">&#183;</span>
          </span>
        );
      });
  }, [opportunities]);

  if (tickerItems.length === 0) return null;

  return (
    <div
      data-testid="ticker-bar"
      className="flex-shrink-0 overflow-hidden relative"
      style={{
        height: 34,
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-primary)',
      }}
    >
      <div
        className="flex items-center h-full animate-ticker text-[12px]"
        style={{ width: 'max-content', '--ticker-duration': '80s' } as any}
      >
        <div className="flex items-center gap-0">
          {tickerItems}
        </div>
        <div className="flex items-center gap-0">
          {tickerItems}
        </div>
      </div>
    </div>
  );
});
