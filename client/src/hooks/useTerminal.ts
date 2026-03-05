import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { type ArbitrageOpportunity, type FilterState, type LiveStats, type NewsAlertData } from '../lib/types';
import { generateInitialData, generateNewOpportunity, tickPrices } from '../lib/mockGenerator';
import { useLiveData, type PlatformConnection } from './useLiveData';

function useMockMode(): boolean {
  const [isMock, setIsMock] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsMock(params.get('mock') === 'true');
  }, []);
  return isMock;
}

function useMockData() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [priceFlashes, setPriceFlashes] = useState<Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }>>({});
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    const data = generateInitialData();
    setOpportunities(data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const addInterval = setInterval(() => {
      const newOpp = generateNewOpportunity();
      setOpportunities(prev => {
        const updated = [newOpp, ...prev];
        if (updated.length > 50) return updated.slice(0, 45);
        return updated;
      });
      setNewRowIds(prev => {
        const next = new Set(prev);
        next.add(newOpp.id);
        return next;
      });
      setTimeout(() => {
        setNewRowIds(prev => {
          const next = new Set(prev);
          next.delete(newOpp.id);
          return next;
        });
      }, 1200);
    }, 3000 + Math.random() * 5000);

    const tickInterval = setInterval(() => {
      setOpportunities(prev => {
        const indices = new Set<number>();
        const count = Math.min(3, prev.length);
        while (indices.size < count && indices.size < prev.length) {
          indices.add(Math.floor(Math.random() * prev.length));
        }

        const flashes: Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }> = {};
        const updated = prev.map((opp, i) => {
          if (indices.has(i) && opp.status === 'active') {
            const result = tickPrices(opp);
            if (result.buyChanged || result.sellChanged) {
              flashes[opp.id] = { buy: result.buyChanged ?? undefined, sell: result.sellChanged ?? undefined };
            }
            return result.opp;
          }
          return opp;
        });

        if (Object.keys(flashes).length > 0) {
          setPriceFlashes(prev => ({ ...prev, ...flashes }));
          setTimeout(() => {
            setPriceFlashes(prev => {
              const next = { ...prev };
              Object.keys(flashes).forEach(k => delete next[k]);
              return next;
            });
          }, 700);
        }

        return updated;
      });
    }, 1500);

    const expireInterval = setInterval(() => {
      setOpportunities(prev => {
        const activeOnes = prev.filter(o => o.status === 'active');
        if (activeOnes.length <= 15) return prev;
        const toExpire = activeOnes[activeOnes.length - 1];
        return prev.map(o =>
          o.id === toExpire.id ? { ...o, status: 'expiring' as const } : o
        );
      });

      setTimeout(() => {
        setOpportunities(prev => prev.filter(o => o.status !== 'expiring'));
      }, 2000);
    }, 15000 + Math.random() * 15000);

    intervalsRef.current = [addInterval, tickInterval, expireInterval];

    return () => {
      intervalsRef.current.forEach(clearInterval);
    };
  }, [loaded]);

  return { opportunities, priceFlashes, newRowIds, loaded };
}

export function useTerminal() {
  const isMock = useMockMode();

  const mock = useMockData();
  const live = useLiveData(isMock);

  const mockConnections: PlatformConnection[] = useMemo(() => [
    { platform: 'Binance', status: 'connected', pairsCount: 12, lastUpdate: Date.now() },
    { platform: 'Coinbase', status: 'connected', pairsCount: 10, lastUpdate: Date.now() },
    { platform: 'Bybit', status: 'connected', pairsCount: 8, lastUpdate: Date.now() },
    { platform: 'Kraken', status: 'connected', pairsCount: 6, lastUpdate: Date.now() },
    { platform: 'Polymarket', status: 'connected', pairsCount: 24, lastUpdate: Date.now() },
    { platform: 'Kalshi', status: 'connected', pairsCount: 18, lastUpdate: Date.now() },
    { platform: 'OANDA', status: 'connected', pairsCount: 12, lastUpdate: Date.now() },
    { platform: 'FXCM', status: 'connected', pairsCount: 12, lastUpdate: Date.now() },
    { platform: 'IBKR', status: 'connected', pairsCount: 12, lastUpdate: Date.now() },
    { platform: 'Saxo Bank', status: 'connected', pairsCount: 12, lastUpdate: Date.now() },
    { platform: 'Deribit', status: 'connected', pairsCount: 16, lastUpdate: Date.now() },
    { platform: 'OKX', status: 'connected', pairsCount: 14, lastUpdate: Date.now() },
  ], []);

  const mockNewsAlerts: NewsAlertData[] = useMemo(() => [
    {
      id: 'news-1', title: 'Bitcoin Surges Past $98K as Institutional Demand Accelerates',
      source: 'CoinDesk', url: '#', publishedAt: Date.now() - 300000,
      relevance: 'high', impact: 'BTC spot spreads widening across exchanges — arbitrage windows expanding',
      affectedAssets: ['BTC/USDT'], affectedMarkets: ['Binance', 'Coinbase', 'Bybit'], analyzedAt: Date.now() - 280000,
    },
    {
      id: 'news-2', title: 'Fed Signals Potential Rate Cut in June Meeting Minutes',
      source: 'Reuters', url: '#', publishedAt: Date.now() - 1800000,
      relevance: 'critical', impact: 'Prediction market odds shifting rapidly — cross-platform pricing gaps detected',
      affectedAssets: ['Fed rate cut by June 2026'], affectedMarkets: ['Kalshi', 'Polymarket'], analyzedAt: Date.now() - 1750000,
    },
    {
      id: 'news-3', title: 'Ethereum Options Volume Hits All-Time High on Deribit',
      source: 'The Block', url: '#', publishedAt: Date.now() - 3600000,
      relevance: 'medium', impact: 'IV differentials between Deribit and OKX expanding — options arb opportunities increasing',
      affectedAssets: ['ETH/USDT'], affectedMarkets: ['Deribit', 'OKX'], analyzedAt: Date.now() - 3500000,
    },
  ], []);

  const dataSource = isMock ? {
    opportunities: mock.opportunities,
    priceFlashes: mock.priceFlashes,
    newRowIds: mock.newRowIds,
    connections: mockConnections,
    isConnected: true,
    newsAlerts: mockNewsAlerts,
  } : {
    opportunities: live.opportunities,
    priceFlashes: live.priceFlashes,
    newRowIds: live.newRowIds,
    connections: live.connections,
    isConnected: live.isConnected,
    newsAlerts: live.newsAlerts,
  };

  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    minSpread: 0,
    minProfit: 0,
    platforms: [],
    liquidity: 'Any',
    timeSensitivity: 'All',
    sort: 'diverse',
  });

  const [activeTab, setActiveTab] = useState<'explorer' | 'autopilot' | 'docs'>('explorer');
  const [walletConnected, setWalletConnected] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredOpportunities = useMemo(() => {
    let result = dataSource.opportunities.filter(o => o.status !== 'expired');

    if (filters.category !== 'all') {
      result = result.filter(o => o.type === filters.category);
    }
    if (filters.minSpread > 0) {
      result = result.filter(o => o.rawSpread >= filters.minSpread);
    }
    if (filters.minProfit > 0) {
      result = result.filter(o => o.netProfitDollar >= filters.minProfit);
    }
    if (filters.platforms.length > 0) {
      result = result.filter(o =>
        filters.platforms.some(p =>
          o.buyPlatform.toLowerCase().includes(p.toLowerCase()) ||
          o.sellPlatform.toLowerCase().includes(p.toLowerCase())
        )
      );
    }
    if (filters.liquidity !== 'Any') {
      const minLiq = filters.liquidity === '$1K+' ? 1000 : filters.liquidity === '$10K+' ? 10000 : 100000;
      result = result.filter(o => o.liquidity >= minLiq);
    }
    if (filters.timeSensitivity !== 'All') {
      const maxAge = filters.timeSensitivity === '< 1 min' ? 60000 :
        filters.timeSensitivity === '< 5 min' ? 300000 : 3600000;
      result = result.filter(o => Date.now() - o.detectedAt.getTime() < maxAge);
    }

    switch (filters.sort) {
      case 'diverse': {
        const categories: string[] = ['crypto_spot', 'prediction', 'forex', 'options', 'futures_basis'];
        const buckets: Record<string, typeof result> = {};
        for (const cat of categories) buckets[cat] = [];
        for (const opp of result) {
          if (buckets[opp.type]) buckets[opp.type].push(opp);
        }
        for (const cat of categories) {
          buckets[cat].sort((a, b) => b.netProfit - a.netProfit);
        }
        const interleaved: typeof result = [];
        let added = true;
        let round = 0;
        while (added) {
          added = false;
          for (const cat of categories) {
            if (round < buckets[cat].length) {
              interleaved.push(buckets[cat][round]);
              added = true;
            }
          }
          round++;
        }
        result = interleaved;
        break;
      }
      case 'profit': result.sort((a, b) => b.netProfit - a.netProfit); break;
      case 'newest': result.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime()); break;
      case 'spread': result.sort((a, b) => b.rawSpread - a.rawSpread); break;
      case 'liquidity': result.sort((a, b) => b.liquidity - a.liquidity); break;
    }

    return result;
  }, [dataSource.opportunities, filters]);

  const liveStats: LiveStats = useMemo(() => {
    const active = dataSource.opportunities.filter(o => o.status === 'active');
    return {
      totalOpportunities: active.length,
      avgSpread: active.length > 0 ? parseFloat((active.reduce((s, o) => s + o.rawSpread, 0) / active.length).toFixed(1)) : 0,
      bestOpportunity: active.length > 0 ? Math.max(...active.map(o => o.rawSpread)) : 0,
      totalVolume: active.reduce((s, o) => s + o.liquidity, 0),
    };
  }, [dataSource.opportunities]);

  const categoryCounts = useMemo(() => {
    const active = dataSource.opportunities.filter(o => o.status !== 'expired');
    return {
      all: active.length,
      prediction: active.filter(o => o.type === 'prediction').length,
      crypto_spot: active.filter(o => o.type === 'crypto_spot').length,
      futures_basis: active.filter(o => o.type === 'futures_basis').length,
      forex: active.filter(o => o.type === 'forex').length,
      options: active.filter(o => o.type === 'options').length,
    };
  }, [dataSource.opportunities]);

  const toggleWallet = useCallback(() => setWalletConnected(p => !p), []);

  return {
    opportunities: filteredOpportunities,
    allOpportunities: dataSource.opportunities,
    priceFlashes: dataSource.priceFlashes,
    newRowIds: dataSource.newRowIds,
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    walletConnected,
    toggleWallet,
    expandedRow,
    setExpandedRow,
    liveStats,
    categoryCounts,
    connections: dataSource.connections,
    isConnected: dataSource.isConnected,
    isMock,
    newsAlerts: dataSource.newsAlerts,
  };
}
