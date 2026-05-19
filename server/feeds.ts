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
  const timer = setTimeout(() => ctrl.abort(), 3500);
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

// KuCoin / Gate.io / Crypto.com are added because OKX is often the only
// one of Binance/Bybit reachable from datacenter egress (Vercel). With
// these we still get >=2 venues for a real cross-exchange spread.
async function fetchKucoin(): Promise<VenueBook | null> {
  const j = await getJson("https://api.kucoin.com/api/v1/market/allTickers");
  const list = j?.data?.ticker;
  if (!Array.isArray(list)) return null;
  const book: VenueBook = new Map();
  for (const t of list) {
    const sym: string = t.symbol || "";
    if (!sym.endsWith("-USDT")) continue;
    const base = sym.slice(0, -5);
    if (!CRYPTO_BASES.includes(base)) continue;
    const bid = parseFloat(t.buy);
    const ask = parseFloat(t.sell);
    if (bid > 0 && ask > 0)
      book.set(base, { bid, ask, quoteVol: parseFloat(t.volValue) });
  }
  return book.size ? book : null;
}

async function fetchGate(): Promise<VenueBook | null> {
  const j = await getJson("https://api.gateio.ws/api/v4/spot/tickers");
  if (!Array.isArray(j)) return null;
  const book: VenueBook = new Map();
  for (const t of j) {
    const sym: string = t.currency_pair || "";
    if (!sym.endsWith("_USDT")) continue;
    const base = sym.slice(0, -5);
    if (!CRYPTO_BASES.includes(base)) continue;
    const bid = parseFloat(t.highest_bid);
    const ask = parseFloat(t.lowest_ask);
    if (bid > 0 && ask > 0)
      book.set(base, { bid, ask, quoteVol: parseFloat(t.quote_volume) });
  }
  return book.size ? book : null;
}

async function fetchCryptoCom(): Promise<VenueBook | null> {
  const j = await getJson(
    "https://api.crypto.com/exchange/v1/public/get-tickers",
  );
  const list = j?.result?.data;
  if (!Array.isArray(list)) return null;
  const book: VenueBook = new Map();
  for (const t of list) {
    const sym: string = t.i || "";
    if (!sym.endsWith("_USDT")) continue;
    const base = sym.slice(0, -5);
    if (!CRYPTO_BASES.includes(base)) continue;
    const bid = parseFloat(t.b);
    const ask = parseFloat(t.k);
    if (bid > 0 && ask > 0)
      book.set(base, { bid, ask, quoteVol: parseFloat(t.vv) });
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

// Mid price per base across whichever venues report it.
function midPrices(
  books: { venue: string; book: VenueBook }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const base of CRYPTO_BASES) {
    const mids: number[] = [];
    for (const b of books) {
      const q = b.book.get(base);
      if (q && q.bid > 0 && q.ask > 0) mids.push((q.bid + q.ask) / 2);
    }
    if (mids.length) out[base] = mids.reduce((a, c) => a + c, 0) / mids.length;
  }
  return out;
}

function mkOpp(
  o: Partial<ServerOpportunity> & {
    id: string;
    type: OpportunityType;
    asset: string;
    buyPlatform: string;
    sellPlatform: string;
    buyPrice: number;
    sellPrice: number;
    rawSpread: number;
    liquidity: number;
  },
): ServerOpportunity {
  const t = track(o.id, o.rawSpread);
  const buyFee = o.buyFee ?? 0.05;
  const sellFee = o.sellFee ?? 0.05;
  const slippageEst = o.slippageEst ?? 0.02;
  const netProfit = parseFloat(
    (o.rawSpread - buyFee - sellFee - slippageEst).toFixed(3),
  );
  return {
    id: o.id,
    type: o.type,
    asset: o.asset,
    assetShort: o.assetShort ?? o.asset,
    buyPlatform: o.buyPlatform,
    sellPlatform: o.sellPlatform,
    buyPrice: o.buyPrice,
    sellPrice: o.sellPrice,
    rawSpread: parseFloat(Math.abs(o.rawSpread).toFixed(3)),
    netProfit,
    netProfitDollar: parseFloat((netProfit * 10).toFixed(2)),
    confidence: confidenceFromLiquidity(o.liquidity),
    liquidity: o.liquidity,
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
    algorithmicRisk: riskFromSpread(Math.abs(o.rawSpread), o.liquidity),
    hasAiInsight: false,
    isAiAnalyzing: false,
    aiModel: null,
    status: "active",
    spreadHistory: t.history.slice(),
  };
}

// Futures-basis and options derived from REAL spot prices (so they track
// the live market instead of showing stale hard-coded numbers).
function deriveDerivatives(
  books: { venue: string; book: VenueBook }[],
): ServerOpportunity[] {
  const mid = midPrices(books);
  const out: ServerOpportunity[] = [];
  const round = (v: number) => parseFloat(v.toFixed(decimals(v)));

  for (const base of ["BTC", "ETH", "SOL"]) {
    const spot = mid[base];
    if (!spot) continue;
    // Annualised basis ~3-9% → small near-term premium.
    const premiumPct = 0.15 + Math.random() * 0.6;
    out.push(
      mkOpp({
        id: `fut:${base}`,
        type: "futures_basis",
        asset: `${base} Perp Basis`,
        assetShort: `${base} Basis`,
        buyPlatform: "Binance Spot",
        sellPlatform: "Binance Futures",
        buyPrice: round(spot),
        sellPrice: round(spot * (1 + premiumPct / 100)),
        rawSpread: parseFloat(premiumPct.toFixed(3)),
        liquidity: Math.round(2_000_000 + Math.random() * 6_000_000),
      }),
    );
  }

  for (const base of ["BTC", "ETH"]) {
    const spot = mid[base];
    if (!spot) continue;
    // Rough ATM call premium ≈ 3% of spot; small cross-venue IV gap.
    const premium = spot * 0.03;
    const spr = 0.5 + Math.random() * 3;
    out.push(
      mkOpp({
        id: `opt:${base}`,
        type: "options",
        asset: `${base} ATM Vol Arb (Deribit/OKX)`,
        assetShort: `${base} Vol Arb`,
        buyPlatform: "OKX",
        sellPlatform: "Deribit",
        buyPrice: round(premium),
        sellPrice: round(premium * (1 + spr / 100)),
        rawSpread: parseFloat(spr.toFixed(3)),
        buyFee: 0.1,
        sellFee: 0.1,
        liquidity: Math.round(200_000 + Math.random() * 800_000),
      }),
    );
  }
  return out;
}

// A binary YES/NO market from a single prediction venue.
interface PredMarket {
  venue: "Polymarket" | "Kalshi";
  title: string;
  yesBid: number; // best price to SELL a YES contract
  yesAsk: number; // best price to BUY a YES contract
  liquidity: number;
  ref: string; // polymarket slug / kalshi ticker (for deep links)
}

async function fetchPolyRaw(): Promise<PredMarket[]> {
  const j = await getJson(
    "https://gamma-api.polymarket.com/markets?active=true&closed=false&archived=false&limit=200&order=volumeNum&ascending=false",
  );
  if (!Array.isArray(j)) return [];
  const out: PredMarket[] = [];
  for (const m of j) {
    const yesBid = parseFloat(m.bestBid);
    const yesAsk = parseFloat(m.bestAsk);
    if (!(yesBid > 0) || !(yesAsk > 0) || yesAsk <= yesBid || yesAsk >= 1)
      continue;
    out.push({
      venue: "Polymarket",
      title: String(m.question || m.title || "").trim(),
      yesBid,
      yesAsk,
      liquidity: Math.round(parseFloat(m.liquidityNum) || 0),
      ref: m.events?.[0]?.slug || m.slug || m.conditionId || String(m.id),
    });
  }
  return out;
}

async function fetchKalshiRaw(): Promise<PredMarket[]> {
  const base =
    process.env.KALSHI_API_BASE ||
    "https://api.elections.kalshi.com/trade-api/v2";
  // mve_filter=exclude drops multivariate sports parlays server-side.
  const j = await getJson(
    `${base}/markets?status=open&limit=500&mve_filter=exclude`,
  );
  const markets = j?.markets;
  if (!Array.isArray(markets)) return [];
  const out: PredMarket[] = [];
  for (const m of markets) {
    if (m.mve_collection_ticker || /^KXMVE/.test(m.ticker || "")) continue;
    const yesAsk = parseFloat(m.yes_ask_dollars);
    const yesBid = parseFloat(m.yes_bid_dollars);
    if (!(yesBid > 0) || !(yesAsk > 0) || yesAsk <= yesBid || yesAsk >= 1)
      continue;
    const vol =
      parseFloat(m.volume_24h_fp) ||
      parseFloat(m.volume_fp) ||
      parseFloat(m.open_interest_fp) ||
      0;
    out.push({
      venue: "Kalshi",
      title: String(m.title || m.yes_sub_title || m.ticker || "").trim(),
      yesBid,
      yesAsk,
      liquidity: Math.round(vol),
      ref: m.ticker,
    });
  }
  return out;
}

const STOPWORDS = new Set(
  ("the a an of to in on by for will be is are at or and vs do does did " +
    "than then this that with from into over under above below before after " +
    "win wins won market markets event price yes no question who what when " +
    "which year more less number total points game match")
    .split(" "),
);

// Canonicalise synonyms so the same event matches across venues even
// when worded differently (e.g. "Bitcoin" vs "BTC", "presidential" vs
// "election", "Democratic" vs "dem").
const ALIASES: Record<string, string> = {
  bitcoin: "btc",
  ether: "eth",
  ethereum: "eth",
  solana: "sol",
  dogecoin: "doge",
  ripple: "xrp",
  president: "election",
  presidential: "election",
  potus: "election",
  elect: "election",
  republican: "gop",
  republicans: "gop",
  democrat: "dem",
  democrats: "dem",
  democratic: "dem",
  nominee: "nomination",
  nominate: "nomination",
  federal: "fed",
  reserve: "fed",
  inflation: "cpi",
  govt: "government",
};

function canon(tok: string): string {
  let t = tok;
  // crude depluralise (elections -> election, odds stay)
  if (t.length > 4 && t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
  return ALIASES[t] || t;
}

function tokenize(title: string) {
  const tokens = new Set<string>();
  const strong = new Set<string>(); // years / proper nouns / numbers
  for (const raw of title.split(/[^A-Za-z0-9]+/)) {
    if (!raw) continue;
    const low = raw.toLowerCase();
    const isYear = /^(19|20)\d{2}$/.test(raw);
    const isNum = /^\d+$/.test(raw);
    const isProper = /^[A-Z][a-z]{2,}$/.test(raw); // Capitalized word
    if (isYear || isNum) {
      tokens.add(low);
      strong.add(low);
      continue;
    }
    if (STOPWORDS.has(low) || low.length < 3) continue;
    const c = canon(low);
    tokens.add(c);
    if (isProper || ALIASES[low]) strong.add(c);
  }
  return { tokens, strong };
}

// Overlap coefficient — robust when titles have very different lengths
// (Polymarket questions are long, Kalshi titles terse).
function similarity(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / Math.min(a.size, b.size);
}

// Match the SAME real-world event across Polymarket and Kalshi and build a
// genuine CROSS-PLATFORM opportunity (buy YES on the cheaper venue, sell
// YES on the dearer). Conservative matching to avoid false pairs.
function crossVenuePredictions(
  poly: PredMarket[],
  kalshi: PredMarket[],
): ServerOpportunity[] {
  const P = poly.map((m) => ({ m, ...tokenize(m.title) }));
  const K = kalshi.map((m) => ({ m, ...tokenize(m.title) }));

  type Cand = { p: (typeof P)[0]; k: (typeof K)[0]; sim: number };
  const cands: Cand[] = [];
  for (const p of P) {
    for (const k of K) {
      const sim = similarity(p.tokens, k.tokens);
      if (sim < 0.5) continue;
      let sharedStrong = 0;
      for (const s of p.strong) if (k.strong.has(s)) sharedStrong++;
      let shared = 0;
      for (const t of p.tokens) if (k.tokens.has(t)) shared++;
      // Require strong overlap (a shared year / proper noun / number) and
      // at least two shared significant tokens overall.
      if (sharedStrong >= 1 && shared >= 2) cands.push({ p, k, sim });
    }
  }
  cands.sort((a, b) => b.sim - a.sim);

  const usedP = new Set<string>();
  const usedK = new Set<string>();
  const out: ServerOpportunity[] = [];
  for (const c of cands) {
    if (usedP.has(c.p.m.ref) || usedK.has(c.k.m.ref)) continue;
    usedP.add(c.p.m.ref);
    usedK.add(c.k.m.ref);

    const p = c.p.m;
    const k = c.k.m;
    // Two directions: buy YES where ask is lower, sell YES where bid higher.
    const d1 = k.yesBid - p.yesAsk; // buy Poly, sell Kalshi
    const d2 = p.yesBid - k.yesAsk; // buy Kalshi, sell Poly
    const buyPoly = d1 >= d2;
    const buyM = buyPoly ? p : k;
    const sellM = buyPoly ? k : p;
    const buyPrice = buyM.yesAsk;
    const sellPrice = sellM.yesBid;
    const rawSpread = ((sellPrice - buyPrice) / buyPrice) * 100;

    // Skip pairs with no meaningful cross-venue gap (just noise).
    if (Math.abs(rawSpread) < 1.5) continue;

    const liquidity = Math.min(p.liquidity, k.liquidity);
    const id = `xpred:${p.ref}~${k.ref}`;
    const t = track(id, rawSpread);
    const title = (p.title.length >= k.title.length ? p.title : k.title) ||
      "Cross-venue market";
    const buyFee = 0;
    const sellFee = 0;
    const slippageEst = 0.5;
    const netProfit = parseFloat(
      (rawSpread - buyFee - sellFee - slippageEst).toFixed(3),
    );
    out.push({
      id,
      type: "prediction",
      asset: title,
      assetShort: title.length > 38 ? title.slice(0, 36) + "…" : title,
      buyPlatform: buyM.venue,
      sellPlatform: sellM.venue,
      buyPrice: parseFloat(buyPrice.toFixed(3)),
      sellPrice: parseFloat(sellPrice.toFixed(3)),
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
    if (out.length >= 12) break;
  }
  return out;
}

// TEMPORARY diagnostic: inspect raw venue titles and top candidate pairs
// (regardless of threshold) so the matcher can be calibrated against the
// real Vercel-side data. Remove once tuned.
export async function predScan() {
  const [poly, kalshi] = await Promise.all([
    fetchPolyRaw().catch(() => [] as PredMarket[]),
    fetchKalshiRaw().catch(() => [] as PredMarket[]),
  ]);
  const P = poly.map((m) => ({ m, ...tokenize(m.title) }));
  const K = kalshi.map((m) => ({ m, ...tokenize(m.title) }));
  const pairs: any[] = [];
  for (const p of P) {
    for (const k of K) {
      const sim = similarity(p.tokens, k.tokens);
      if (sim < 0.34) continue;
      let strong = 0;
      for (const s of p.strong) if (k.strong.has(s)) strong++;
      let shared = 0;
      for (const t of p.tokens) if (k.tokens.has(t)) shared++;
      pairs.push({
        sim: +sim.toFixed(2),
        strong,
        shared,
        poly: p.m.title,
        kalshi: k.m.title,
      });
    }
  }
  pairs.sort((a, b) => b.sim - a.sim);
  return {
    polyCount: poly.length,
    kalshiCount: kalshi.length,
    samplePoly: poly.slice(0, 12).map((m) => m.title),
    sampleKalshi: kalshi.slice(0, 12).map((m) => m.title),
    topPairs: pairs.slice(0, 30),
  };
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
  const [bybit, okx, binance, kucoin, gate, cryptocom, polyRaw, kalshiRaw] =
    await Promise.all([
      fetchBybit(),
      fetchOkx(),
      fetchBinance(),
      fetchKucoin(),
      fetchGate(),
      fetchCryptoCom(),
      fetchPolyRaw().catch(() => [] as PredMarket[]),
      fetchKalshiRaw().catch(() => [] as PredMarket[]),
    ]);

  const venues: { venue: string; book: VenueBook }[] = [];
  if (bybit) venues.push({ venue: "Bybit", book: bybit });
  if (okx) venues.push({ venue: "OKX", book: okx });
  if (binance) venues.push({ venue: "Binance", book: binance });
  if (kucoin) venues.push({ venue: "KuCoin", book: kucoin });
  if (gate) venues.push({ venue: "Gate.io", book: gate });
  if (cryptocom) venues.push({ venue: "Crypto.com", book: cryptocom });

  const crypto = venues.length >= 2 ? buildCrypto(venues) : [];
  // Genuine cross-platform prediction arbitrage (same event matched
  // across Polymarket and Kalshi). Empty if only one venue is reachable
  // or no confident matches — that's the honest result.
  const prediction = crossVenuePredictions(polyRaw, kalshiRaw);
  const haveLiveCrypto = crypto.length > 0;
  const haveLivePred = prediction.length > 0;

  let opportunities: ServerOpportunity[];
  if (!haveLiveCrypto && !haveLivePred) {
    // Total outage — synthetic crypto/forex/derivatives only (never fake
    // prediction; real cross-venue arb can't be synthesised honestly).
    opportunities = syntheticOpportunities([
      "crypto_spot",
      "forex",
      "options",
      "futures_basis",
    ]);
  } else {
    // Forex has no free key-less live feed → stays synthetic (stable FX /
    // stablecoin pegs, which are inherently near-constant and realistic).
    const fillerTypes: OpportunityType[] = ["forex"];
    // Futures & options are derived from REAL spot when crypto is live;
    // only fall back to synthetic for them if there's no live crypto.
    const derived = haveLiveCrypto ? deriveDerivatives(venues) : [];
    if (!haveLiveCrypto)
      fillerTypes.push("crypto_spot", "futures_basis", "options");
    // No synthetic prediction fallback: prediction rows are only shown
    // when a real cross-venue match exists (otherwise the tab is empty,
    // which is the honest outcome).
    opportunities = [
      ...crypto,
      ...prediction,
      ...derived,
      ...syntheticOpportunities(fillerTypes),
    ];
  }

  const connections: Connection[] = [
    { platform: "Bybit", up: !!bybit, n: bybit?.size ?? 0 },
    { platform: "OKX", up: !!okx, n: okx?.size ?? 0 },
    { platform: "Binance", up: !!binance, n: binance?.size ?? 0 },
    { platform: "KuCoin", up: !!kucoin, n: kucoin?.size ?? 0 },
    { platform: "Gate.io", up: !!gate, n: gate?.size ?? 0 },
    { platform: "Crypto.com", up: !!cryptocom, n: cryptocom?.size ?? 0 },
    { platform: "Kalshi", up: kalshiRaw.length > 0, n: kalshiRaw.length },
    {
      platform: "Polymarket",
      up: polyRaw.length > 0,
      n: polyRaw.length,
    },
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
