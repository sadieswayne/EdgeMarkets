import { useState, useEffect, useCallback, useRef } from 'react';

export type BotTemplate = 'prediction_arb' | 'spot_arb' | 'funding_rate' | 'cash_carry' | 'stablecoin_arb' | 'triangular_arb' | 'custom';
export type BotStatus = 'idle' | 'starting' | 'running' | 'paused' | 'stopping' | 'stopped' | 'error';
export type ActivityType = 'trade_completed' | 'trade_failed' | 'opportunity_skipped' | 'bot_started' | 'bot_stopped' | 'bot_paused' | 'bot_resumed' | 'alert' | 'error';

export interface BotPerformance {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  winRate: number;
  totalPnl: number;
  todayPnl: number;
  totalVolume: number;
  avgProfitPerTrade: number;
  bestTrade: number;
  worstTrade: number;
  currentOpenPositions: number;
  uptimeHours: number;
}

export interface BotConfig {
  id: string;
  template: BotTemplate;
  name: string;
  status: BotStatus;
  mode: 'live' | 'paper';
  platforms: string[];
  risk: {
    minSpread: number;
    maxPositionSize: number;
    maxDailyExposure: number;
    maxConcurrentTrades: number;
    maxDailyLoss: number;
    slippageTolerance: number;
  };
  execution: {
    speed: 'instant' | 'fast' | 'normal' | 'cautious';
    failedLegAction: 'unwind' | 'hold' | 'alert';
    requireAiApproval: boolean;
    minConfidence: number;
  };
  notifications: {
    onTrade: boolean;
    onError: boolean;
    onPause: boolean;
  };
  templateParams: Record<string, any>;
  performance: BotPerformance;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
}

export interface TradeLeg {
  platform: string;
  price: number;
  amount: number;
  fee: number;
  orderId: string;
  status: 'filled' | 'partial' | 'failed' | 'pending';
}

export interface BotTrade {
  id: string;
  botId: string;
  timestamp: number;
  type: string;
  asset: string;
  buyLeg: TradeLeg;
  sellLeg: TradeLeg;
  result: {
    grossProfit: number;
    totalFees: number;
    slippage: number;
    netProfit: number;
    status: 'success' | 'partial' | 'failed';
  };
  isPaperTrade: boolean;
  errorMessage?: string;
}

export interface ActivityLogEntry {
  id: string;
  botId: string;
  botName: string;
  type: ActivityType;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

export interface AggregatePerformance {
  activeBots: number;
  pausedBots: number;
  totalBots: number;
  todayPnl: number;
  allTimePnl: number;
  todayTrades: number;
  todayWins: number;
  winRate: number;
  totalVolume: number;
}

export interface BotTemplateCatalog {
  id: BotTemplate;
  name: string;
  description: string;
  category: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  expectedApy: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  platforms: string[];
  features: string[];
  defaultRisk: BotConfig['risk'];
  defaultExecution: BotConfig['execution'];
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export function useBots() {
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [templates, setTemplates] = useState<BotTemplateCatalog[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [aggregate, setAggregate] = useState<AggregatePerformance>({
    activeBots: 0, pausedBots: 0, totalBots: 0, todayPnl: 0,
    allTimePnl: 0, todayTrades: 0, todayWins: 0, winRate: 0, totalVolume: 0,
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    apiFetch<{ templates: BotTemplateCatalog[] }>('/api/bots/templates')
      .then(data => { if (mountedRef.current) setTemplates(data.templates); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchBots = () => {
      apiFetch<{ bots: BotConfig[] }>('/api/bots')
        .then(data => { if (mountedRef.current) { setBots(data.bots); setLoading(false); } })
        .catch(() => { if (mountedRef.current) setLoading(false); });
    };
    fetchBots();
    const id = setInterval(fetchBots, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchActivity = () => {
      apiFetch<{ activity: ActivityLogEntry[] }>('/api/bots/activity')
        .then(data => { if (mountedRef.current) setActivity(data.activity); })
        .catch(() => {});
    };
    fetchActivity();
    const id = setInterval(fetchActivity, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchAggregate = () => {
      apiFetch<{ aggregate: AggregatePerformance }>('/api/bots/aggregate')
        .then(data => { if (mountedRef.current) setAggregate(data.aggregate); })
        .catch(() => {});
    };
    fetchAggregate();
    const id = setInterval(fetchAggregate, 5000);
    return () => clearInterval(id);
  }, []);

  const createBot = useCallback(async (config: Partial<BotConfig>): Promise<BotConfig> => {
    const data = await apiFetch<{ bot: BotConfig }>('/api/bots', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    setBots(prev => [...prev, data.bot]);
    return data.bot;
  }, []);

  const startBot = useCallback(async (id: string) => {
    await apiFetch(`/api/bots/${id}/start`, { method: 'POST' });
    setBots(prev => prev.map(b => b.id === id ? { ...b, status: 'starting' as BotStatus } : b));
  }, []);

  const pauseBot = useCallback(async (id: string) => {
    await apiFetch(`/api/bots/${id}/pause`, { method: 'POST' });
    setBots(prev => prev.map(b => b.id === id ? { ...b, status: 'paused' as BotStatus } : b));
  }, []);

  const resumeBot = useCallback(async (id: string) => {
    await apiFetch(`/api/bots/${id}/resume`, { method: 'POST' });
    setBots(prev => prev.map(b => b.id === id ? { ...b, status: 'running' as BotStatus } : b));
  }, []);

  const stopBot = useCallback(async (id: string) => {
    await apiFetch(`/api/bots/${id}/stop`, { method: 'POST' });
    setBots(prev => prev.map(b => b.id === id ? { ...b, status: 'stopping' as BotStatus } : b));
  }, []);

  const deleteBot = useCallback(async (id: string) => {
    await apiFetch(`/api/bots/${id}`, { method: 'DELETE' });
    setBots(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBot = useCallback(async (id: string, updates: Partial<BotConfig>) => {
    const data = await apiFetch<{ bot: BotConfig }>(`/api/bots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setBots(prev => prev.map(b => b.id === id ? data.bot : b));
  }, []);

  return { bots, templates, activity, aggregate, loading, createBot, startBot, pauseBot, resumeBot, stopBot, deleteBot, updateBot };
}
