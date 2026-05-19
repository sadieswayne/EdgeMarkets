export interface DeepLinkResult {
  url: string;
  platform: string;
  description: string;
}

function normalizeSymbol(asset: string): { base: string; quote: string } {
  // Take the first token (handles "BTC/USDT", "BTC-USDT", "BTC Basis", etc.)
  const first = asset.trim().split(/\s+/)[0];
  const clean = first.replace(/[\/\-_]/g, '/');
  const parts = clean.split('/').filter(Boolean);
  if (parts.length >= 2) return { base: parts[0], quote: parts[1] };
  return { base: parts[0] || asset, quote: 'USDT' };
}

// Strip a trailing "Spot" / "Futures" / "Perp" qualifier from a platform
// name (our derived futures use e.g. "Binance Spot" / "Binance Futures").
function splitPlatform(platform: string): { name: string; futures: boolean } {
  const m = platform.trim().match(/^(.*?)[\s-]*(spot|futures|perp|perpetual)?$/i);
  const name = (m?.[1] || platform).trim();
  const futures = /futures|perp/i.test(m?.[2] || '');
  return { name, futures };
}

function key(platform: string): string {
  return platform.toLowerCase().replace(/[\s._-]/g, '');
}

/* ---- Crypto spot/futures venues ---- */

function binance(asset: string, futures: boolean): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return futures
    ? { url: `https://www.binance.com/en/futures/${base}${quote}`, platform: 'Binance', description: `Trade ${base}/${quote} on Binance Futures` }
    : { url: `https://www.binance.com/en/trade/${base}_${quote}`, platform: 'Binance', description: `Trade ${base}/${quote} on Binance` };
}
function bybit(asset: string, futures: boolean): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return futures
    ? { url: `https://www.bybit.com/trade/usdt/${base}${quote}`, platform: 'Bybit', description: `Trade ${base} perpetual on Bybit` }
    : { url: `https://www.bybit.com/en/trade/spot/${base}/${quote}`, platform: 'Bybit', description: `Trade ${base}/${quote} on Bybit` };
}
function okx(asset: string, futures: boolean): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  // Options assets ("BTC ATM Vol Arb (Deribit/OKX)") → options page.
  if (/vol|option|put|call|condor|butterfly|skew|parity/i.test(asset)) {
    return { url: `https://www.okx.com/trade-option/${base.toLowerCase()}-usd`, platform: 'OKX', description: `Trade ${base} options on OKX` };
  }
  return futures
    ? { url: `https://www.okx.com/trade-swap/${base.toLowerCase()}-${quote.toLowerCase()}-swap`, platform: 'OKX', description: `Trade ${base} swap on OKX` }
    : { url: `https://www.okx.com/trade-spot/${base.toLowerCase()}-${quote.toLowerCase()}`, platform: 'OKX', description: `Trade ${base}/${quote} on OKX` };
}
function coinbase(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  const q = quote === 'USDT' ? 'USD' : quote;
  return { url: `https://www.coinbase.com/advanced-trade/spot/${base}-${q}`, platform: 'Coinbase', description: `Trade ${base}/${q} on Coinbase` };
}
function kraken(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return { url: `https://pro.kraken.com/app/trade/${base.toLowerCase()}-${quote.toLowerCase()}`, platform: 'Kraken', description: `Trade ${base}/${quote} on Kraken` };
}
function kucoin(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return { url: `https://www.kucoin.com/trade/${base}-${quote}`, platform: 'KuCoin', description: `Trade ${base}/${quote} on KuCoin` };
}
function gate(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return { url: `https://www.gate.io/trade/${base}_${quote}`, platform: 'Gate.io', description: `Trade ${base}/${quote} on Gate.io` };
}
function cryptocom(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return { url: `https://crypto.com/exchange/trade/${base}_${quote}`, platform: 'Crypto.com', description: `Trade ${base}/${quote} on Crypto.com` };
}
function deribit(asset: string): DeepLinkResult {
  const { base } = normalizeSymbol(asset);
  return { url: `https://www.deribit.com/options/${base.toLowerCase()}`, platform: 'Deribit', description: `Trade ${base} options on Deribit` };
}

/* ---- Prediction markets ---- */

function polymarket(marketId?: string): DeepLinkResult {
  if (marketId) {
    return { url: `https://polymarket.com/event/${marketId}`, platform: 'Polymarket', description: 'View market on Polymarket' };
  }
  return { url: 'https://polymarket.com/markets', platform: 'Polymarket', description: 'Open Polymarket' };
}
function kalshi(ticker?: string): DeepLinkResult {
  if (ticker) {
    return { url: `https://kalshi.com/markets/${ticker}`, platform: 'Kalshi', description: 'View market on Kalshi' };
  }
  return { url: 'https://kalshi.com/markets', platform: 'Kalshi', description: 'Open Kalshi' };
}
function manifold(): DeepLinkResult {
  return { url: 'https://manifold.markets', platform: 'Manifold', description: 'Open Manifold' };
}

/* ---- Forex brokers ---- */

function forexBroker(platform: string, asset: string): DeepLinkResult {
  const pair = asset.replace(/[^A-Za-z]/g, '').toLowerCase();
  switch (key(platform)) {
    case 'oanda': return { url: `https://www.oanda.com/us-en/trading/markets/`, platform: 'OANDA', description: `Trade ${asset} on OANDA` };
    case 'fxcm': return { url: `https://www.fxcm.com/markets/forex/${pair}/`, platform: 'FXCM', description: `Trade ${asset} on FXCM` };
    case 'ibkr': return { url: `https://www.interactivebrokers.com/en/trading/forex.php`, platform: 'IBKR', description: `Trade ${asset} on Interactive Brokers` };
    case 'saxo': case 'saxobank': return { url: `https://www.home.saxo/en-gb/products/forex`, platform: 'Saxo Bank', description: `Trade ${asset} on Saxo Bank` };
    default: return { url: `https://www.tradingview.com/symbols/${pair.toUpperCase()}/`, platform, description: `View ${asset}` };
  }
}

/**
 * Build an external trade/market link.
 * @param marketId optional opportunity id ("poly:<slug>", "kalshi:<ticker>")
 *        used to deep-link the exact prediction market.
 */
export function getTradeLink(platform: string, asset: string, marketId?: string): DeepLinkResult {
  const { name, futures } = splitPlatform(platform);
  const k = key(name);

  // Prediction-market identifiers from the opportunity id.
  //   "poly:<slug>"            single-venue (legacy)
  //   "kalshi:<ticker>"        single-venue (legacy)
  //   "xpred:<slug>~<ticker>"  cross-venue: pick the leg by platform
  let polyId: string | undefined;
  let kalshiId: string | undefined;
  if (marketId) {
    if (marketId.startsWith('xpred:')) {
      const [s, tk] = marketId.slice(6).split('~');
      polyId = s || undefined;
      kalshiId = tk || undefined;
    } else if (marketId.startsWith('poly:')) {
      polyId = marketId.slice(5);
    } else if (marketId.startsWith('kalshi:')) {
      kalshiId = marketId.slice(7);
    }
  }

  switch (k) {
    case 'binance': case 'binancespot': return binance(asset, futures);
    case 'bybit': return bybit(asset, futures);
    case 'okx': return okx(asset, futures);
    case 'coinbase': return coinbase(asset);
    case 'kraken': return kraken(asset);
    case 'kucoin': return kucoin(asset);
    case 'gateio': case 'gate': return gate(asset);
    case 'cryptocom': case 'crypto': return cryptocom(asset);
    case 'deribit': return deribit(asset);
    case 'polymarket': return polymarket(polyId);
    case 'kalshi': return kalshi(kalshiId);
    case 'manifold': return manifold();
    case 'oanda': case 'fxcm': case 'ibkr': case 'saxo': case 'saxobank':
      return forexBroker(name, asset);
    default:
      // Never return "#" (that just reloads our own SPA). Send the user
      // somewhere useful instead.
      return {
        url: `https://www.tradingview.com/search/?query=${encodeURIComponent(asset)}`,
        platform: name,
        description: `Look up ${asset}`,
      };
  }
}

export function openTradeLink(platform: string, asset: string, marketId?: string): DeepLinkResult {
  const link = getTradeLink(platform, asset, marketId);
  window.open(link.url, '_blank', 'noopener,noreferrer');
  return link;
}
