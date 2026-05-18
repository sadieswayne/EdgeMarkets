import { memo, useCallback } from 'react';
import { ExternalLink, Brain, Loader2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { type ArbitrageOpportunity } from '../lib/types';
import { formatPrice, formatPercent, formatCurrency } from '../lib/format';
import { SparklineChart } from './SparklineChart';
import { ConfidenceBars } from './ConfidenceBars';
import { openTradeLink } from '../lib/deepLinks';
import { PlatformLogo } from './PlatformLogo';

interface OpportunityDetailProps {
  opportunity: ArbitrageOpportunity;
  onExecute?: (platform: string, asset: string) => void;
  onAskAI?: (opportunityId: string, label: string) => void;
}

export const OpportunityDetail = memo(function OpportunityDetail({ opportunity: opp, onExecute, onAskAI }: OpportunityDetailProps) {
  const handleExecute = useCallback((platform: string) => {
    openTradeLink(platform, opp.asset);
    onExecute?.(platform, opp.asset);
  }, [opp.asset, onExecute]);

  return (
    <div
      data-testid={`detail-${opp.id}`}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--border-accent)',
      }}
      className="px-5 py-4"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{opp.asset}</span>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--accent-glow)' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--accent-primary)' }} />
          <span className="text-[10px] uppercase font-medium" style={{ color: 'var(--accent-primary)' }}>Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <LegCard
          title="BUY LEG"
          side="buy"
          platform={opp.buyPlatform}
          price={formatPrice(opp.buyPrice)}
          priceLabel="ASK"
          fee={formatPercent(opp.buyFee)}
          depth={formatCurrency(opp.liquidity * 0.6)}
          onExecute={() => handleExecute(opp.buyPlatform)}
        />
        <LegCard
          title="SELL LEG"
          side="sell"
          platform={opp.sellPlatform}
          price={formatPrice(opp.sellPrice)}
          priceLabel="BID"
          fee={formatPercent(opp.sellFee)}
          depth={formatCurrency(opp.liquidity * 0.4)}
          onExecute={() => handleExecute(opp.sellPlatform)}
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-[12px]">
        <div>
          <span style={{ color: 'var(--text-tertiary)' }}>Raw Spread: </span>
          <span className="font-mono-nums" style={{ color: 'var(--text-primary)' }}>{formatPercent(opp.rawSpread)}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-tertiary)' }}>Net Profit: </span>
          <span className="font-mono-nums" style={{ color: 'var(--green)' }}>{formatPercent(opp.netProfit)} (~${opp.netProfitDollar.toFixed(2)})</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-tertiary)' }}>Slippage Est: </span>
          <span className="font-mono-nums" style={{ color: 'var(--text-secondary)' }}>{formatPercent(opp.slippageEst)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--text-tertiary)' }}>Confidence: </span>
          <ConfidenceBars level={opp.confidence} />
          <span className="font-mono-nums" style={{ color: 'var(--text-secondary)' }}>({opp.confidence}/5)</span>
        </div>
      </div>

      <div
        className="mb-4 p-4 rounded-xl text-[13px]"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Brain size={13} style={{ color: 'var(--accent-primary)' }} />
            <span className="text-label" style={{ color: 'var(--accent-primary)' }}>AI Insight</span>
            {opp.isAiAnalyzing && (
              <Loader2 size={11} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            )}
            {opp.aiModel && (
              <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--pill-bg)', color: 'var(--text-tertiary)' }}>
                {opp.aiModel}
              </span>
            )}
          </div>
          {onAskAI && (
            <button
              data-testid={`button-ask-ai-${opp.id}`}
              onClick={() => onAskAI(opp.id, `${opp.asset} ${opp.buyPlatform}\u2192${opp.sellPlatform}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
              style={{
                border: '1px solid var(--border-primary)',
                color: 'var(--accent-primary)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <Brain size={10} />
              Ask AI
            </button>
          )}
        </div>
        {opp.hasAiInsight ? (
          <>
            <p className="leading-relaxed italic">"{opp.aiInsight}"</p>
            {opp.aiRisk && (
              <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                <div className="flex items-center gap-1">
                  {opp.aiRisk === 'LOW' ? <ShieldCheck size={12} style={{ color: 'var(--green)' }} /> :
                   opp.aiRisk === 'MEDIUM' ? <ShieldAlert size={12} style={{ color: 'var(--amber)' }} /> :
                   <ShieldX size={12} style={{ color: 'var(--red)' }} />}
                  <span className="text-[11px] font-medium" style={{
                    color: opp.aiRisk === 'LOW' ? 'var(--green)' : opp.aiRisk === 'MEDIUM' ? 'var(--amber)' : 'var(--red)'
                  }}>
                    {opp.aiRisk} RISK
                  </span>
                </div>
                {opp.aiConfidence != null && (
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    Confidence: {opp.aiConfidence}/5
                  </span>
                )}
              </div>
            )}
          </>
        ) : opp.isAiAnalyzing ? (
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Analyzing opportunity...</p>
        ) : (
          <p className="leading-relaxed italic">"{opp.aiInsight}"</p>
        )}
        {opp.aiReason && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{opp.aiReason}</p>
        )}
      </div>

      <div>
        <div className="text-label mb-2">Spread History (5 min)</div>
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
        >
          <SparklineChart data={opp.spreadHistory} width={500} height={60} />
        </div>
      </div>
    </div>
  );
});

function LegCard({ title, platform, price, priceLabel, fee, depth, onExecute, side }: {
  title: string;
  platform: string;
  price: string;
  priceLabel: string;
  fee: string;
  depth: string;
  onExecute: () => void;
  side: 'buy' | 'sell';
}) {
  const isBuy = side === 'buy';
  const btnBg = isBuy ? 'var(--green-subtle)' : 'var(--red-subtle)';
  const btnColor = isBuy ? 'var(--green)' : 'var(--red)';
  const btnBorder = isBuy ? 'var(--green-border)' : 'var(--red-border)';
  const btnHoverBg = isBuy ? 'var(--green-border)' : 'var(--red-border)';
  const btnLabel = isBuy ? 'Buy on' : 'Sell on';

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="text-label mb-2" style={{ color: btnColor }}>{title}</div>
      <div className="flex items-center gap-2 text-[13px] mb-1" style={{ color: 'var(--text-primary)' }}>
        <PlatformLogo name={platform} size={18} />
        {platform}
      </div>
      <div className="text-[18px] font-mono-nums font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        ${price} <span className="text-[11px] font-normal" style={{ color: 'var(--text-tertiary)' }}>{priceLabel}</span>
      </div>
      <div className="flex flex-col gap-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        <span>Fee: {fee}</span>
        <span>Depth: {depth}</span>
      </div>
      <button
        data-testid={`button-${side}-${platform.toLowerCase()}`}
        onClick={onExecute}
        className="w-full mt-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
        style={{
          backgroundColor: btnBg,
          color: btnColor,
          border: `1px solid ${btnBorder}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = btnHoverBg; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = btnBg; }}
      >
        {btnLabel} {platform} <ExternalLink size={11} className="inline ml-1" />
      </button>
    </div>
  );
}
