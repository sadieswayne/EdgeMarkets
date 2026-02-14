import { memo, useCallback, Fragment } from 'react';
import { ExternalLink, Brain } from 'lucide-react';
import { type ArbitrageOpportunity } from '../lib/types';
import { formatPrice, formatPercent, formatLiquidity, formatTimeAgo } from '../lib/format';
import { SORT_OPTIONS } from '../lib/constants';
import { PriceFlash } from './PriceFlash';
import { ConfidenceBars } from './ConfidenceBars';
import { OpportunityDetail } from './OpportunityDetail';
import { motion, AnimatePresence } from 'framer-motion';
import { openTradeLink } from '../lib/deepLinks';
import type { WalletState } from '../hooks/useWalletState';
import { PlatformLogo } from './PlatformLogo';


interface OpportunityTableProps {
  opportunities: ArbitrageOpportunity[];
  priceFlashes: Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }>;
  newRowIds: Set<string>;
  expandedRow: string | null;
  onExpandRow: (id: string | null) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  walletState?: WalletState;
  onExecute?: (platform: string, asset: string) => void;
  onAskAI?: (opportunityId: string, label: string) => void;
}

export const OpportunityTable = memo(function OpportunityTable({
  opportunities,
  priceFlashes,
  newRowIds,
  expandedRow,
  onExpandRow,
  sort,
  onSortChange,
  walletState,
  onExecute,
  onAskAI,
}: OpportunityTableProps) {
  const handleRowClick = useCallback((id: string) => {
    onExpandRow(expandedRow === id ? null : id);
  }, [expandedRow, onExpandRow]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--green)' }} />
          <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Live Opportunities
          </span>
          <span
            className="text-[11px] font-mono-nums px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--pill-bg)', color: 'var(--text-tertiary)' }}
          >
            {opportunities.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Sort:</span>
          <select
            data-testid="select-sort"
            value={sort}
            onChange={e => onSortChange(e.target.value)}
            className="text-[12px] px-2.5 py-1.5 rounded-lg outline-none cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
            }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-thin">
        <table className="w-full" style={{ minWidth: 900 }}>
          <thead className="sticky top-0" style={{ zIndex: 10 }}>
            <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
              <Th width="60px" align="center">Route</Th>
              <Th width="200px">Asset / Event</Th>
              <Th width="130px">Buy</Th>
              <Th width="130px">Sell</Th>
              <Th width="80px" align="right">Spread</Th>
              <Th width="100px" align="right">Net Profit</Th>
              <Th width="70px" align="center">Conf</Th>
              <Th width="80px" align="right">Liquidity</Th>
              <Th width="55px" align="right">Age</Th>
              <Th width="130px" align="center">Action</Th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {opportunities.map((opp, i) => {
                const isNew = newRowIds.has(opp.id);
                const isExpiring = opp.status === 'expiring';
                const isExpanded = expandedRow === opp.id;
                const flash = priceFlashes[opp.id];

                return (
                  <Fragment key={opp.id}>
                    <motion.tr
                      data-testid={`row-opportunity-${opp.id}`}
                      initial={isNew ? { opacity: 0, y: -10 } : false}
                      animate={{ opacity: isExpiring ? 0.3 : 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      onClick={() => handleRowClick(opp.id)}
                      className={`cursor-pointer transition-all duration-200 ${isNew ? 'animate-row-glow' : ''}`}
                      style={{
                        height: 48,
                        backgroundColor: isExpanded ? 'var(--bg-hover)' : 'transparent',
                        borderBottom: '1px solid var(--border-primary)',
                      }}
                      onMouseEnter={e => {
                        if (!isExpanded) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isExpanded) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <td className="text-center px-2">
                        <div className="flex items-center justify-center gap-0.5">
                          <PlatformLogo name={opp.buyPlatform} size={16} />
                          <span className="text-[9px]" style={{ color: 'var(--text-disabled)' }}>{'>'}</span>
                          <PlatformLogo name={opp.sellPlatform} size={16} />
                        </div>
                      </td>
                      <td className="px-2">
                        <div className="text-[13px] truncate" style={{ color: 'var(--text-primary)', maxWidth: 190 }}>{opp.assetShort}</div>
                      </td>
                      <td className="px-2">
                        <div className="flex items-center gap-1.5">
                          <PlatformPill name={opp.buyPlatform} />
                          <PriceFlash
                            value={formatPrice(opp.buyPrice)}
                            flash={flash?.buy}
                            className="text-[13px]"
                          />
                        </div>
                      </td>
                      <td className="px-2">
                        <div className="flex items-center gap-1.5">
                          <PlatformPill name={opp.sellPlatform} />
                          <PriceFlash
                            value={formatPrice(opp.sellPrice)}
                            flash={flash?.sell}
                            className="text-[13px]"
                          />
                        </div>
                      </td>
                      <td className="text-right px-2">
                        <span
                          className="font-mono-nums text-[13px]"
                          style={{ color: opp.rawSpread >= 2 ? 'var(--green)' : opp.rawSpread >= 0.5 ? 'var(--amber)' : 'var(--text-secondary)' }}
                        >
                          {formatPercent(opp.rawSpread)}
                        </span>
                      </td>
                      <td className="text-right px-2">
                        <div className="font-mono-nums text-[13px]" style={{ color: 'var(--green)' }}>
                          <div>${opp.netProfitDollar.toFixed(2)}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{formatPercent(opp.netProfit)}</div>
                        </div>
                      </td>
                      <td className="text-center px-2">
                        <div className="flex items-center justify-center gap-1">
                          <ConfidenceBars level={opp.confidence} />
                          {opp.hasAiInsight && (
                            <Brain size={10} style={{ color: 'var(--accent-primary)', opacity: 0.7 }} />
                          )}
                        </div>
                      </td>
                      <td className="text-right px-2">
                        <span className="font-mono-nums text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                          {formatLiquidity(opp.liquidity)}
                        </span>
                      </td>
                      <td className="text-right px-2">
                        <span className="font-mono-nums text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                          {formatTimeAgo(opp.detectedAt)}
                        </span>
                      </td>
                      <td className="text-center px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            data-testid={`button-buy-${opp.id}`}
                            className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                            style={{
                              backgroundColor: 'var(--green-subtle)',
                              color: 'var(--green)',
                              border: '1px solid var(--green-border)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--green-border)'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--green-subtle)'; }}
                            onClick={e => {
                              e.stopPropagation();
                              openTradeLink(opp.buyPlatform, opp.asset);
                              onExecute?.(opp.buyPlatform, opp.asset);
                            }}
                          >
                            Buy
                          </button>
                          <button
                            data-testid={`button-sell-${opp.id}`}
                            className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                            style={{
                              backgroundColor: 'var(--red-subtle)',
                              color: 'var(--red)',
                              border: '1px solid var(--red-border)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--red-border)'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--red-subtle)'; }}
                            onClick={e => {
                              e.stopPropagation();
                              openTradeLink(opp.sellPlatform, opp.asset);
                              onExecute?.(opp.sellPlatform, opp.asset);
                            }}
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} style={{ padding: 0 }}>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <OpportunityDetail opportunity={opp} onExecute={onExecute} onAskAI={onAskAI} />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
});

const PLATFORM_BRAND: Record<string, { color: string; label: string }> = {
  binance: { color: '#F0B90B', label: 'BIN' },
  coinbase: { color: '#0052FF', label: 'CB' },
  bybit: { color: '#F7A600', label: 'BB' },
  kraken: { color: '#7B61FF', label: 'KRK' },
  polymarket: { color: '#00D395', label: 'POLY' },
  kalshi: { color: '#FF6B35', label: 'KAL' },
};

function PlatformPill({ name }: { name: string }) {
  const key = name.toLowerCase().replace(/\s/g, '');
  const brand = PLATFORM_BRAND[key];

  if (brand) {
    return (
      <span
        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor: `${brand.color}10`,
          color: brand.color,
          border: `1px solid ${brand.color}20`,
        }}
      >
        <PlatformLogo name={name} size={12} />
        <span className="font-medium tracking-tight">{brand.label}</span>
      </span>
    );
  }

  const short = name.length > 10 ? name.slice(0, 8) + '..' : name;
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full truncate flex-shrink-0"
      style={{
        backgroundColor: 'var(--pill-bg)',
        color: 'var(--text-tertiary)',
        maxWidth: 70,
      }}
    >
      {short}
    </span>
  );
}

function Th({ children, width, align = 'left' }: { children: string; width: string; align?: string }) {
  return (
    <th
      className="px-2 py-2.5 text-[11px] uppercase tracking-[0.05em] font-medium whitespace-nowrap"
      style={{
        width,
        textAlign: align as any,
        color: 'var(--text-tertiary)',
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      {children}
    </th>
  );
}
