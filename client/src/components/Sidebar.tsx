import { useState, useCallback, useMemo, useEffect } from 'react';
import { Layers, TrendingUp, Bitcoin, BarChart3, ArrowLeftRight, Zap, Check, Bot, Activity } from 'lucide-react';
import { type FilterState, type OpportunityType, type LiveStats } from '../lib/types';
import { PLATFORMS, LIQUIDITY_OPTIONS, TIME_OPTIONS } from '../lib/constants';
import { formatCurrency, formatPercent } from '../lib/format';
import type { PlatformConnection } from '../hooks/useLiveData';
import type { AggregatePerformance } from '../hooks/useBots';

const ICON_MAP: Record<string, typeof Layers> = {
  Layers, TrendingUp, Bitcoin, BarChart3, ArrowLeftRight, Zap,
};

const CATS: { id: OpportunityType | 'all'; label: string; iconName: string }[] = [
  { id: 'all', label: 'All', iconName: 'Layers' },
  { id: 'prediction', label: 'Prediction Markets', iconName: 'TrendingUp' },
  { id: 'crypto_spot', label: 'Crypto Spot', iconName: 'Bitcoin' },
  { id: 'futures_basis', label: 'Futures / Basis', iconName: 'BarChart3' },
  { id: 'forex', label: 'Forex', iconName: 'ArrowLeftRight' },
  { id: 'options', label: 'Options', iconName: 'Zap' },
];

const BOT_CATS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Bots' },
  { id: 'running', label: 'Running' },
  { id: 'paused', label: 'Paused' },
  { id: 'stopped', label: 'Stopped' },
  { id: 'paper', label: 'Paper Mode' },
  { id: 'live', label: 'Live Mode' },
];

interface SidebarProps {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  liveStats: LiveStats;
  categoryCounts: Record<string, number>;
  connections?: PlatformConnection[];
  activeTab?: 'explorer' | 'autopilot' | 'docs';
}

export function Sidebar({ filters, onFiltersChange, liveStats, categoryCounts, connections = [], activeTab = 'explorer' }: SidebarProps) {
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const togglePlatform = useCallback((platform: string) => {
    const current = filters.platforms;
    const next = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform];
    updateFilter('platforms', next);
  }, [filters.platforms, updateFilter]);

  const sidebarPlatforms = useMemo(() => PLATFORMS.slice(0, 5), []);

  if (activeTab === 'autopilot') {
    return <AutopilotSidebar />;
  }

  return (
    <aside
      data-testid="sidebar"
      className="flex flex-col flex-shrink-0 overflow-y-auto scrollbar-thin"
      style={{
        width: 240,
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)',
      }}
    >
      <div className="p-4 flex flex-col gap-5 flex-1">
        <div>
          <div className="text-label mb-3">Categories</div>
          <div className="flex flex-col gap-1">
            {CATS.map(cat => {
              const Icon = ICON_MAP[cat.iconName];
              const isActive = filters.category === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  data-testid={`category-${cat.id}`}
                  onClick={() => updateFilter('category', cat.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200 w-full"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={15} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
                  <span className="text-[13px] flex-1 truncate">{cat.label}</span>
                  <span
                    className="text-[11px] font-mono-nums px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: isActive ? 'var(--accent-glow)' : 'var(--pill-bg)', color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <div className="text-label mb-3">Filters</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] mb-1.5 block font-medium" style={{ color: 'var(--text-tertiary)' }}>Min Spread</label>
              <div className="relative">
                <input
                  data-testid="input-min-spread"
                  type="number"
                  step="0.1"
                  value={filters.minSpread}
                  onChange={e => updateFilter('minSpread', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pr-6 text-[13px] font-mono-nums rounded-lg outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'; }}
                  onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-primary)'; }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >%</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] mb-1.5 block font-medium" style={{ color: 'var(--text-tertiary)' }}>Min Profit</label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >$</span>
                <input
                  data-testid="input-min-profit"
                  type="number"
                  step="0.50"
                  value={filters.minProfit}
                  onChange={e => updateFilter('minProfit', parseFloat(e.target.value) || 0)}
                  className="w-full pl-6 pr-3 py-2 text-[13px] font-mono-nums rounded-lg outline-none transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-accent)'; }}
                  onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-primary)'; }}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] mb-1.5 block font-medium" style={{ color: 'var(--text-tertiary)' }}>Platforms</label>
              <div className="flex flex-col gap-1.5">
                {sidebarPlatforms.map(p => (
                  <label
                    key={p}
                    className="flex items-center gap-2 py-0.5 cursor-pointer group"
                  >
                    <div
                      data-testid={`checkbox-${p.toLowerCase()}`}
                      onClick={() => togglePlatform(p)}
                      className="w-4 h-4 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 flex-shrink-0"
                      style={{
                        border: `1.5px solid ${filters.platforms.includes(p) ? 'var(--accent-primary)' : 'var(--border-accent)'}`,
                        backgroundColor: filters.platforms.includes(p) ? 'var(--accent-primary)' : 'transparent',
                      }}
                    >
                      {filters.platforms.includes(p) && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <span
                      className="text-[12px] transition-colors duration-150"
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={() => togglePlatform(p)}
                    >{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] mb-1.5 block font-medium" style={{ color: 'var(--text-tertiary)' }}>Liquidity</label>
              <div className="flex gap-1.5 flex-wrap">
                {LIQUIDITY_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    data-testid={`liquidity-${opt}`}
                    onClick={() => updateFilter('liquidity', opt)}
                    className="px-2.5 py-1 text-[11px] rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: filters.liquidity === opt ? 'var(--accent-glow)' : 'var(--pill-bg)',
                      border: `1px solid ${filters.liquidity === opt ? 'rgba(59,130,246,0.3)' : 'var(--border-primary)'}`,
                      color: filters.liquidity === opt ? 'var(--accent-secondary)' : 'var(--text-tertiary)',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] mb-1.5 block font-medium" style={{ color: 'var(--text-tertiary)' }}>Time Sensitivity</label>
              <select
                data-testid="select-time-sensitivity"
                value={filters.timeSensitivity}
                onChange={e => updateFilter('timeSensitivity', e.target.value)}
                className="w-full px-3 py-2 text-[12px] rounded-lg outline-none cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                }}
              >
                {TIME_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-auto" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <div className="text-label mb-3">Live Stats</div>
          <div className="flex flex-col gap-3">
            <StatItem label="Opportunities" value={liveStats.totalOpportunities.toString()} large color="var(--text-primary)" />
            <StatItem label="Avg Spread" value={formatPercent(liveStats.avgSpread)} color="var(--accent-primary)" />
            <StatItem label="Best Opportunity" value={formatPercent(liveStats.bestOpportunity)} color="var(--green)" />
            <StatItem label="Total Volume" value={formatCurrency(liveStats.totalVolume)} color="var(--text-secondary)" />
          </div>
        </div>

        {connections.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
            <div className="text-label mb-3">Feeds</div>
            <div className="flex flex-col gap-2">
              {connections.map(conn => {
                const statusColor = conn.status === 'connected' ? 'var(--green)' :
                  conn.status === 'connecting' ? 'var(--amber)' : 'var(--red)';
                return (
                  <div key={conn.platform} className="flex items-center gap-2" data-testid={`feed-${conn.platform}`}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
                    <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{conn.platform}</span>
                    <span className="text-[10px] font-mono-nums" style={{ color: 'var(--text-tertiary)' }}>
                      {conn.pairsCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-auto" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <a
            href="https://x.com/EdgeMarketsX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </svg>
            <span className="text-[13px] font-medium group-hover:text-white transition-colors">@EdgeMarketsX</span>
          </a>
        </div>

        <div className="mt-4" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="text-[11px] uppercase tracking-[0.05em]" style={{ color: 'var(--text-tertiary)' }}>$EDGE Tier</div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-mono-nums font-semibold" style={{ color: 'var(--amber)' }}>FREE</span>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Stake to upgrade</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AutopilotSidebar() {
  const [botFilter, setBotFilter] = useState('all');
  const [aggregate, setAggregate] = useState<AggregatePerformance | null>(null);

  useEffect(() => {
    const fetchAggregate = async () => {
      try {
        const res = await fetch('/api/bots/aggregate');
        if (res.ok) {
          const data = await res.json();
          setAggregate(data.aggregate);
        }
      } catch (_) {}
    };
    fetchAggregate();
    const interval = setInterval(fetchAggregate, 5000);
    return () => clearInterval(interval);
  }, []);

  const pnlColor = (val: number) => val >= 0 ? 'var(--green)' : 'var(--red)';
  const winRateColor = (rate: number) => rate >= 80 ? 'var(--green)' : rate >= 60 ? 'var(--amber)' : 'var(--red)';

  return (
    <aside
      data-testid="sidebar-autopilot"
      className="flex flex-col flex-shrink-0 overflow-y-auto scrollbar-thin"
      style={{
        width: 240,
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)',
      }}
    >
      <div className="p-4 flex flex-col gap-5 flex-1">
        <div>
          <div className="text-label mb-3">Bot Filters</div>
          <div className="flex flex-col gap-1">
            {BOT_CATS.map(cat => {
              const isActive = botFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  data-testid={`bot-filter-${cat.id}`}
                  onClick={() => setBotFilter(cat.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200 w-full"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {cat.id === 'all' ? <Bot size={15} style={{ opacity: 0.6, flexShrink: 0 }} /> :
                   cat.id === 'running' ? <Activity size={15} style={{ opacity: 0.8, flexShrink: 0, color: 'var(--green)' }} /> :
                   <Bot size={15} style={{ opacity: 0.6, flexShrink: 0 }} />}
                  <span className="text-[13px] flex-1 truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <div className="text-label mb-3">Bot Stats</div>
          <div className="flex flex-col gap-3">
            <StatItem
              label="Active Bots"
              value={aggregate ? aggregate.activeBots.toString() : '0'}
              large
              color="var(--text-primary)"
            />
            <StatItem
              label="Today PnL"
              value={aggregate ? `${aggregate.todayPnl >= 0 ? '+' : ''}${formatCurrency(aggregate.todayPnl)}` : '$0.00'}
              color={aggregate ? pnlColor(aggregate.todayPnl) : 'var(--text-secondary)'}
            />
            <StatItem
              label="Win Rate"
              value={aggregate ? formatPercent(aggregate.winRate) : '0.00%'}
              color={aggregate ? winRateColor(aggregate.winRate) : 'var(--text-secondary)'}
            />
            <StatItem
              label="Trades Today"
              value={aggregate ? aggregate.todayTrades.toString() : '0'}
              color="var(--text-secondary)"
            />
            <StatItem
              label="Total Volume"
              value={aggregate ? formatCurrency(aggregate.totalVolume) : '$0'}
              color="var(--text-secondary)"
            />
          </div>
        </div>

        <div className="mt-auto" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <a
            href="https://x.com/EdgeMarketsX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </svg>
            <span className="text-[13px] font-medium group-hover:text-white transition-colors">@EdgeMarketsX</span>
          </a>
        </div>

        <div className="mt-4" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="text-[11px] uppercase tracking-[0.05em]" style={{ color: 'var(--text-tertiary)' }}>$EDGE Tier</div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-mono-nums font-semibold" style={{ color: 'var(--amber)' }}>FREE</span>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Stake to upgrade</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function StatItem({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.05em]" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
      <span
        className={`font-mono-nums font-semibold ${large ? 'text-[22px]' : 'text-[16px]'}`}
        style={{ color }}
      >{value}</span>
    </div>
  );
}
