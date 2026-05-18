import { useState, useCallback, useMemo } from 'react';
import {
  Bitcoin, TrendingUp, Percent, Landmark, DollarSign, Triangle,
  Play, Pause, Square, Trash2, Plus, X, AlertTriangle,
  CheckCircle, XCircle, Clock, Activity, ChevronDown, ChevronUp,
  Info, Zap, Shield, Settings,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/format';
import {
  useBots,
  type BotConfig, type BotTemplateCatalog, type ActivityLogEntry,
  type AggregatePerformance, type BotStatus, type ActivityType,
} from '../hooks/useBots';

const ICON_MAP: Record<string, typeof Bitcoin> = {
  Bitcoin, TrendingUp, Percent, Landmark, DollarSign, Triangle, Zap, Activity, Settings,
};

function getTemplateIcon(iconName: string) {
  return ICON_MAP[iconName] || Activity;
}

const STATUS_COLORS: Record<BotStatus, { bg: string; color: string }> = {
  running: { bg: 'var(--green-dim, rgba(16,185,129,0.15))', color: 'var(--green)' },
  starting: { bg: 'var(--green-dim, rgba(16,185,129,0.15))', color: 'var(--green)' },
  paused: { bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)' },
  stopping: { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)' },
  stopped: { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)' },
  error: { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)' },
  idle: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)' },
};

const ACTIVITY_COLORS: Record<string, string> = {
  trade_completed: 'var(--green)',
  bot_started: 'var(--accent-primary)',
  bot_resumed: 'var(--accent-primary)',
  bot_stopped: 'var(--text-tertiary)',
  bot_paused: 'var(--amber)',
  trade_failed: 'var(--red)',
  error: 'var(--red)',
  alert: 'var(--amber)',
  opportunity_skipped: 'var(--text-tertiary)',
};

const RISK_DOT: Record<string, string> = {
  Low: 'var(--green)',
  Medium: 'var(--amber)',
  High: 'var(--red)',
};

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string }> = {
  Beginner: { bg: 'rgba(16,185,129,0.15)', color: 'var(--green)' },
  Intermediate: { bg: 'rgba(245,158,11,0.15)', color: 'var(--amber)' },
  Advanced: { bg: 'rgba(239,68,68,0.15)', color: 'var(--red)' },
};

export function AutopilotTab() {
  const { bots, templates, activity, aggregate, loading, createBot, startBot, pauseBot, resumeBot, stopBot, deleteBot } = useBots();
  const [configModal, setConfigModal] = useState<BotTemplateCatalog | null>(null);
  const [stopModal, setStopModal] = useState<BotConfig | null>(null);

  const handleLaunch = useCallback(async (config: Partial<BotConfig>) => {
    try {
      const bot = await createBot(config);
      await startBot(bot.id);
      setConfigModal(null);
    } catch (err) {
      console.error('Failed to launch bot:', err);
    }
  }, [createBot, startBot]);

  const handleStop = useCallback(async (botId: string) => {
    try {
      await stopBot(botId);
      setStopModal(null);
    } catch (err) {
      console.error('Failed to stop bot:', err);
    }
  }, [stopBot]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-tertiary)' }}>
        <div className="text-[13px]">Loading autopilot...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AggregateStatsBar aggregate={aggregate} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ minWidth: 0 }}>
          <div className="p-5">
            <BotCatalog
              templates={templates}
              onConfigure={setConfigModal}
            />
            {bots.length > 0 && (
              <ActiveBots
                bots={bots}
                onPause={pauseBot}
                onResume={resumeBot}
                onStop={(bot) => setStopModal(bot)}
                onStart={startBot}
                onDelete={deleteBot}
              />
            )}
          </div>
        </div>
        <div
          className="flex-shrink-0 overflow-hidden flex flex-col"
          style={{
            width: '35%',
            minWidth: 280,
            maxWidth: 420,
            borderLeft: '1px solid var(--border-primary)',
          }}
        >
          <ActivityLog activity={activity} />
        </div>
      </div>

      {configModal && (
        <BotConfigModal
          template={configModal}
          onClose={() => setConfigModal(null)}
          onLaunch={handleLaunch}
        />
      )}

      {stopModal && (
        <StopBotConfirmation
          bot={stopModal}
          onClose={() => setStopModal(null)}
          onConfirm={() => handleStop(stopModal.id)}
        />
      )}
    </div>
  );
}

function AggregateStatsBar({ aggregate }: { aggregate: AggregatePerformance }) {
  const pnlTodayColor = aggregate.todayPnl >= 0 ? 'var(--green)' : 'var(--red)';
  const pnlAllTimeColor = aggregate.allTimePnl >= 0 ? 'var(--green)' : 'var(--red)';
  const winRateColor = aggregate.winRate > 80 ? 'var(--green)' : aggregate.winRate >= 60 ? 'var(--amber)' : 'var(--red)';
  const pnlSign = (v: number) => v >= 0 ? '+' : '';

  return (
    <div
      data-testid="aggregate-stats-bar"
      className="flex items-center justify-between gap-4 flex-shrink-0 px-5 flex-wrap"
      style={{
        height: 48,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      <StatChip label="BOTS" value={`${aggregate.activeBots} Running \u00B7 ${aggregate.pausedBots} Paused`} />
      <StatChip label="TODAY" value={`${pnlSign(aggregate.todayPnl)}${formatCurrency(aggregate.todayPnl)}`} valueColor={pnlTodayColor} />
      <StatChip label="ALL TIME" value={`${pnlSign(aggregate.allTimePnl)}${formatCurrency(aggregate.allTimePnl)}`} valueColor={pnlAllTimeColor} />
      <StatChip label="TRADES" value={`${aggregate.todayTrades} today (${aggregate.todayWins} wins)`} />
      <StatChip label="WIN RATE" value={formatPercent(aggregate.winRate)} valueColor={winRateColor} />
      <StatChip label="VOL" value={formatCurrency(aggregate.totalVolume)} />
    </div>
  );
}

function StatChip({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}:</span>
      <span className="text-[12px] font-mono-nums font-medium" style={{ color: valueColor || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function BotCatalog({ templates, onConfigure }: { templates: BotTemplateCatalog[]; onConfigure: (t: BotTemplateCatalog) => void }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-label">BOT CATALOG</div>
        <button
          data-testid="button-custom-strategy"
          className="flex items-center gap-1.5 text-[12px] transition-colors"
          style={{ color: 'var(--accent-primary)' }}
          onClick={() => {
            const custom: BotTemplateCatalog = {
              id: 'custom', name: 'Custom Strategy', description: 'Build your own arbitrage strategy from scratch.',
              category: 'custom', icon: 'Settings', difficulty: 'Advanced', expectedApy: 'Variable',
              riskLevel: 'Medium', platforms: ['Binance', 'Coinbase', 'Bybit', 'Kraken', 'Polymarket', 'Kalshi'],
              features: ['Fully customizable', 'Any asset pair', 'Custom rules'],
              defaultRisk: { minSpread: 0.05, maxPositionSize: 500, maxDailyExposure: 5000, maxConcurrentTrades: 3, maxDailyLoss: 50, slippageTolerance: 0.1 },
              defaultExecution: { speed: 'normal', failedLegAction: 'alert', requireAiApproval: true, minConfidence: 3 },
            };
            onConfigure(custom);
          }}
        >
          <Plus size={14} /> Custom Strategy
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {templates.map(t => (
          <TemplateCard key={t.id} template={t} onConfigure={() => onConfigure(t)} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template, onConfigure }: { template: BotTemplateCatalog; onConfigure: () => void }) {
  const Icon = getTemplateIcon(template.icon);
  const diffColors = DIFFICULTY_COLORS[template.difficulty] || DIFFICULTY_COLORS.Beginner;

  return (
    <div
      data-testid={`template-card-${template.id}`}
      className="flex flex-col rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-glow, rgba(59,130,246,0.1))' }}
          >
            <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{template.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: diffColors.bg, color: diffColors.color }}
              >
                {template.difficulty}
              </span>
              <span className="text-[11px] font-mono-nums" style={{ color: 'var(--green)' }}>{template.expectedApy} APY</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
        {template.description}
      </p>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: RISK_DOT[template.riskLevel] }} />
        <span className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>
          {template.riskLevel} Risk
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {template.platforms.map(p => (
          <span
            key={p}
            className="px-2 py-0.5 rounded-full text-[10px]"
            style={{ backgroundColor: 'var(--pill-bg)', color: 'var(--text-tertiary)' }}
          >
            {p}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {template.features.map(f => (
          <span
            key={f}
            className="px-2 py-0.5 rounded-full text-[10px]"
            style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)' }}
          >
            {f}
          </span>
        ))}
      </div>
      <button
        data-testid={`button-configure-${template.id}`}
        onClick={onConfigure}
        className="w-full py-2 rounded-lg text-[12px] font-medium text-white transition-all mt-auto"
        style={{ backgroundColor: 'var(--accent-primary)' }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        Configure & Launch
      </button>
    </div>
  );
}

function ActiveBots({
  bots, onPause, onResume, onStop, onStart, onDelete,
}: {
  bots: BotConfig[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (bot: BotConfig) => void;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-label">ACTIVE BOTS</div>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-mono-nums"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
        >
          {bots.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {bots.map(bot => (
          <BotCard
            key={bot.id}
            bot={bot}
            onPause={() => onPause(bot.id)}
            onResume={() => onResume(bot.id)}
            onStop={() => onStop(bot)}
            onStart={() => onStart(bot.id)}
            onDelete={() => onDelete(bot.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BotCard({
  bot, onPause, onResume, onStop, onStart, onDelete,
}: {
  bot: BotConfig;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStart: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_COLORS[bot.status] || STATUS_COLORS.idle;
  const todayColor = bot.performance.todayPnl >= 0 ? 'var(--green)' : 'var(--red)';
  const pnlSign = bot.performance.todayPnl >= 0 ? '+' : '';

  return (
    <div
      data-testid={`bot-card-${bot.id}`}
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{bot.name}</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] uppercase font-medium"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
          >
            {bot.status}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] uppercase font-medium"
            style={{
              backgroundColor: bot.mode === 'paper' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
              color: bot.mode === 'paper' ? 'var(--amber)' : 'var(--red)',
            }}
          >
            {bot.mode}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(bot.status === 'idle' || bot.status === 'stopped') && (
            <button data-testid={`button-start-${bot.id}`} onClick={onStart} className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--green)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Play size={14} />
            </button>
          )}
          {bot.status === 'running' && (
            <button data-testid={`button-pause-${bot.id}`} onClick={onPause} className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--amber)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Pause size={14} />
            </button>
          )}
          {bot.status === 'paused' && (
            <button data-testid={`button-resume-${bot.id}`} onClick={onResume} className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--green)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Play size={14} />
            </button>
          )}
          {(bot.status === 'running' || bot.status === 'paused') && (
            <button data-testid={`button-stop-${bot.id}`} onClick={onStop} className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--red)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Square size={14} />
            </button>
          )}
          {(bot.status === 'stopped' || bot.status === 'idle' || bot.status === 'error') && (
            <button data-testid={`button-delete-${bot.id}`} onClick={onDelete} className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Today PnL</div>
          <span className="text-[14px] font-mono-nums font-semibold" style={{ color: todayColor }}>
            {pnlSign}{formatCurrency(bot.performance.todayPnl)}
          </span>
        </div>
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Trades</div>
          <span className="text-[14px] font-mono-nums" style={{ color: 'var(--text-primary)' }}>
            {bot.performance.totalTrades}
          </span>
        </div>
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Win Rate</div>
          <span className="text-[14px] font-mono-nums" style={{ color: bot.performance.winRate > 80 ? 'var(--green)' : bot.performance.winRate >= 60 ? 'var(--amber)' : 'var(--red)' }}>
            {formatPercent(bot.performance.winRate)}
          </span>
        </div>
        <div>
          <div className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Uptime</div>
          <span className="text-[14px] font-mono-nums" style={{ color: 'var(--text-primary)' }}>
            {bot.performance.uptimeHours.toFixed(1)}h
          </span>
        </div>
      </div>

      <button
        data-testid={`button-expand-${bot.id}`}
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide details' : 'Show details'}
      </button>

      {expanded && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
            <PerfRow label="Total Trades" value={bot.performance.totalTrades.toString()} />
            <PerfRow label="Successful" value={bot.performance.successfulTrades.toString()} valueColor="var(--green)" />
            <PerfRow label="Failed" value={bot.performance.failedTrades.toString()} valueColor="var(--red)" />
            <PerfRow label="All-Time PnL" value={formatCurrency(bot.performance.totalPnl)} valueColor={bot.performance.totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} />
            <PerfRow label="Total Volume" value={formatCurrency(bot.performance.totalVolume)} />
            <PerfRow label="Avg Profit" value={formatCurrency(bot.performance.avgProfitPerTrade)} valueColor="var(--green)" />
            <PerfRow label="Best Trade" value={formatCurrency(bot.performance.bestTrade)} valueColor="var(--green)" />
            <PerfRow label="Worst Trade" value={formatCurrency(bot.performance.worstTrade)} valueColor="var(--red)" />
            <PerfRow label="Open Positions" value={bot.performance.currentOpenPositions.toString()} />
          </div>
          <PnlSparkline pnl={bot.performance.totalPnl} todayPnl={bot.performance.todayPnl} />
        </div>
      )}
    </div>
  );
}

function PerfRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="font-mono-nums" style={{ color: valueColor || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function PnlSparkline({ pnl, todayPnl }: { pnl: number; todayPnl: number }) {
  const points = useMemo(() => {
    const pts: number[] = [];
    const base = pnl - todayPnl;
    for (let i = 0; i < 20; i++) {
      const progress = i / 19;
      pts.push(base + todayPnl * progress + (Math.random() - 0.5) * Math.abs(todayPnl) * 0.3);
    }
    return pts;
  }, [pnl, todayPnl]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const h = 40;
  const w = 200;

  const pathD = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const color = todayPnl >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div className="mt-3">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

type ActivityFilter = 'all' | 'trades' | 'alerts' | 'errors';

function ActivityLog({ activity }: { activity: ActivityLogEntry[] }) {
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filtered = useMemo(() => {
    const sorted = [...activity].sort((a, b) => b.timestamp - a.timestamp);
    if (filter === 'all') return sorted;
    if (filter === 'trades') return sorted.filter(a => a.type === 'trade_completed' || a.type === 'trade_failed');
    if (filter === 'alerts') return sorted.filter(a => a.type === 'alert' || a.type === 'opportunity_skipped');
    if (filter === 'errors') return sorted.filter(a => a.type === 'error' || a.type === 'trade_failed');
    return sorted;
  }, [activity, filter]);

  const filters: { id: ActivityFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'trades', label: 'Trades' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'errors', label: 'Errors' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
        <div className="text-label">ACTIVITY LOG</div>
        <div className="flex items-center gap-1">
          {filters.map(f => (
            <button
              key={f.id}
              data-testid={`activity-filter-${f.id}`}
              onClick={() => setFilter(f.id)}
              className="px-2.5 py-1 text-[10px] rounded-full transition-all duration-200"
              style={{
                backgroundColor: filter === f.id ? 'var(--accent-glow)' : 'transparent',
                color: filter === f.id ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                border: `1px solid ${filter === f.id ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-tertiary)' }}>
            <Activity size={24} className="mb-2" style={{ opacity: 0.4 }} />
            <span className="text-[12px]">No activity yet</span>
          </div>
        ) : (
          filtered.map(entry => (
            <ActivityEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function ActivityEntry({ entry }: { entry: ActivityLogEntry }) {
  const dotColor = ACTIVITY_COLORS[entry.type] || 'var(--text-tertiary)';
  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const netProfit = entry.details?.netProfit as number | undefined;

  return (
    <div
      data-testid={`activity-entry-${entry.id}`}
      className="py-2.5"
      style={{ borderBottom: '1px solid var(--border-primary)' }}
    >
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: dotColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-mono-nums" style={{ color: 'var(--text-tertiary)' }}>{timeStr}</span>
            <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{entry.botName}</span>
            <span className="text-[10px] uppercase" style={{ color: 'var(--text-secondary)' }}>{entry.type.replace(/_/g, ' ')}</span>
            {netProfit !== undefined && (
              <span className="text-[11px] font-mono-nums font-medium" style={{ color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
              </span>
            )}
          </div>
          <div className="text-[11px] mt-0.5 pl-0" style={{ color: 'var(--text-secondary)' }}>
            {entry.message}
          </div>
        </div>
      </div>
    </div>
  );
}

function BotConfigModal({
  template, onClose, onLaunch,
}: {
  template: BotTemplateCatalog;
  onClose: () => void;
  onLaunch: (config: Partial<BotConfig>) => void;
}) {
  const [mode, setMode] = useState<'paper' | 'live'>('paper');
  const [name, setName] = useState(`${template.name} Bot`);
  const [platforms, setPlatforms] = useState<string[]>(template.platforms.slice(0, 2));
  const [risk, setRisk] = useState({ ...template.defaultRisk });
  const [execution, setExecution] = useState({ ...template.defaultExecution });
  const [notifications, setNotifications] = useState({ onTrade: true, onError: true, onPause: false });
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);
  const [launching, setLaunching] = useState(false);

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const isValid = platforms.length >= 2 && risk.minSpread > 0 && risk.maxPositionSize > 0 && name.trim().length > 0;

  const handleModeChange = (newMode: 'paper' | 'live') => {
    if (newMode === 'live') {
      setShowLiveConfirm(true);
    } else {
      setMode('paper');
    }
  };

  const handleLiveModeConfirmed = () => {
    setMode('live');
    setShowLiveConfirm(false);
  };

  const handleLaunch = async () => {
    if (!isValid) return;
    setLaunching(true);
    await onLaunch({
      template: template.id,
      name: name.trim(),
      mode,
      platforms,
      risk,
      execution,
      notifications,
      templateParams: {},
    });
    setLaunching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div
        className="relative rounded-xl scrollbar-thin"
        style={{
          maxWidth: 600,
          width: '90%',
          maxHeight: '85vh',
          overflow: 'auto',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[15px] font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
              CONFIGURE {template.name.toUpperCase()}
            </span>
            <button data-testid="button-close-config" onClick={onClose} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
              <X size={18} />
            </button>
          </div>

          <div className="mb-5">
            <div className="text-label mb-2">MODE</div>
            <div className="flex gap-2">
              <ModeButton active={mode === 'paper'} label="Paper Trading" desc="Simulated trades, no real funds" onClick={() => handleModeChange('paper')} testId="button-mode-paper" />
              <ModeButton active={mode === 'live'} label="Live Trading" desc="Real orders, real funds at risk" onClick={() => handleModeChange('live')} testId="button-mode-live" isLive />
            </div>
          </div>

          <div className="mb-5">
            <div className="text-label mb-2">BOT NAME</div>
            <input
              data-testid="input-bot-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-[13px] rounded-md outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            />
          </div>

          <div className="mb-5">
            <div className="text-label mb-2">PLATFORMS <span className="normal-case text-[10px]" style={{ color: 'var(--text-tertiary)' }}>(min 2)</span></div>
            <div className="flex flex-wrap gap-2">
              {template.platforms.map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <div
                    data-testid={`checkbox-platform-${p.toLowerCase()}`}
                    onClick={() => togglePlatform(p)}
                    className="w-3.5 h-3.5 rounded-sm flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                    style={{
                      border: `1px solid ${platforms.includes(p) ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                      backgroundColor: platforms.includes(p) ? 'var(--accent-primary)' : 'transparent',
                    }}
                  >
                    {platforms.includes(p) && <CheckCircle size={10} color="white" strokeWidth={3} />}
                  </div>
                  <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }} onClick={() => togglePlatform(p)}>{p}</span>
                </label>
              ))}
            </div>
            {platforms.length < 2 && (
              <div className="text-[11px] mt-1" style={{ color: 'var(--red)' }}>Select at least 2 platforms</div>
            )}
          </div>

          <div className="mb-5">
            <div className="text-label mb-2">RISK PARAMETERS</div>
            <div className="grid grid-cols-2 gap-3">
              <RiskInput label="Min Net Spread" suffix="%" value={risk.minSpread} onChange={v => setRisk(r => ({ ...r, minSpread: v }))} testId="input-min-spread" />
              <RiskInput label="Max Position Size" prefix="$" value={risk.maxPositionSize} onChange={v => setRisk(r => ({ ...r, maxPositionSize: v }))} testId="input-max-position" />
              <RiskInput label="Max Daily Exposure" prefix="$" value={risk.maxDailyExposure} onChange={v => setRisk(r => ({ ...r, maxDailyExposure: v }))} testId="input-max-exposure" />
              <RiskInput label="Max Concurrent Trades" value={risk.maxConcurrentTrades} onChange={v => setRisk(r => ({ ...r, maxConcurrentTrades: v }))} testId="input-max-concurrent" />
              <RiskInput label="Max Daily Loss" prefix="$" value={risk.maxDailyLoss} onChange={v => setRisk(r => ({ ...r, maxDailyLoss: v }))} testId="input-max-loss" />
              <RiskInput label="Slippage Tolerance" suffix="%" value={risk.slippageTolerance} onChange={v => setRisk(r => ({ ...r, slippageTolerance: v }))} testId="input-slippage" />
            </div>
          </div>

          <div className="mb-5">
            <div className="text-label mb-2">EXECUTION</div>
            <div className="mb-3">
              <label className="text-[11px] mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Speed</label>
              <div className="flex gap-1.5">
                {(['instant', 'fast', 'normal', 'cautious'] as const).map(s => (
                  <button
                    key={s}
                    data-testid={`button-speed-${s}`}
                    onClick={() => setExecution(e => ({ ...e, speed: s }))}
                    className="px-2.5 py-1 text-[11px] rounded transition-all capitalize"
                    style={{
                      backgroundColor: execution.speed === s ? 'var(--accent-dim, rgba(59,130,246,0.1))' : 'transparent',
                      border: `1px solid ${execution.speed === s ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                      color: execution.speed === s ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Failed Leg Action</label>
              <div className="flex gap-1.5">
                {(['unwind', 'hold', 'alert'] as const).map(a => (
                  <button
                    key={a}
                    data-testid={`button-failed-leg-${a}`}
                    onClick={() => setExecution(e => ({ ...e, failedLegAction: a }))}
                    className="px-2.5 py-1 text-[11px] rounded transition-all capitalize"
                    style={{
                      backgroundColor: execution.failedLegAction === a ? 'var(--accent-dim, rgba(59,130,246,0.1))' : 'transparent',
                      border: `1px solid ${execution.failedLegAction === a ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                      color: execution.failedLegAction === a ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div className="text-label mb-2">AI GUARD</div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <div
                data-testid="checkbox-ai-approval"
                onClick={() => setExecution(e => ({ ...e, requireAiApproval: !e.requireAiApproval }))}
                className="w-3.5 h-3.5 rounded-sm flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                style={{
                  border: `1px solid ${execution.requireAiApproval ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                  backgroundColor: execution.requireAiApproval ? 'var(--accent-primary)' : 'transparent',
                }}
              >
                {execution.requireAiApproval && <CheckCircle size={10} color="white" strokeWidth={3} />}
              </div>
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Require AI confidence check</span>
            </label>
            {execution.requireAiApproval && (
              <div className="flex items-center gap-3">
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Min Confidence</span>
                <input
                  data-testid="input-confidence"
                  type="range"
                  min={1}
                  max={5}
                  value={execution.minConfidence}
                  onChange={e => setExecution(ex => ({ ...ex, minConfidence: parseInt(e.target.value) }))}
                  className="flex-1"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span className="text-[13px] font-mono-nums w-4 text-center" style={{ color: 'var(--text-primary)' }}>
                  {execution.minConfidence}
                </span>
              </div>
            )}
          </div>

          <div className="mb-5">
            <div className="text-label mb-2">NOTIFICATIONS</div>
            <div className="flex flex-col gap-1.5">
              <NotifCheckbox label="On Trade" checked={notifications.onTrade} onChange={() => setNotifications(n => ({ ...n, onTrade: !n.onTrade }))} testId="checkbox-notify-trade" />
              <NotifCheckbox label="On Error" checked={notifications.onError} onChange={() => setNotifications(n => ({ ...n, onError: !n.onError }))} testId="checkbox-notify-error" />
              <NotifCheckbox label="On Pause" checked={notifications.onPause} onChange={() => setNotifications(n => ({ ...n, onPause: !n.onPause }))} testId="checkbox-notify-pause" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <button
              data-testid="button-cancel-config"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
            >
              Cancel
            </button>
            <button
              data-testid="button-launch-bot"
              onClick={handleLaunch}
              disabled={!isValid || launching}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              style={{
                backgroundColor: 'var(--accent-primary)',
                opacity: (!isValid || launching) ? 0.5 : 1,
              }}
            >
              {launching ? 'Launching...' : 'Launch Bot'}
            </button>
          </div>
        </div>
      </div>

      {showLiveConfirm && (
        <LiveTradeConfirmation
          risk={risk}
          onConfirm={handleLiveModeConfirmed}
          onCancel={() => setShowLiveConfirm(false)}
        />
      )}
    </div>
  );
}

function ModeButton({ active, label, desc, onClick, testId, isLive }: {
  active: boolean; label: string; desc: string; onClick: () => void; testId: string; isLive?: boolean;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="flex-1 p-3 rounded-lg text-left transition-all"
      style={{
        backgroundColor: active ? (isLive ? 'rgba(239,68,68,0.08)' : 'var(--accent-dim, rgba(59,130,246,0.08))') : 'var(--bg-primary)',
        border: `1px solid ${active ? (isLive ? 'var(--red)' : 'var(--accent-primary)') : 'var(--border-primary)'}`,
      }}
    >
      <div className="text-[13px] font-medium" style={{ color: active ? (isLive ? 'var(--red)' : 'var(--accent-primary)') : 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</div>
    </button>
  );
}

function RiskInput({ label, value, onChange, suffix, prefix, testId }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; prefix?: string; testId: string;
}) {
  return (
    <div>
      <label className="text-[11px] mb-1 block" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{prefix}</span>
        )}
        <input
          data-testid={testId}
          type="number"
          step="any"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full ${prefix ? 'pl-6' : 'px-2.5'} ${suffix ? 'pr-6' : 'pr-2.5'} py-1.5 text-[13px] font-mono-nums rounded-md outline-none transition-colors`}
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

function NotifCheckbox({ label, checked, onChange, testId }: {
  label: string; checked: boolean; onChange: () => void; testId: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        data-testid={testId}
        onClick={onChange}
        className="w-3.5 h-3.5 rounded-sm flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
        style={{
          border: `1px solid ${checked ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
          backgroundColor: checked ? 'var(--accent-primary)' : 'transparent',
        }}
      >
        {checked && <CheckCircle size={10} color="white" strokeWidth={3} />}
      </div>
      <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </label>
  );
}

function LiveTradeConfirmation({ risk, onConfirm, onCancel }: {
  risk: BotConfig['risk']; onConfirm: () => void; onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText.trim().toLowerCase() === 'confirm';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div
        className="rounded-xl p-5"
        style={{
          maxWidth: 420,
          width: '90%',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={24} style={{ color: 'var(--amber)' }} />
          <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>ENABLE LIVE TRADING?</span>
        </div>

        <div className="text-[12px] mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Live trading will execute real orders with real funds. Review your risk settings:
        </div>

        <div
          className="rounded-md p-3 mb-4 text-[12px]"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
        >
          <div className="flex justify-between mb-1">
            <span style={{ color: 'var(--text-tertiary)' }}>Max Position Size</span>
            <span className="font-mono-nums" style={{ color: 'var(--text-primary)' }}>{formatCurrency(risk.maxPositionSize)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span style={{ color: 'var(--text-tertiary)' }}>Max Daily Exposure</span>
            <span className="font-mono-nums" style={{ color: 'var(--text-primary)' }}>{formatCurrency(risk.maxDailyExposure)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-tertiary)' }}>Max Daily Loss</span>
            <span className="font-mono-nums" style={{ color: 'var(--red)' }}>{formatCurrency(risk.maxDailyLoss)}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[11px] mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
            Type CONFIRM to enable live trading
          </label>
          <input
            data-testid="input-live-confirm"
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="CONFIRM"
            className="w-full px-2.5 py-1.5 text-[13px] rounded-md outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            data-testid="button-cancel-live"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
          >
            Cancel
          </button>
          <button
            data-testid="button-confirm-live"
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
            style={{
              backgroundColor: 'var(--red)',
              opacity: isConfirmed ? 1 : 0.4,
            }}
          >
            Enable Live Trading
          </button>
        </div>
      </div>
    </div>
  );
}

function StopBotConfirmation({ bot, onClose, onConfirm }: {
  bot: BotConfig; onClose: () => void; onConfirm: () => void;
}) {
  const [action, setAction] = useState<'close' | 'keep' | 'stop'>('stop');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div
        className="rounded-xl p-5"
        style={{
          maxWidth: 420,
          width: '90%',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>STOP BOT</span>
          <button data-testid="button-close-stop" onClick={onClose} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="text-[13px] mb-1" style={{ color: 'var(--text-primary)' }}>{bot.name}</div>
        <div className="text-[12px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
          {bot.performance.currentOpenPositions} open positions
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {([
            { id: 'close' as const, label: 'Close all positions' },
            { id: 'keep' as const, label: 'Keep positions open' },
            { id: 'stop' as const, label: 'Just stop the bot' },
          ]).map(opt => (
            <label
              key={opt.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all"
              style={{
                backgroundColor: action === opt.id ? 'var(--accent-dim, rgba(59,130,246,0.08))' : 'var(--bg-primary)',
                border: `1px solid ${action === opt.id ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
              }}
            >
              <div
                data-testid={`radio-stop-${opt.id}`}
                onClick={() => setAction(opt.id)}
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ border: `2px solid ${action === opt.id ? 'var(--accent-primary)' : 'var(--border-primary)'}` }}
              >
                {action === opt.id && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                )}
              </div>
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }} onClick={() => setAction(opt.id)}>{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            data-testid="button-cancel-stop"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
          >
            Cancel
          </button>
          <button
            data-testid="button-confirm-stop"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
            style={{ backgroundColor: 'var(--red)' }}
          >
            Stop Bot
          </button>
        </div>
      </div>
    </div>
  );
}
