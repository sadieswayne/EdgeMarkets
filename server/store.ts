// In-memory state for the EDGE terminal: live arbitrage opportunity
// generation, bot manager, activity log and AI usage tracking.
// No database required — everything is process-local.

export type OpportunityType =
  | "prediction"
  | "crypto_spot"
  | "futures_basis"
  | "forex"
  | "options"
  | "ipo";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "AVOID";

export interface ServerOpportunity {
  id: string;
  type: OpportunityType;
  asset: string;
  assetShort: string;
  buyPlatform: string;
  sellPlatform: string;
  buyPrice: number;
  sellPrice: number;
  rawSpread: number;
  netProfit: number;
  netProfitDollar: number;
  confidence: number;
  liquidity: number;
  buyFee: number;
  sellFee: number;
  slippageEst: number;
  detectedAt: number;
  aiInsight: string;
  aiRisk: RiskLevel | null;
  aiReason: string | null;
  aiConfidence: number | null;
  aiAnalyzedAt: number | null;
  aiRiskBreakdown: unknown | null;
  algorithmicRisk: RiskLevel;
  hasAiInsight: boolean;
  isAiAnalyzing: boolean;
  aiModel: string | null;
  status: "active" | "expiring" | "expired";
  spreadHistory: number[];
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let idCounter = 0;
function genId() {
  return `opp-${Date.now()}-${++idCounter}`;
}

const AI_INSIGHTS = [
  "Spread persists due to delayed order book update. Typically closes within 3 minutes. Historical fill rate: 94%.",
  "Higher volume on the buy side platform. Sell price likely to converge upward. Low execution risk.",
  "Order book shows thin asks above current price. Recommend limit orders to avoid slippage.",
  "Funding rate divergence has persisted for 2 hours. Likely to normalize at next funding interval (4h).",
  "Triangular arbitrage path is stable. Execution must be simultaneous — use limit orders on all three legs.",
  "Stablecoin depeg micro-arb. Spread has been widening over past 30 minutes. Consider timing entry.",
  "High confidence opportunity. Both platforms show deep liquidity at quoted prices.",
  "Spread driven by latency differential between exchanges. Window typically 30-90 seconds.",
  "Platform fee differential creates persistent edge. Net positive after all costs.",
  "Cross-exchange settlement delay opens 5-minute arbitrage window. Low counterparty risk.",
];

type Seed = {
  asset: string;
  assetShort: string;
  buyPlatform: string;
  sellPlatform: string;
  buyPrice: number;
  sellPrice: number;
  rawSpread: number;
  confidence: number;
  liquidity: number;
};

const SEEDS: Record<OpportunityType, Seed[]> = {
  prediction: [
    { asset: "Will BTC hit $80k by March 2026?", assetShort: "BTC $80k March", buyPlatform: "Kalshi", sellPlatform: "Polymarket", buyPrice: 0.55, sellPrice: 0.62, rawSpread: 7.5, confidence: 4, liquidity: 842000 },
    { asset: "Trump wins 2028 nomination", assetShort: "Trump 2028 Nom", buyPlatform: "Kalshi", sellPlatform: "Polymarket", buyPrice: 0.65, sellPrice: 0.71, rawSpread: 6.2, confidence: 3, liquidity: 1240000 },
    { asset: "Fed rate cut by June 2026", assetShort: "Fed Cut Jun 26", buyPlatform: "Manifold", sellPlatform: "Polymarket", buyPrice: 0.38, sellPrice: 0.45, rawSpread: 8.1, confidence: 4, liquidity: 560000 },
    { asset: "Ethereum above $5000 by June", assetShort: "ETH >$5k Jun", buyPlatform: "Polymarket", sellPlatform: "Kalshi", buyPrice: 0.36, sellPrice: 0.41, rawSpread: 5.2, confidence: 3, liquidity: 640000 },
    { asset: "US inflation below 2% by Dec", assetShort: "CPI <2% Dec", buyPlatform: "Kalshi", sellPlatform: "Polymarket", buyPrice: 0.42, sellPrice: 0.47, rawSpread: 4.5, confidence: 4, liquidity: 720000 },
  ],
  crypto_spot: [
    { asset: "BTC/USDT", assetShort: "BTC/USDT", buyPlatform: "Binance", sellPlatform: "Bybit", buyPrice: 67342.5, sellPrice: 67425.8, rawSpread: 0.12, confidence: 5, liquidity: 4200000 },
    { asset: "ETH/USDT", assetShort: "ETH/USDT", buyPlatform: "Coinbase", sellPlatform: "Binance", buyPrice: 3842.2, sellPrice: 3851.1, rawSpread: 0.23, confidence: 5, liquidity: 3100000 },
    { asset: "SOL/USDT", assetShort: "SOL/USDT", buyPlatform: "Bybit", sellPlatform: "KuCoin", buyPrice: 148.3, sellPrice: 149.05, rawSpread: 0.5, confidence: 4, liquidity: 1800000 },
    { asset: "AVAX/USDT", assetShort: "AVAX/USDT", buyPlatform: "Binance", sellPlatform: "Coinbase", buyPrice: 38.42, sellPrice: 38.67, rawSpread: 0.65, confidence: 4, liquidity: 890000 },
    { asset: "LINK/USDT", assetShort: "LINK/USDT", buyPlatform: "Kraken", sellPlatform: "Binance", buyPrice: 18.92, sellPrice: 19.04, rawSpread: 0.63, confidence: 4, liquidity: 720000 },
    { asset: "DOGE/USDT", assetShort: "DOGE/USDT", buyPlatform: "Binance", sellPlatform: "KuCoin", buyPrice: 0.1842, sellPrice: 0.1858, rawSpread: 0.87, confidence: 3, liquidity: 560000 },
  ],
  futures_basis: [
    { asset: "BTC Futures Premium", assetShort: "BTC Basis", buyPlatform: "Binance Spot", sellPlatform: "Binance Futures", buyPrice: 67342, sellPrice: 67580, rawSpread: 0.35, confidence: 5, liquidity: 5200000 },
    { asset: "SOL Cash & Carry", assetShort: "SOL C&C", buyPlatform: "Bybit Spot", sellPlatform: "Bybit Futures", buyPrice: 148.3, sellPrice: 151.2, rawSpread: 1.95, confidence: 4, liquidity: 1400000 },
    { asset: "ETH Basis Trade Q2", assetShort: "ETH Basis Q2", buyPlatform: "Coinbase Spot", sellPlatform: "Deribit Futures", buyPrice: 3842, sellPrice: 3895, rawSpread: 1.38, confidence: 4, liquidity: 1600000 },
  ],
  forex: [
    { asset: "EUR/USD Triangular Arb", assetShort: "EUR/USD Tri", buyPlatform: "Kraken", sellPlatform: "Coinbase", buyPrice: 1.0842, sellPrice: 1.0846, rawSpread: 0.04, confidence: 4, liquidity: 2400000 },
    { asset: "USDT/USDC Stablecoin Arb", assetShort: "USDT/USDC", buyPlatform: "Coinbase", sellPlatform: "Binance", buyPrice: 0.9998, sellPrice: 1.0003, rawSpread: 0.05, confidence: 5, liquidity: 8200000 },
    { asset: "DAI/USDC Depeg Arb", assetShort: "DAI/USDC", buyPlatform: "Binance", sellPlatform: "Coinbase", buyPrice: 0.9994, sellPrice: 1.0001, rawSpread: 0.07, confidence: 4, liquidity: 3400000 },
  ],
  options: [
    { asset: "BTC Put-Call Parity Mar 70k", assetShort: "BTC PCP 70k", buyPlatform: "Deribit", sellPlatform: "OKX", buyPrice: 2840, sellPrice: 2863, rawSpread: 0.8, confidence: 3, liquidity: 620000 },
    { asset: "ETH Vol Spread Deribit/OKX", assetShort: "ETH Vol Arb", buyPlatform: "OKX", sellPlatform: "Deribit", buyPrice: 58, sellPrice: 62, rawSpread: 4.0, confidence: 2, liquidity: 340000 },
    { asset: "BTC Butterfly Spread", assetShort: "BTC Butterfly", buyPlatform: "Deribit", sellPlatform: "OKX", buyPrice: 420, sellPrice: 435, rawSpread: 3.5, confidence: 3, liquidity: 280000 },
  ],
  // IPO Markets are sourced live from Hyperliquid (or a wrapper API);
  // never synthesised — empty seed keeps the SEEDS record well-typed.
  ipo: [],
};

function spreadHistory(base: number): number[] {
  const points: number[] = [];
  let v = base;
  for (let i = 0; i < 20; i++) {
    v += rand(-0.3, 0.3);
    if (v < 0.01) v = 0.01;
    points.push(parseFloat(v.toFixed(3)));
  }
  return points;
}

function build(seed: Seed, type: OpportunityType): ServerOpportunity {
  const rawSpread = seed.rawSpread;
  const buyFee = parseFloat(rand(0.05, 0.15).toFixed(3));
  const sellFee = parseFloat(rand(0.05, 0.15).toFixed(3));
  const slippageEst = parseFloat(rand(0.01, 0.05).toFixed(3));
  const netProfit = parseFloat(
    Math.max(rawSpread - buyFee - sellFee - slippageEst, 0.01).toFixed(3),
  );
  const risks: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];
  return {
    id: genId(),
    type,
    asset: seed.asset,
    assetShort: seed.assetShort,
    buyPlatform: seed.buyPlatform,
    sellPlatform: seed.sellPlatform,
    buyPrice: seed.buyPrice,
    sellPrice: seed.sellPrice,
    rawSpread,
    netProfit,
    netProfitDollar: parseFloat((netProfit * 10).toFixed(2)),
    confidence: seed.confidence,
    liquidity: seed.liquidity,
    buyFee,
    sellFee,
    slippageEst,
    detectedAt: Date.now() - randInt(0, 3600000),
    aiInsight: pick(AI_INSIGHTS),
    aiRisk: Math.random() > 0.5 ? pick(risks) : null,
    aiReason:
      Math.random() > 0.5
        ? pick(["latency", "liquidity", "fee_structure", "mispricing"])
        : null,
    aiConfidence: Math.random() > 0.5 ? randInt(1, 5) : null,
    aiAnalyzedAt: Math.random() > 0.5 ? Date.now() - randInt(0, 60000) : null,
    aiRiskBreakdown: null,
    algorithmicRisk: pick(risks),
    hasAiInsight: Math.random() > 0.4,
    isAiAnalyzing: Math.random() > 0.92,
    aiModel: Math.random() > 0.5 ? "claude-sonnet-4-5" : null,
    status: "active",
    spreadHistory: spreadHistory(rawSpread),
  };
}

const PLATFORM_CONNECTIONS = [
  { platform: "Binance", pairsCount: 12 },
  { platform: "Coinbase", pairsCount: 10 },
  { platform: "Bybit", pairsCount: 8 },
  { platform: "Kraken", pairsCount: 6 },
  { platform: "Polymarket", pairsCount: 24 },
  { platform: "Kalshi", pairsCount: 18 },
  { platform: "OANDA", pairsCount: 12 },
  { platform: "Deribit", pairsCount: 16 },
  { platform: "OKX", pairsCount: 14 },
];

class OpportunityEngine {
  private opps = new Map<string, ServerOpportunity>();

  constructor() {
    (Object.keys(SEEDS) as OpportunityType[]).forEach((type) => {
      SEEDS[type].forEach((seed) => {
        const o = build(seed, type);
        this.opps.set(o.id, o);
      });
    });
  }

  list(): ServerOpportunity[] {
    return Array.from(this.opps.values());
  }

  connections() {
    return PLATFORM_CONNECTIONS.map((c) => ({
      ...c,
      status: "connected" as const,
      lastUpdate: Date.now(),
    }));
  }

  stats() {
    const active = this.list().filter((o) => o.status === "active");
    return {
      totalOpportunities: active.length,
      avgSpread:
        active.length > 0
          ? parseFloat(
              (
                active.reduce((s, o) => s + o.rawSpread, 0) / active.length
              ).toFixed(1),
            )
          : 0,
      bestOpportunity:
        active.length > 0 ? Math.max(...active.map((o) => o.rawSpread)) : 0,
      totalVolume: active.reduce((s, o) => s + o.liquidity, 0),
    };
  }

  tick() {
    const all = this.list();

    // Move prices on a random subset.
    const count = Math.min(6, all.length);
    for (let i = 0; i < count; i++) {
      const opp = pick(all);
      if (opp.status !== "active") continue;
      const dp = (v: number) => (v < 1 ? 4 : 2);
      const newBuy = parseFloat(
        (opp.buyPrice * (1 + rand(-0.005, 0.005))).toFixed(dp(opp.buyPrice)),
      );
      const newSell = parseFloat(
        (opp.sellPrice * (1 + rand(-0.005, 0.005))).toFixed(dp(opp.sellPrice)),
      );
      const newSpread =
        newBuy > 0
          ? parseFloat((((newSell - newBuy) / newBuy) * 100).toFixed(3))
          : opp.rawSpread;
      const netProfit = parseFloat(
        Math.max(
          newSpread - opp.buyFee - opp.sellFee - opp.slippageEst,
          0.01,
        ).toFixed(3),
      );
      opp.buyPrice = newBuy;
      opp.sellPrice = newSell;
      opp.rawSpread = Math.abs(newSpread);
      opp.netProfit = netProfit;
      opp.netProfitDollar = parseFloat((netProfit * 10).toFixed(2));
      opp.spreadHistory = [...opp.spreadHistory.slice(1), opp.rawSpread];
    }

    // Occasionally add a fresh opportunity.
    if (Math.random() < 0.35 && this.opps.size < 55) {
      const type = pick(Object.keys(SEEDS) as OpportunityType[]);
      const o = build(pick(SEEDS[type]), type);
      o.detectedAt = Date.now();
      this.opps.set(o.id, o);
    }

    // Occasionally retire the oldest one.
    if (Math.random() < 0.25 && this.opps.size > 22) {
      const oldest = all
        .filter((o) => o.status === "active")
        .sort((a, b) => a.detectedAt - b.detectedAt)[0];
      if (oldest) this.opps.delete(oldest.id);
    }
  }
}

export const engine = new OpportunityEngine();

// Fresh synthetic opportunities for a given set of categories. Used as a
// fallback for markets we don't have a free live feed for (forex / options /
// futures-basis), and for everything when all live feeds are unreachable.
export function syntheticOpportunities(
  types: OpportunityType[],
): ServerOpportunity[] {
  const out: ServerOpportunity[] = [];
  for (const type of types) {
    for (const seed of SEEDS[type]) {
      const o = build(seed, type);
      // jitter the price a touch so repeated calls aren't identical
      const j = 1 + rand(-0.004, 0.004);
      o.buyPrice = parseFloat((o.buyPrice * j).toFixed(o.buyPrice < 1 ? 4 : 2));
      out.push(o);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Bots                                                                */
/* ------------------------------------------------------------------ */

export interface BotConfig {
  id: string;
  template: string;
  name: string;
  status:
    | "idle"
    | "starting"
    | "running"
    | "paused"
    | "stopping"
    | "stopped"
    | "error";
  mode: "live" | "paper";
  platforms: string[];
  risk: Record<string, number>;
  execution: Record<string, unknown>;
  notifications: Record<string, boolean>;
  templateParams: Record<string, unknown>;
  performance: {
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
  };
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
}

export interface ActivityLogEntry {
  id: string;
  botId: string;
  botName: string;
  type: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

const DEFAULT_RISK = {
  minSpread: 0.05,
  maxPositionSize: 500,
  maxDailyExposure: 5000,
  maxConcurrentTrades: 3,
  maxDailyLoss: 50,
  slippageTolerance: 0.1,
};
const DEFAULT_EXECUTION = {
  speed: "normal",
  failedLegAction: "alert",
  requireAiApproval: false,
  minConfidence: 3,
};

export const BOT_TEMPLATES = [
  {
    id: "spot_arb",
    name: "Spot Arbitrage",
    description:
      "Buys and sells the same crypto pair across exchanges to capture price gaps.",
    category: "crypto",
    icon: "Bitcoin",
    difficulty: "Beginner",
    expectedApy: "8-15%",
    riskLevel: "Low",
    platforms: ["Binance", "Coinbase", "Bybit", "Kraken"],
    features: ["Cross-exchange", "Auto-hedged", "Paper + live"],
    defaultRisk: DEFAULT_RISK,
    defaultExecution: { ...DEFAULT_EXECUTION, speed: "fast" },
  },
  {
    id: "prediction_arb",
    name: "Prediction Market Arb",
    description:
      "Exploits odds discrepancies for the same event across prediction markets.",
    category: "prediction",
    icon: "TrendingUp",
    difficulty: "Intermediate",
    expectedApy: "12-25%",
    riskLevel: "Medium",
    platforms: ["Polymarket", "Kalshi", "Manifold"],
    features: ["Event matching", "Settlement aware", "Kelly sizing"],
    defaultRisk: DEFAULT_RISK,
    defaultExecution: { ...DEFAULT_EXECUTION, requireAiApproval: true },
  },
  {
    id: "funding_rate",
    name: "Funding Rate Harvest",
    description:
      "Collects perpetual funding payments while staying delta-neutral.",
    category: "futures",
    icon: "Percent",
    difficulty: "Intermediate",
    expectedApy: "10-20%",
    riskLevel: "Medium",
    platforms: ["Binance", "Bybit", "OKX"],
    features: ["Delta-neutral", "Funding capture", "Auto-rebalance"],
    defaultRisk: DEFAULT_RISK,
    defaultExecution: DEFAULT_EXECUTION,
  },
  {
    id: "cash_carry",
    name: "Cash & Carry Basis",
    description:
      "Longs spot and shorts futures to lock in the basis premium to expiry.",
    category: "futures",
    icon: "Landmark",
    difficulty: "Advanced",
    expectedApy: "6-12%",
    riskLevel: "Low",
    platforms: ["Binance", "Deribit", "Bybit"],
    features: ["Basis lock", "Roll management", "Low risk"],
    defaultRisk: DEFAULT_RISK,
    defaultExecution: { ...DEFAULT_EXECUTION, speed: "cautious" },
  },
  {
    id: "stablecoin_arb",
    name: "Stablecoin Depeg Arb",
    description:
      "Trades transient stablecoin depegs back toward their $1.00 anchor.",
    category: "forex",
    icon: "DollarSign",
    difficulty: "Beginner",
    expectedApy: "5-10%",
    riskLevel: "Low",
    platforms: ["Binance", "Coinbase", "Kraken"],
    features: ["Peg reversion", "High win rate", "Tight stops"],
    defaultRisk: DEFAULT_RISK,
    defaultExecution: { ...DEFAULT_EXECUTION, speed: "fast" },
  },
  {
    id: "triangular_arb",
    name: "Triangular Arbitrage",
    description:
      "Cycles three pairs on a single venue to capture pricing inefficiencies.",
    category: "crypto",
    icon: "Triangle",
    difficulty: "Advanced",
    expectedApy: "15-30%",
    riskLevel: "High",
    platforms: ["Binance", "Bybit", "OKX"],
    features: ["3-leg cycle", "Atomic execution", "Latency optimized"],
    defaultRisk: DEFAULT_RISK,
    defaultExecution: { ...DEFAULT_EXECUTION, speed: "instant" },
  },
];

function emptyPerf(): BotConfig["performance"] {
  return {
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    winRate: 0,
    totalPnl: 0,
    todayPnl: 0,
    totalVolume: 0,
    avgProfitPerTrade: 0,
    bestTrade: 0,
    worstTrade: 0,
    currentOpenPositions: 0,
    uptimeHours: 0,
  };
}

class BotManager {
  private bots = new Map<string, BotConfig>();
  private activity: ActivityLogEntry[] = [];

  constructor() {
    this.create({
      template: "spot_arb",
      name: "Spot Arbitrage Bot",
      mode: "paper",
      platforms: ["Binance", "Coinbase"],
    });
  }

  private uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private log(
    bot: BotConfig,
    type: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    this.activity.unshift({
      id: this.uuid(),
      botId: bot.id,
      botName: bot.name,
      type,
      message,
      details,
      timestamp: Date.now(),
    });
    if (this.activity.length > 200) this.activity.length = 200;
  }

  list() {
    return Array.from(this.bots.values());
  }
  get(id: string) {
    return this.bots.get(id);
  }
  activityLog() {
    return this.activity.slice(0, 100);
  }

  create(input: Partial<BotConfig>): BotConfig {
    const now = Date.now();
    const bot: BotConfig = {
      id: this.uuid(),
      template: input.template ?? "custom",
      name: input.name ?? "New Bot",
      status: "idle",
      mode: input.mode ?? "paper",
      platforms: input.platforms ?? ["Binance", "Coinbase"],
      risk: { ...DEFAULT_RISK, ...(input.risk ?? {}) },
      execution: { ...DEFAULT_EXECUTION, ...(input.execution ?? {}) },
      notifications: {
        onTrade: true,
        onError: true,
        onPause: false,
        ...(input.notifications ?? {}),
      },
      templateParams: input.templateParams ?? {},
      performance: emptyPerf(),
      createdAt: now,
      updatedAt: now,
    };
    this.bots.set(bot.id, bot);
    this.log(bot, "alert", `Bot "${bot.name}" created`);
    return bot;
  }

  update(id: string, updates: Partial<BotConfig>): BotConfig | undefined {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    Object.assign(bot, updates, { id: bot.id, updatedAt: Date.now() });
    return bot;
  }

  setStatus(id: string, status: BotConfig["status"]): BotConfig | undefined {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    bot.status = status;
    bot.updatedAt = Date.now();
    if (status === "running") {
      bot.startedAt = bot.startedAt ?? Date.now();
      this.log(bot, "bot_started", `${bot.name} started in ${bot.mode} mode`);
    } else if (status === "paused") {
      this.log(bot, "bot_paused", `${bot.name} paused`);
    } else if (status === "stopped") {
      this.log(bot, "bot_stopped", `${bot.name} stopped`);
      bot.startedAt = undefined;
    }
    return bot;
  }

  remove(id: string): boolean {
    const bot = this.bots.get(id);
    if (bot) this.log(bot, "alert", `Bot "${bot.name}" deleted`);
    return this.bots.delete(id);
  }

  // Called on an interval — simulates running bots making paper trades.
  tick() {
    for (const bot of this.bots.values()) {
      if (bot.status === "starting") {
        this.setStatus(bot.id, "running");
        continue;
      }
      if (bot.status === "stopping") {
        this.setStatus(bot.id, "stopped");
        continue;
      }
      if (bot.status !== "running") continue;

      if (bot.startedAt) {
        bot.performance.uptimeHours = parseFloat(
          ((Date.now() - bot.startedAt) / 3_600_000).toFixed(2),
        );
      }

      if (Math.random() < 0.4) {
        const win = Math.random() < 0.78;
        const pnl = win
          ? parseFloat(rand(2, 45).toFixed(2))
          : -parseFloat(rand(1, 20).toFixed(2));
        const p = bot.performance;
        p.totalTrades += 1;
        if (win) p.successfulTrades += 1;
        else p.failedTrades += 1;
        p.winRate = parseFloat(
          ((p.successfulTrades / p.totalTrades) * 100).toFixed(1),
        );
        p.totalPnl = parseFloat((p.totalPnl + pnl).toFixed(2));
        p.todayPnl = parseFloat((p.todayPnl + pnl).toFixed(2));
        p.totalVolume = parseFloat(
          (p.totalVolume + rand(200, 2000)).toFixed(2),
        );
        p.avgProfitPerTrade = parseFloat(
          (p.totalPnl / p.totalTrades).toFixed(2),
        );
        p.bestTrade = Math.max(p.bestTrade, pnl);
        p.worstTrade = Math.min(p.worstTrade, pnl);
        this.log(
          bot,
          win ? "trade_completed" : "trade_failed",
          win
            ? `Captured ${pnl.toFixed(2)} USD spread`
            : `Trade failed, ${pnl.toFixed(2)} USD`,
          { pnl },
        );
      }
    }
  }

  aggregate() {
    const bots = this.list();
    const active = bots.filter((b) => b.status === "running").length;
    const paused = bots.filter((b) => b.status === "paused").length;
    const todayPnl = bots.reduce((s, b) => s + b.performance.todayPnl, 0);
    const allTimePnl = bots.reduce((s, b) => s + b.performance.totalPnl, 0);
    const todayTrades = bots.reduce(
      (s, b) => s + b.performance.totalTrades,
      0,
    );
    const todayWins = bots.reduce(
      (s, b) => s + b.performance.successfulTrades,
      0,
    );
    const totalVolume = bots.reduce(
      (s, b) => s + b.performance.totalVolume,
      0,
    );
    return {
      activeBots: active,
      pausedBots: paused,
      totalBots: bots.length,
      todayPnl: parseFloat(todayPnl.toFixed(2)),
      allTimePnl: parseFloat(allTimePnl.toFixed(2)),
      todayTrades,
      todayWins,
      winRate:
        todayTrades > 0
          ? parseFloat(((todayWins / todayTrades) * 100).toFixed(1))
          : 0,
      totalVolume: parseFloat(totalVolume.toFixed(2)),
    };
  }
}

export const bots = new BotManager();

/* ------------------------------------------------------------------ */
/* AI usage + news                                                     */
/* ------------------------------------------------------------------ */

export const aiUsage = {
  callsToday: 0,
  costToday: 0,
  inputTokens: 0,
  outputTokens: 0,
};

export function aiStatus() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const dailyLimit = parseFloat(process.env.AI_DAILY_MAX_COST || "20");
  return {
    available: hasKey,
    connected: hasKey,
    callsToday: aiUsage.callsToday,
    costToday: parseFloat(aiUsage.costToday.toFixed(4)),
    dailyLimit,
    inputTokens: aiUsage.inputTokens,
    outputTokens: aiUsage.outputTokens,
    isWarning: aiUsage.costToday > dailyLimit * 0.75,
    isLimited: aiUsage.costToday >= dailyLimit,
  };
}

const NEWS_TEMPLATES = [
  {
    title: "Bitcoin Surges Past $98K as Institutional Demand Accelerates",
    source: "CoinDesk",
    url: "https://www.coindesk.com",
    relevance: "high" as const,
    impact:
      "BTC spot spreads widening across exchanges — arbitrage windows expanding",
    affectedAssets: ["BTC/USDT"],
    affectedMarkets: ["Binance", "Coinbase", "Bybit"],
  },
  {
    title: "Fed Signals Potential Rate Cut in Latest Meeting Minutes",
    source: "Reuters",
    url: "https://www.reuters.com",
    relevance: "critical" as const,
    impact:
      "Prediction market odds shifting rapidly — cross-platform pricing gaps detected",
    affectedAssets: ["Fed rate cut"],
    affectedMarkets: ["Kalshi", "Polymarket"],
  },
  {
    title: "Ethereum Options Volume Hits All-Time High on Deribit",
    source: "The Block",
    url: "https://www.theblock.co",
    relevance: "high" as const,
    impact:
      "IV differentials between Deribit and OKX expanding — options arb increasing",
    affectedAssets: ["ETH/USDT"],
    affectedMarkets: ["Deribit", "OKX"],
  },
  {
    title: "Stablecoin Liquidity Tightens After Large Redemption",
    source: "Bloomberg",
    url: "https://www.bloomberg.com",
    relevance: "high" as const,
    impact: "USDT/USDC micro-spreads widening on major venues",
    affectedAssets: ["USDT/USDC"],
    affectedMarkets: ["Binance", "Coinbase"],
  },
];

export function newsAlerts(limit: number) {
  const now = Date.now();
  return NEWS_TEMPLATES.slice(0, limit).map((n, i) => ({
    id: `news-${i}`,
    ...n,
    publishedAt: now - (i + 1) * 600_000,
    analyzedAt: now - (i + 1) * 540_000,
  }));
}
