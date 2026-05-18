import { useState, useEffect, useRef, useCallback } from 'react';
import { type ArbitrageOpportunity } from '../lib/types';
import { type PlatformConnection } from './useLiveData';

function serverOppToClient(s: any): ArbitrageOpportunity {
  return {
    id: s.id,
    type: s.type,
    asset: s.asset,
    assetShort: s.assetShort,
    buyPlatform: s.buyPlatform,
    sellPlatform: s.sellPlatform,
    buyPrice: s.buyPrice,
    sellPrice: s.sellPrice,
    rawSpread: s.rawSpread,
    netProfit: s.netProfit,
    netProfitDollar: s.netProfitDollar,
    confidence: s.confidence,
    liquidity: s.liquidity,
    buyFee: s.buyFee,
    sellFee: s.sellFee,
    slippageEst: s.slippageEst,
    detectedAt: new Date(s.detectedAt),
    aiInsight: s.aiInsight || '',
    aiRisk: s.aiRisk || null,
    aiReason: s.aiReason || null,
    aiConfidence: s.aiConfidence || null,
    aiAnalyzedAt: s.aiAnalyzedAt || null,
    aiRiskBreakdown: s.aiRiskBreakdown || null,
    algorithmicRisk: s.algorithmicRisk || 'MEDIUM',
    hasAiInsight: s.hasAiInsight || false,
    isAiAnalyzing: s.isAiAnalyzing || false,
    aiModel: s.aiModel || null,
    status: s.status,
    spreadHistory: s.spreadHistory || [],
  };
}

/**
 * Polls the REST live-data endpoint. This is the primary data path on
 * serverless/static hosting (Vercel) where the WebSocket can't run — it
 * still serves the real Bybit/OKX/Binance + Polymarket feed.
 */
export function useRestData(enabled: boolean) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [priceFlashes, setPriceFlashes] = useState<
    Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }>
  >({});
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const prev = useRef<Map<string, ArbitrageOpportunity>>(new Map());
  const known = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/opportunities');
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const opps: ArbitrageOpportunity[] = (data.opportunities || []).map(
        serverOppToClient,
      );

      const newIds = new Set<string>();
      opps.forEach((o) => {
        if (!known.current.has(o.id)) {
          newIds.add(o.id);
          known.current.add(o.id);
        }
      });

      const flashes: Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }> = {};
      opps.forEach((o) => {
        const p = prev.current.get(o.id);
        if (p) {
          if (o.buyPrice !== p.buyPrice)
            flashes[o.id] = { ...flashes[o.id], buy: o.buyPrice > p.buyPrice ? 'up' : 'down' };
          if (o.sellPrice !== p.sellPrice)
            flashes[o.id] = { ...flashes[o.id], sell: o.sellPrice > p.sellPrice ? 'up' : 'down' };
        }
      });

      const map = new Map<string, ArbitrageOpportunity>();
      opps.forEach((o) => map.set(o.id, o));
      prev.current = map;

      setOpportunities(opps);
      if (data.connections) setConnections(data.connections);
      setLoaded(true);
      setFailed(false);

      if (Object.keys(flashes).length > 0) {
        setPriceFlashes((p) => ({ ...p, ...flashes }));
        setTimeout(() => {
          setPriceFlashes((p) => {
            const n = { ...p };
            Object.keys(flashes).forEach((k) => delete n[k]);
            return n;
          });
        }, 700);
      }
      if (newIds.size > 0) {
        setNewRowIds((p) => {
          const n = new Set(p);
          newIds.forEach((id) => n.add(id));
          return n;
        });
        setTimeout(() => {
          setNewRowIds((p) => {
            const n = new Set(p);
            newIds.forEach((id) => n.delete(id));
            return n;
          });
        }, 1200);
      }
    } catch {
      setFailed(true);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    poll();
    const id = setInterval(poll, 3500);
    return () => clearInterval(id);
  }, [enabled, poll]);

  return { opportunities, connections, priceFlashes, newRowIds, loaded, failed };
}
