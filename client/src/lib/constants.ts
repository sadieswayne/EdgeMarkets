import { type OpportunityType } from './types';

export const CATEGORIES: { id: OpportunityType | 'all'; label: string; iconName: string; }[] = [
  { id: 'all', label: 'All', iconName: 'Layers' },
  { id: 'prediction', label: 'Prediction Markets', iconName: 'TrendingUp' },
  { id: 'crypto_spot', label: 'Crypto Spot', iconName: 'Bitcoin' },
  { id: 'futures_basis', label: 'Futures / Basis', iconName: 'BarChart3' },
  { id: 'forex', label: 'Forex', iconName: 'ArrowLeftRight' },
  { id: 'options', label: 'Options', iconName: 'Zap' },
];

export const PLATFORMS = ['Polymarket', 'Kalshi', 'Binance', 'Coinbase', 'Bybit', 'Kraken', 'OANDA', 'FXCM', 'IBKR', 'Saxo Bank', 'KuCoin', 'Deribit', 'OKX', 'Manifold'];

export const SORT_OPTIONS = [
  { value: 'diverse', label: 'Diverse' },
  { value: 'profit', label: 'Profit %' },
  { value: 'newest', label: 'Newest' },
  { value: 'spread', label: 'Spread %' },
  { value: 'liquidity', label: 'Liquidity' },
];

export const LIQUIDITY_OPTIONS = ['Any', '$1K+', '$10K+', '$100K+'];
export const TIME_OPTIONS = ['All', '< 1 min', '< 5 min', '< 1 hour'];

export const CATEGORY_COLORS: Record<OpportunityType, string> = {
  prediction: '#A78BFA',
  crypto_spot: '#F59E0B',
  futures_basis: '#3B82F6',
  forex: '#10B981',
  options: '#EF4444',
};
