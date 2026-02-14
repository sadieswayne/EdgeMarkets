import { type ArbitrageOpportunity, type OpportunityType } from './types';

let idCounter = 0;
function genId(): string {
  return `opp-${Date.now()}-${++idCounter}`;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSpreadHistory(baseSpread: number): number[] {
  const points: number[] = [];
  let val = baseSpread;
  for (let i = 0; i < 20; i++) {
    val += rand(-0.3, 0.3);
    if (val < 0.01) val = 0.01;
    points.push(parseFloat(val.toFixed(3)));
  }
  return points;
}

const AI_INSIGHTS = [
  "Spread persists due to delayed order book update. Typically closes within 3 minutes. Historical fill rate: 94%.",
  "Higher volume on the buy side platform. Sell price likely to converge upward. Low execution risk.",
  "Order book shows thin asks above current price. Recommend limit orders to avoid slippage.",
  "Funding rate divergence has persisted for 2 hours. Likely to normalize at next funding interval (4h).",
  "Triangular arbitrage path is stable. Execution must be simultaneous — use limit orders on all three legs.",
  "Put-call parity violation likely due to low liquidity on the put side. Exercise caution with large positions.",
  "Stablecoin depeg micro-arb. Spread has been widening over past 30 minutes. Consider timing entry.",
  "Basis trade has attractive annualized return. Carry cost to expiry is minimal.",
  "High confidence opportunity. Both platforms show deep liquidity at quoted prices.",
  "Spread driven by latency differential between exchanges. Window typically 30-90 seconds.",
  "Platform fee differential creates persistent edge. Net positive after all costs.",
  "Volume surge on prediction market creating temporary dislocation. Act within 2 minutes.",
  "Cross-exchange settlement delay opens 5-minute arbitrage window. Low counterparty risk.",
  "Implied volatility surface inconsistency. Market maker likely to close gap shortly.",
  "Price impact analysis: Position up to $5K executable without significant slippage.",
  "Historical pattern shows this spread widens before European market open. Hold for better entry.",
  "Liquidity depth sufficient for $10K+ position. Execution confidence high.",
  "Cross-margin efficiency creates 0.02% fee advantage on the sell leg. Factor into net calculation.",
];

const PREDICTION_OPPS: Partial<ArbitrageOpportunity>[] = [
  { asset: 'Will BTC hit $80k by March 2026?', assetShort: 'BTC $80k March', buyPlatform: 'Kalshi', sellPlatform: 'Polymarket', buyPrice: 0.55, sellPrice: 0.62, rawSpread: 7.5, confidence: 4, liquidity: 842000 },
  { asset: 'Trump wins 2028 nomination', assetShort: 'Trump 2028 Nom', buyPlatform: 'Kalshi', sellPlatform: 'Polymarket', buyPrice: 0.65, sellPrice: 0.71, rawSpread: 6.2, confidence: 3, liquidity: 1240000 },
  { asset: 'Fed rate cut by June 2026', assetShort: 'Fed Cut Jun 26', buyPlatform: 'Manifold', sellPlatform: 'Polymarket', buyPrice: 0.38, sellPrice: 0.45, rawSpread: 8.1, confidence: 4, liquidity: 560000 },
  { asset: 'Tesla stock above $400 by April', assetShort: 'TSLA >$400 Apr', buyPlatform: 'Polymarket', sellPlatform: 'Kalshi', buyPrice: 0.28, sellPrice: 0.33, rawSpread: 5.8, confidence: 3, liquidity: 380000 },
  { asset: 'Ukraine ceasefire by 2026', assetShort: 'UA Ceasefire 26', buyPlatform: 'Kalshi', sellPlatform: 'Polymarket', buyPrice: 0.18, sellPrice: 0.22, rawSpread: 4.9, confidence: 2, liquidity: 290000 },
  { asset: 'Next iPhone has foldable screen', assetShort: 'iPhone Fold', buyPlatform: 'Polymarket', sellPlatform: 'Manifold', buyPrice: 0.08, sellPrice: 0.12, rawSpread: 4.1, confidence: 2, liquidity: 120000 },
  { asset: 'Bitcoin ETF daily volume > $5B', assetShort: 'BTC ETF Vol', buyPlatform: 'Kalshi', sellPlatform: 'Polymarket', buyPrice: 0.72, sellPrice: 0.78, rawSpread: 3.4, confidence: 5, liquidity: 1800000 },
  { asset: 'Ethereum above $5000 by June', assetShort: 'ETH >$5k Jun', buyPlatform: 'Polymarket', sellPlatform: 'Kalshi', buyPrice: 0.36, sellPrice: 0.41, rawSpread: 5.2, confidence: 3, liquidity: 640000 },
  { asset: 'SpaceX IPO in 2026', assetShort: 'SpaceX IPO 26', buyPlatform: 'Manifold', sellPlatform: 'Polymarket', buyPrice: 0.15, sellPrice: 0.19, rawSpread: 3.8, confidence: 2, liquidity: 180000 },
  { asset: 'US inflation below 2% by Dec', assetShort: 'CPI <2% Dec', buyPlatform: 'Kalshi', sellPlatform: 'Polymarket', buyPrice: 0.42, sellPrice: 0.47, rawSpread: 4.5, confidence: 4, liquidity: 720000 },
];

const CRYPTO_SPOT_OPPS: Partial<ArbitrageOpportunity>[] = [
  { asset: 'BTC/USDT', assetShort: 'BTC/USDT', buyPlatform: 'Binance', sellPlatform: 'Bybit', buyPrice: 67342.50, sellPrice: 67425.80, rawSpread: 0.12, confidence: 5, liquidity: 4200000 },
  { asset: 'ETH/USDT', assetShort: 'ETH/USDT', buyPlatform: 'Coinbase', sellPlatform: 'Binance', buyPrice: 3842.20, sellPrice: 3851.10, rawSpread: 0.23, confidence: 5, liquidity: 3100000 },
  { asset: 'SOL/USDT', assetShort: 'SOL/USDT', buyPlatform: 'Bybit', sellPlatform: 'KuCoin', buyPrice: 148.30, sellPrice: 149.05, rawSpread: 0.50, confidence: 4, liquidity: 1800000 },
  { asset: 'AVAX/USDT', assetShort: 'AVAX/USDT', buyPlatform: 'Binance', sellPlatform: 'Coinbase', buyPrice: 38.42, sellPrice: 38.67, rawSpread: 0.65, confidence: 4, liquidity: 890000 },
  { asset: 'LINK/USDT', assetShort: 'LINK/USDT', buyPlatform: 'Kraken', sellPlatform: 'Binance', buyPrice: 18.92, sellPrice: 19.04, rawSpread: 0.63, confidence: 4, liquidity: 720000 },
  { asset: 'ARB/USDT', assetShort: 'ARB/USDT', buyPlatform: 'Coinbase', sellPlatform: 'Bybit', buyPrice: 1.23, sellPrice: 1.25, rawSpread: 1.6, confidence: 3, liquidity: 340000 },
  { asset: 'DOGE/USDT', assetShort: 'DOGE/USDT', buyPlatform: 'Binance', sellPlatform: 'KuCoin', buyPrice: 0.1842, sellPrice: 0.1858, rawSpread: 0.87, confidence: 3, liquidity: 560000 },
  { asset: 'WIF/USDT', assetShort: 'WIF/USDT', buyPlatform: 'Bybit', sellPlatform: 'Binance', buyPrice: 2.34, sellPrice: 2.38, rawSpread: 1.7, confidence: 3, liquidity: 280000 },
  { asset: 'MATIC/USDT', assetShort: 'MATIC/USDT', buyPlatform: 'Kraken', sellPlatform: 'Coinbase', buyPrice: 0.892, sellPrice: 0.901, rawSpread: 1.01, confidence: 3, liquidity: 420000 },
  { asset: 'OP/USDT', assetShort: 'OP/USDT', buyPlatform: 'Binance', sellPlatform: 'Bybit', buyPrice: 2.14, sellPrice: 2.17, rawSpread: 1.4, confidence: 3, liquidity: 310000 },
];

const FUTURES_OPPS: Partial<ArbitrageOpportunity>[] = [
  { asset: 'BTC Futures Premium', assetShort: 'BTC Basis', buyPlatform: 'Binance Spot', sellPlatform: 'Binance Futures', buyPrice: 67342, sellPrice: 67580, rawSpread: 0.35, confidence: 5, liquidity: 5200000 },
  { asset: 'ETH Funding Rate Arb', assetShort: 'ETH Funding', buyPlatform: 'Bybit', sellPlatform: 'Binance', buyPrice: -0.015, sellPrice: 0.008, rawSpread: 0.023, confidence: 4, liquidity: 2800000 },
  { asset: 'SOL Cash & Carry', assetShort: 'SOL C&C', buyPlatform: 'Bybit Spot', sellPlatform: 'Bybit Futures', buyPrice: 148.30, sellPrice: 151.20, rawSpread: 1.95, confidence: 4, liquidity: 1400000 },
  { asset: 'BTC Calendar Spread', assetShort: 'BTC Calendar', buyPlatform: 'March Futures', sellPlatform: 'June Futures', buyPrice: 67580, sellPrice: 68200, rawSpread: 0.92, confidence: 3, liquidity: 980000 },
  { asset: 'ETH Basis Trade Q2', assetShort: 'ETH Basis Q2', buyPlatform: 'Coinbase Spot', sellPlatform: 'Deribit Futures', buyPrice: 3842, sellPrice: 3895, rawSpread: 1.38, confidence: 4, liquidity: 1600000 },
];

const FOREX_OPPS: Partial<ArbitrageOpportunity>[] = [
  { asset: 'EUR/USD Triangular Arb', assetShort: 'EUR/USD Tri', buyPlatform: 'Kraken', sellPlatform: 'Coinbase', buyPrice: 1.0842, sellPrice: 1.0846, rawSpread: 0.04, confidence: 4, liquidity: 2400000 },
  { asset: 'USDT/USDC Stablecoin Arb', assetShort: 'USDT/USDC', buyPlatform: 'Coinbase', sellPlatform: 'Binance', buyPrice: 0.9998, sellPrice: 1.0003, rawSpread: 0.05, confidence: 5, liquidity: 8200000 },
  { asset: 'JPY/USD Cross-Exchange', assetShort: 'JPY/USD', buyPlatform: 'Kraken', sellPlatform: 'Binance', buyPrice: 0.006712, sellPrice: 0.006718, rawSpread: 0.08, confidence: 3, liquidity: 1200000 },
  { asset: 'GBP/USD Cross-Exchange', assetShort: 'GBP/USD', buyPlatform: 'Coinbase', sellPlatform: 'Kraken', buyPrice: 1.2642, sellPrice: 1.2650, rawSpread: 0.06, confidence: 3, liquidity: 1800000 },
  { asset: 'DAI/USDC Depeg Arb', assetShort: 'DAI/USDC', buyPlatform: 'Binance', sellPlatform: 'Coinbase', buyPrice: 0.9994, sellPrice: 1.0001, rawSpread: 0.07, confidence: 4, liquidity: 3400000 },
];

const OPTIONS_OPPS: Partial<ArbitrageOpportunity>[] = [
  { asset: 'BTC Put-Call Parity Mar 70k', assetShort: 'BTC PCP 70k', buyPlatform: 'Deribit', sellPlatform: 'OKX', buyPrice: 2840, sellPrice: 2863, rawSpread: 0.8, confidence: 3, liquidity: 620000 },
  { asset: 'ETH Vol Spread Deribit/OKX', assetShort: 'ETH Vol Arb', buyPlatform: 'OKX', sellPlatform: 'Deribit', buyPrice: 58, sellPrice: 62, rawSpread: 4.0, confidence: 2, liquidity: 340000 },
  { asset: 'SOL Skew Arb DeFi', assetShort: 'SOL Skew', buyPlatform: 'Deribit', sellPlatform: 'DeFi Options', buyPrice: 12.40, sellPrice: 12.66, rawSpread: 2.1, confidence: 2, liquidity: 180000 },
  { asset: 'BTC Butterfly Spread', assetShort: 'BTC Butterfly', buyPlatform: 'Deribit', sellPlatform: 'OKX', buyPrice: 420, sellPrice: 435, rawSpread: 3.5, confidence: 3, liquidity: 280000 },
];

function buildOpportunity(partial: Partial<ArbitrageOpportunity>, type: OpportunityType): ArbitrageOpportunity {
  const rawSpread = partial.rawSpread ?? rand(0.5, 8);
  const buyFee = parseFloat(rand(0.05, 0.15).toFixed(3));
  const sellFee = parseFloat(rand(0.05, 0.15).toFixed(3));
  const slippage = parseFloat(rand(0.01, 0.05).toFixed(3));
  const netProfit = parseFloat(Math.max(rawSpread - buyFee - sellFee - slippage, 0.01).toFixed(3));
  const netProfitDollar = parseFloat((netProfit * 10).toFixed(2));

  const mockRiskLevels: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'AVOID'> = ['LOW', 'MEDIUM', 'HIGH', 'AVOID'];
  const algRisk = pick(mockRiskLevels.slice(0, 3));

  return {
    id: genId(),
    type,
    asset: partial.asset ?? 'Unknown Asset',
    assetShort: partial.assetShort ?? 'UNK',
    buyPlatform: partial.buyPlatform ?? 'Exchange A',
    sellPlatform: partial.sellPlatform ?? 'Exchange B',
    buyPrice: partial.buyPrice ?? 100,
    sellPrice: partial.sellPrice ?? 101,
    rawSpread: rawSpread,
    netProfit,
    netProfitDollar,
    confidence: partial.confidence ?? (randInt(1, 5) as 1 | 2 | 3 | 4 | 5),
    liquidity: partial.liquidity ?? randInt(100000, 5000000),
    buyFee,
    sellFee,
    slippageEst: slippage,
    detectedAt: new Date(Date.now() - randInt(0, 3600000)),
    aiInsight: pick(AI_INSIGHTS),
    aiRisk: Math.random() > 0.5 ? pick(mockRiskLevels) : null,
    aiReason: Math.random() > 0.5 ? pick(['latency', 'liquidity', 'fee_structure', 'mispricing']) : null,
    aiConfidence: Math.random() > 0.5 ? (randInt(1, 5) as 1 | 2 | 3 | 4 | 5) : null,
    aiAnalyzedAt: Math.random() > 0.5 ? Date.now() - randInt(0, 60000) : null,
    aiRiskBreakdown: null,
    algorithmicRisk: algRisk,
    hasAiInsight: Math.random() > 0.4,
    isAiAnalyzing: Math.random() > 0.9,
    aiModel: Math.random() > 0.5 ? 'claude-sonnet-4-5' : null,
    status: 'active',
    spreadHistory: generateSpreadHistory(rawSpread),
  };
}

export function generateInitialData(): ArbitrageOpportunity[] {
  const opps: ArbitrageOpportunity[] = [];

  PREDICTION_OPPS.forEach(p => opps.push(buildOpportunity(p, 'prediction')));
  CRYPTO_SPOT_OPPS.forEach(p => opps.push(buildOpportunity(p, 'crypto_spot')));
  FUTURES_OPPS.forEach(p => opps.push(buildOpportunity(p, 'futures_basis')));
  FOREX_OPPS.forEach(p => opps.push(buildOpportunity(p, 'forex')));
  OPTIONS_OPPS.forEach(p => opps.push(buildOpportunity(p, 'options')));

  return opps.sort(() => Math.random() - 0.5);
}

const NEW_ASSETS: Record<OpportunityType, { asset: string; assetShort: string; buyPlatform: string; sellPlatform: string }[]> = {
  prediction: [
    { asset: 'AI beats human at science research', assetShort: 'AI Science', buyPlatform: 'Polymarket', sellPlatform: 'Manifold' },
    { asset: 'S&P 500 above 6000 by Dec', assetShort: 'SPX 6k Dec', buyPlatform: 'Kalshi', sellPlatform: 'Polymarket' },
    { asset: 'Bitcoin halving price pump >50%', assetShort: 'BTC Halving', buyPlatform: 'Polymarket', sellPlatform: 'Kalshi' },
  ],
  crypto_spot: [
    { asset: 'PEPE/USDT', assetShort: 'PEPE/USDT', buyPlatform: 'Binance', sellPlatform: 'KuCoin' },
    { asset: 'SUI/USDT', assetShort: 'SUI/USDT', buyPlatform: 'Bybit', sellPlatform: 'Coinbase' },
    { asset: 'TIA/USDT', assetShort: 'TIA/USDT', buyPlatform: 'Kraken', sellPlatform: 'Binance' },
  ],
  futures_basis: [
    { asset: 'AVAX Basis Trade', assetShort: 'AVAX Basis', buyPlatform: 'Binance Spot', sellPlatform: 'Binance Futures' },
    { asset: 'LINK Funding Rate', assetShort: 'LINK Funding', buyPlatform: 'Bybit', sellPlatform: 'OKX' },
  ],
  forex: [
    { asset: 'CHF/USD Cross-Exchange', assetShort: 'CHF/USD', buyPlatform: 'Kraken', sellPlatform: 'Coinbase' },
    { asset: 'BUSD/USDT Peg Arb', assetShort: 'BUSD/USDT', buyPlatform: 'Binance', sellPlatform: 'KuCoin' },
  ],
  options: [
    { asset: 'SOL Vol Surface Arb', assetShort: 'SOL Vol', buyPlatform: 'Deribit', sellPlatform: 'OKX' },
    { asset: 'ETH Iron Condor Arb', assetShort: 'ETH Condor', buyPlatform: 'OKX', sellPlatform: 'Deribit' },
  ],
};

export function generateNewOpportunity(): ArbitrageOpportunity {
  const type = pick<OpportunityType>(['prediction', 'crypto_spot', 'futures_basis', 'forex', 'options']);
  const template = pick(NEW_ASSETS[type]);

  const rawSpread = parseFloat(rand(0.5, 12).toFixed(2));
  let buyPrice: number, sellPrice: number;

  if (type === 'prediction') {
    buyPrice = parseFloat(rand(0.1, 0.8).toFixed(2));
    sellPrice = parseFloat((buyPrice + rawSpread / 100).toFixed(2));
  } else if (type === 'crypto_spot') {
    buyPrice = parseFloat(rand(0.5, 70000).toFixed(2));
    sellPrice = parseFloat((buyPrice * (1 + rawSpread / 100)).toFixed(2));
  } else {
    buyPrice = parseFloat(rand(1, 5000).toFixed(2));
    sellPrice = parseFloat((buyPrice * (1 + rawSpread / 100)).toFixed(2));
  }

  return buildOpportunity({
    ...template,
    buyPrice,
    sellPrice,
    rawSpread,
    confidence: randInt(1, 5) as 1 | 2 | 3 | 4 | 5,
    liquidity: randInt(50000, 3000000),
  }, type);
}

export function tickPrices(opp: ArbitrageOpportunity): { opp: ArbitrageOpportunity; buyChanged: 'up' | 'down' | null; sellChanged: 'up' | 'down' | null } {
  const buyDelta = rand(-0.005, 0.005);
  const sellDelta = rand(-0.005, 0.005);

  const newBuy = parseFloat((opp.buyPrice * (1 + buyDelta)).toFixed(opp.buyPrice < 1 ? 4 : 2));
  const newSell = parseFloat((opp.sellPrice * (1 + sellDelta)).toFixed(opp.sellPrice < 1 ? 4 : 2));

  const newSpread = newSell > 0 ? parseFloat(((newSell - newBuy) / newBuy * 100).toFixed(3)) : opp.rawSpread;
  const netProfit = parseFloat(Math.max(newSpread - opp.buyFee - opp.sellFee - opp.slippageEst, 0.01).toFixed(3));

  const newHistory = [...opp.spreadHistory.slice(1), newSpread];

  return {
    opp: {
      ...opp,
      buyPrice: newBuy,
      sellPrice: newSell,
      rawSpread: Math.abs(newSpread),
      netProfit,
      netProfitDollar: parseFloat((netProfit * 10).toFixed(2)),
      spreadHistory: newHistory,
    },
    buyChanged: Math.abs(buyDelta) > 0.001 ? (buyDelta > 0 ? 'up' : 'down') : null,
    sellChanged: Math.abs(sellDelta) > 0.001 ? (sellDelta > 0 ? 'up' : 'down') : null,
  };
}
