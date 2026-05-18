export interface DeepLinkResult {
  url: string;
  platform: string;
  description: string;
}

function normalizeSymbol(asset: string): { base: string; quote: string } {
  const clean = asset.replace(/[\/\-]/g, '/');
  const parts = clean.split('/');
  if (parts.length === 2) return { base: parts[0], quote: parts[1] };
  return { base: clean, quote: 'USDT' };
}

export function getBinanceTradeLink(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return {
    url: `https://www.binance.com/en/trade/${base}_${quote}`,
    platform: 'Binance',
    description: `Trade ${base}/${quote} on Binance`,
  };
}

export function getCoinbaseTradeLink(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return {
    url: `https://www.coinbase.com/advanced-trade/spot/${base}-${quote}`,
    platform: 'Coinbase',
    description: `Trade ${base}/${quote} on Coinbase`,
  };
}

export function getBybitTradeLink(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return {
    url: `https://www.bybit.com/trade/spot/${base}/${quote}`,
    platform: 'Bybit',
    description: `Trade ${base}/${quote} on Bybit`,
  };
}

export function getKrakenTradeLink(asset: string): DeepLinkResult {
  const { base, quote } = normalizeSymbol(asset);
  return {
    url: `https://pro.kraken.com/app/trade/${base.toLowerCase()}-${quote.toLowerCase()}`,
    platform: 'Kraken',
    description: `Trade ${base}/${quote} on Kraken`,
  };
}

export function getPolymarketLink(eventId?: string, asset?: string): DeepLinkResult {
  if (eventId) {
    return {
      url: `https://polymarket.com/event/${eventId}`,
      platform: 'Polymarket',
      description: `View event on Polymarket`,
    };
  }
  return {
    url: `https://polymarket.com`,
    platform: 'Polymarket',
    description: `Open Polymarket`,
  };
}

export function getKalshiLink(eventId?: string, asset?: string): DeepLinkResult {
  if (eventId) {
    return {
      url: `https://kalshi.com/markets/${eventId}`,
      platform: 'Kalshi',
      description: `View event on Kalshi`,
    };
  }
  return {
    url: `https://kalshi.com/markets`,
    platform: 'Kalshi',
    description: `Open Kalshi Markets`,
  };
}

function getForexBrokerLink(platform: string, asset: string): DeepLinkResult {
  const pair = asset.replace('/', '');
  const p = platform.toLowerCase().replace(/\s/g, '');
  switch (p) {
    case 'oanda':
      return { url: `https://www.oanda.com/us-en/trading/markets/forex/${pair.toLowerCase()}/`, platform: 'OANDA', description: `Trade ${asset} on OANDA` };
    case 'fxcm':
      return { url: `https://www.fxcm.com/markets/forex/${pair.toLowerCase()}/`, platform: 'FXCM', description: `Trade ${asset} on FXCM` };
    case 'ibkr':
      return { url: `https://www.interactivebrokers.com/en/trading/forex.php`, platform: 'IBKR', description: `Trade ${asset} on Interactive Brokers` };
    case 'saxo':
    case 'saxobank':
      return { url: `https://www.home.saxo/en-gb/products/forex`, platform: 'Saxo Bank', description: `Trade ${asset} on Saxo Bank` };
    default:
      return { url: '#', platform, description: `Open ${platform}` };
  }
}

function getDeribitLink(asset: string): DeepLinkResult {
  const parts = asset.match(/(\w+)\s+\$?([\d,]+)K?\s+(Call|Put|C|P)\s*(\d+\/\d+)?/i);
  if (parts) {
    return {
      url: `https://www.deribit.com/options/${parts[1].toLowerCase()}`,
      platform: 'Deribit',
      description: `Trade ${asset} on Deribit`,
    };
  }
  return { url: 'https://www.deribit.com/options', platform: 'Deribit', description: 'Open Deribit Options' };
}

function getOKXLink(asset: string): DeepLinkResult {
  const parts = asset.match(/(\w+)\s+\$?([\d,]+)K?\s+(Call|Put|C|P)\s*(\d+\/\d+)?/i);
  if (parts) {
    return {
      url: `https://www.okx.com/trade-options/${parts[1].toLowerCase()}-usd`,
      platform: 'OKX',
      description: `Trade ${asset} on OKX`,
    };
  }
  return { url: 'https://www.okx.com/trade-options', platform: 'OKX', description: 'Open OKX Options' };
}

export function getTradeLink(platform: string, asset: string, eventId?: string): DeepLinkResult {
  const p = platform.toLowerCase().replace(/\s/g, '');
  switch (p) {
    case 'binance': return getBinanceTradeLink(asset);
    case 'coinbase': return getCoinbaseTradeLink(asset);
    case 'bybit': return getBybitTradeLink(asset);
    case 'kraken': return getKrakenTradeLink(asset);
    case 'polymarket': return getPolymarketLink(eventId, asset);
    case 'kalshi': return getKalshiLink(eventId, asset);
    case 'oanda':
    case 'fxcm':
    case 'ibkr':
    case 'saxo':
    case 'saxobank':
      return getForexBrokerLink(platform, asset);
    case 'deribit':
      return getDeribitLink(asset);
    case 'okx':
      return getOKXLink(asset);
    default:
      return { url: '#', platform, description: `Open ${platform}` };
  }
}

export function openTradeLink(platform: string, asset: string, eventId?: string): DeepLinkResult {
  const link = getTradeLink(platform, asset, eventId);
  window.open(link.url, '_blank', 'noopener,noreferrer');
  return link;
}
