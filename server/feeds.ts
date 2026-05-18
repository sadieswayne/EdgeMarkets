// Live market data feeds. Pulls real prices from public, key-less
// endpoints and computes genuine cross-exchange spreads:
//
//   • Crypto spot  — Bybit, OKX and Binance public spot tickers
//   • Prediction   — Polymarket gamma API (real bid/ask/spread)
//
// Forex / options / futures-basis have no free real feed, so those stay
// synthetic (clearly the simulated part). If every live feed is
// unreachable we fall back to the synthetic generator entirely.

import {
  type ServerOpportunity,
  type OpportunityType,
  syntheticOpportunities,
} from "./store";

const CRYPTO_BASES = [
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "DOGE",
  "ADA",
  "AVAX",
  "LINK",
  "LTC",
  "BCH",
  "DOT",
  "TRX",
];

// Real taker fees (percent of notional) per venue.
const TAKER_FEE: Record<string, number> = {
  Binance: 0.1,
  Bybit: 0.1,
  OKX: 0.1,
};

interface Quote {
  bid: number;
  ask: number;
  quoteVol?: number; // 24h volume in USDT, when the venue reports it
}
type VenueBook = Map<string, Quote>; // base -> quote

async function getJson(url: string): Promise<any | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4500);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        // A browser-like UA helps get past Cloudflare bot rules on some
        // public APIs (e.g. Polymarket) from datacenter egress IPs.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBybit(): Promise<VenueBook | null> {
  const j = await getJson(
    "https://api.bybit.com/v5/market/tickers?category=spot",
  );
  const list = j?.result?.list;
  if (!Array.isArray(list)) return null;
  const book: VenueBook = new Map();
  for (const t of list) {
    const sym: string = t.symbol || "";
    if (!sym.endsWith("USDT")) continue;
    const base = sym.slice(0, -4);
    if (!CRYPTO_BASES.includes(base)) continue;
    const bid = parseFloat(t.bid1Price);
    const ask = parseFloat(t.ask1Price);
    if (bid > 0 && ask > 0)
      book.set(base, { bid, ask, quoteVol: parseFloat(t.turnover24h) });
  }
  return book.size ? book : null;
}

async function fetchOkx(): Promise<VenueBook | null> {
  const j = await getJson(
    "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
  );
  const list = j?.data;
  if (!Array.isArray(list)) return null;
  const book: VenueBook = new Map();
  for (const t of list) {
    const inst: string = t.instId || "";
    if (!inst.endsWith("-USDT")) continue;
    const base = inst.slice(0, -5);
    if (!CRYPTO_BASES.includes(base)) continue;
    const bid = parseFloat(t.bidPx);
    const ask = parseFloat(t.askPx);
    if (bid > 0 && ask > 0)
      book.set(base, { bid, ask, quoteVol: parseFloat(t.volCcy24h) });
  }
  return book.size ? book : null;
}

async function fetchBinance(): Promise<VenueBook | null> {
  // bookTicker = best bid/ask for every symbol in one call.
  const j = await getJson("https://api.binance.com/api/v3/ticker/bookTicker");
  if (!Array.isArray(j)) return null;
  const book: VenueBook = new Map();
  for (const t of j) {
    const sym: string = t.symbol || "";
    if (!sym.endsWith("USDT")) continue;
    const base = sym.slice(0, -4);
    if (!CRYPTO_BASES.includes(base)) continue;
    const bid = parseFloat(t.bidPrice);
    const ask = parseFloat(t.askPrice);
    if (bid > 0 && ask > 0) book.set(base, { bid, ask });
  }
  return book.size ? book : null;
}

// Per-opportunity history + first-seen, keyed by stable id, so the
// sparkline and "age" reflect real observed evolution.
interface Track {
  detectedAt: number;
  history: number[];
}
const tracks = new Map<string, Track>();

function track(id: string, spread: number): Track {
  let t = tracks.get(id);
  if (!t) {
    t = { detectedAt: Date.now(), history: [] };
    tracks.set(id, t);
  }
  t.history.push(parseFloat(spread.toFixed(3)));
  if (t.history.length > 20) t.history = t.history.slice(-20);
  return t;
}

function confidenceFromLiquidity(liq: number): number {
  if (liq > 50_000_000) return 5;
  if (liq > 10_000_000) return 4;
  if (liq > 2_000_000) return 3;
  if (liq > 500_000) return 2;
  return 1;
}

function riskFromSpread(
  spread: number,
  liq: number,
): "LOW" | "MEDIUM" | "HIGH" {
  if (liq > 10_000_000 && spread < 0.5) return "LOW";
  if (spread > 2 || liq < 1_000_000) return "HIGH";
  return "MEDIUM";
}

function decimals(v: number) {
  return v < 1 ? 6 : v < 100 ? 4 : 2;
}

function buildCrypto(
  books: { venue: string; book: VenueBook }[],
): ServerOpportunity[] {
  const out: ServerOpportunity[] = [];
  for (const base of CRYPTO_BASES) {
    const quotes = books
      .filter((b) => b.book.has(base))
      .map((b) => ({ venue: b.venue, ...(b.book.get(base) as Quote) }));
    if (quotes.length < 2) continue;

    // Buy where the ask is lowest, sell where the bid is highest.
    const buy = quotes.reduce((a, b) => (b.ask < a.ask ? b : a));
    const sell = quotes.reduce((a, b) => (b.bid > a.bid ? b : a));
    if (buy.venue === sell.venue || buy.ask <= 0) continue;

    const rawSpread = ((sell.bid - buy.ask) / buy.ask) * 100;
    const buyFee = TAKER_FEE[buy.venue] ?? 0.1;
    const sellFee = TAKER_FEE[sell.venue] ?? 0.1;
    const slippageEst = 0.02;
    const netProfit = parseFloat(
      (rawSpread - buyFee - sellFee - slippageEst).toFixed(3),
    );
    const liquidity = Math.round(
      Math.max(sell.quoteVol || 0, buy.quoteVol || 0) || 250_000,
    );
    const id = `crypto:${base}`;
    const t = track(id, rawSpread);

    out.push({
      id,
      type: "crypto_spot",
      asset: `${base}/USDT`,
      assetShort: `${base}/USDT`,
      buyPlatform: buy.venue,
      sellPlatform: sell.venue,
      buyPrice: parseFloat(buy.ask.toFixed(decimals(buy.ask))),
      sellPrice: parseFloat(sell.bid.toFixed(decimals(sell.bid))),
      rawSpread: parseFloat(Math.abs(rawSpread).toFixed(3)),
      netProfit,
      netProfitDollar: parseFloat((netProfit * 10).toFixed(2)),
      confidence: confidenceFromLiquidity(liquidity),
      liquidity,
      buyFee,
      sellFee,
      slippageEst,
      detectedAt: t.detectedAt,
      aiInsight: "",
      aiRisk: null,
      aiReason: null,
      aiConfidence: null,
      aiAnalyzedAt: null,
      aiRiskBreakdown: null,
      algorithmicRisk: riskFromSpread(Math.abs(rawSpread), liquidity),
      hasAiInsight: false,
      isAiAnalyzing: false,
      aiModel: null,
      status: "active",
      spreadHistory: t.history.slice(),
    });
  }
  return out;
}

async function fetchPolymarket(): Promise<ServerOpportunity[]> {
  const j = await getJson(
    "https://gamma-api.polymarket.com/markets?active=true&closed=false&archived=false&limit=18&order=volumeNum&ascending=false",
  );
  if (!Array.isArray(j)) return [];
  const out: ServerOpportunity[] = [];
  for (const m of j) {
    const bid = parseFloat(m.bestBid);
    const ask = parseFloat(m.bestAsk);
    if (!(bid > 0) || !(ask > 0) || ask <= bid || ask >= 1) continue;
    const rawSpread = ((ask - bid) / ask) * 100;
    const liquidity = Math.round(parseFloat(m.liquidityNum) || 0);
    const id = `poly:${m.conditionId || m.slug || m.id}`;
    const t = track(id, rawSpread);
    const question: string = m.question || m.slug || "Polymarket market";
    out.push({
      id,
      type: "prediction",
      asset: question,
      assetShort:
        question.length > 38 ? question.slice(0, 36) + "…" : question,
      buyPlatform: "Polymarket",
      sellPlatform: "Polymarket",
      buyPrice: parseFloat(ask.toFixed(3)),
      sellPrice: parseFloat(bid.toFixed(3)),
      rawSpread: parseFloat(rawSpread.toFixed(3)),
      netProfit: parseFloat((-rawSpread).toFixed(3)),
      netProfitDollar: parseFloat((-rawSpread * 10).toFixed(2)),
      confidence: confidenceFromLiquidity(liquidity),
      liquidity,
      buyFee: 0,
      sellFee: 0,
      slippageEst: parseFloat((rawSpread / 2).toFixed(3)),
      detectedAt: t.detectedAt,
      aiInsight: "",
      aiRisk: null,
      aiReason: null,
      aiConfidence: null,
      aiAnalyzedAt: null,
      aiRiskBreakdown: null,
      algorithmicRisk: riskFromSpread(rawSpread, liquidity),
      hasAiInsight: false,
      isAiAnalyzing: false,
      aiModel: null,
      status: "active",
      spreadHistory: t.history.slice(),
    });
  }
  return out;
}

// Kalshi public market data — GET /markets is unauthenticated
// (OpenAPI security: []), so no API key or request signing is needed.
async function fetchKalshi(): Promise<ServerOpportunity[]> {
  const base =
    process.env.KALSHI_API_BASE ||
    "https://api.elections.kalshi.com/trade-api/v2";
  // mve_filter=exclude drops multivariate sports parlays server-side
  // (otherwise they swamp the first pages and hide real markets).
  const j = await getJson(
    `${base}/markets?status=open&limit=1000&mve_filter=exclude`,
  );
  const markets = j?.markets;
  if (!Array.isArray(markets)) return [];

  const ranked = markets
    .map((m: any) => {
      const ask = parseFloat(m.yes_ask_dollars);
      const bid = parseFloat(m.yes_bid_dollars);
      const vol =
        parseFloat(m.volume_24h_fp) || parseFloat(m.volume_fp) || 0;
      const oi = parseFloat(m.open_interest_fp) || 0;
      return { m, ask, bid, liq: Math.max(vol, oi) };
    })
    .filter(
      (r) =>
        r.bid > 0 &&
        r.ask > 0 &&
        r.ask > r.bid &&
        r.ask < 1 &&
        r.liq >= 200 &&
        // drop illiquid multivariate sports parlays — they dominate the
        // raw feed but aren't meaningful single-question markets
        !r.m.mve_collection_ticker &&
        !/^KXMVE/.test(r.m.ticker || ""),
    )
    .sort((a, b) => b.liq - a.liq);

  // One market per event (the most liquid strike) for a diverse list.
  const seen = new Set<string>();
  const rows: typeof ranked = [];
  for (const r of ranked) {
    const ev = r.m.event_ticker || r.m.ticker;
    if (seen.has(ev)) continue;
    seen.add(ev);
    rows.push(r);
    if (rows.length >= 14) break;
  }

  const out: ServerOpportunity[] = [];
  for (const { m, ask, bid, liq } of rows) {
    const rawSpread = ((ask - bid) / ask) * 100;
    const liquidity = Math.round(liq);
    const id = `kalshi:${m.ticker}`;
    const t = track(id, rawSpread);
    const title: string =
      m.title || m.yes_sub_title || m.ticker || "Kalshi market";
    out.push({
      id,
      type: "prediction",
      asset: title,
      assetShort: title.length > 38 ? title.slice(0, 36) + "…" : title,
      buyPlatform: "Kalshi",
      sellPlatform: "Kalshi",
      buyPrice: parseFloat(ask.toFixed(3)),
      sellPrice: parseFloat(bid.toFixed(3)),
      rawSpread: parseFloat(rawSpread.toFixed(3)),
      netProfit: parseFloat((-rawSpread).toFixed(3)),
      netProfitDollar: parseFloat((-rawSpread * 10).toFixed(2)),
      confidence: confidenceFromLiquidity(liquidity),
      liquidity,
      buyFee: 0,
      sellFee: 0,
      slippageEst: parseFloat((rawSpread / 2).toFixed(3)),
      detectedAt: t.detectedAt,
      aiInsight: "",
      aiRisk: null,
      aiReason: null,
      aiConfidence: null,
      aiAnalyzedAt: null,
      aiRiskBreakdown: null,
      algorithmicRisk: riskFromSpread(rawSpread, liquidity),
      hasAiInsight: false,
      isAiAnalyzing: false,
      aiModel: null,
      status: "active",
      spreadHistory: t.history.slice(),
    });
  }
  return out;
}

export interface Connection {
  platform: string;
  status: "connected" | "disconnected";
  pairsCount: number;
  lastUpdate: number;
}

export interface LiveData {
  opportunities: ServerOpportunity[];
  connections: Connection[];
  stats: {
    totalOpportunities: number;
    avgSpread: number;
    bestOpportunity: number;
    totalVolume: number;
  };
  live: boolean;
}

let cache: { at: number; data: LiveData } | null = null;
const CACHE_MS = 4000;
let inflight: Promise<LiveData> | null = null;

async function refresh(): Promise<LiveData> {
  const [bybit, okx, binance, poly, kalshi] = await Promise.all([
    fetchBybit(),
    fetchOkx(),
    fetchBinance(),
    fetchPolymarket().catch(() => []),
    fetchKalshi().catch(() => []),
  ]);

  const venues: { venue: string; book: VenueBook }[] = [];
  if (bybit) venues.push({ venue: "Bybit", book: bybit });
  if (okx) venues.push({ venue: "OKX", book: okx });
  if (binance) venues.push({ venue: "Binance", book: binance });

  const crypto = venues.length >= 2 ? buildCrypto(venues) : [];
  const prediction = [...kalshi, ...poly];
  const haveLiveCrypto = crypto.length > 0;
  const haveLivePred = prediction.length > 0;

  let opportunities: ServerOpportunity[];
  if (!haveLiveCrypto && !haveLivePred) {
    // Total outage — everything synthetic.
    opportunities = syntheticOpportunities([
      "crypto_spot",
      "prediction",
      "forex",
      "options",
      "futures_basis",
    ]);
  } else {
    const fillerTypes: OpportunityType[] = [
      "forex",
      "options",
      "futures_basis",
    ];
    if (!haveLiveCrypto) fillerTypes.push("crypto_spot");
    if (!haveLivePred) fillerTypes.push("prediction");
    opportunities = [
      ...crypto,
      ...prediction,
      ...syntheticOpportunities(fillerTypes),
    ];
  }

  const connections: Connection[] = [
    { platform: "Bybit", up: !!bybit, n: bybit?.size ?? 0 },
    { platform: "OKX", up: !!okx, n: okx?.size ?? 0 },
    { platform: "Binance", up: !!binance, n: binance?.size ?? 0 },
    { platform: "Kalshi", up: kalshi.length > 0, n: kalshi.length },
    { platform: "Polymarket", up: poly.length > 0, n: poly.length },
    { platform: "Coinbase", up: false, n: 0 },
  ].map((c) => ({
    platform: c.platform,
    status: c.up ? ("connected" as const) : ("disconnected" as const),
    pairsCount: c.n,
    lastUpdate: Date.now(),
  }));

  const spreads = opportunities.map((o) => o.rawSpread);
  const data: LiveData = {
    opportunities,
    connections,
    stats: {
      totalOpportunities: opportunities.length,
      avgSpread: spreads.length
        ? parseFloat(
            (spreads.reduce((a, b) => a + b, 0) / spreads.length).toFixed(2),
          )
        : 0,
      bestOpportunity: spreads.length ? Math.max(...spreads) : 0,
      totalVolume: opportunities.reduce((s, o) => s + o.liquidity, 0),
    },
    live: haveLiveCrypto || haveLivePred,
  };
  return data;
}

export async function getLiveData(): Promise<LiveData> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.data;
  if (inflight) return inflight;
  inflight = refresh()
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .catch(() => {
      if (cache) return cache.data;
      const synthetic = syntheticOpportunities([
        "crypto_spot",
        "prediction",
        "forex",
        "options",
        "futures_basis",
      ]);
      return {
        opportunities: synthetic,
        connections: [],
        stats: {
          totalOpportunities: synthetic.length,
          avgSpread: 0,
          bestOpportunity: 0,
          totalVolume: 0,
        },
        live: false,
      } as LiveData;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
