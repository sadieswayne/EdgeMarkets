import { useState, useEffect, useRef, useCallback } from 'react';
import { type ArbitrageOpportunity, type AIStatusData, type NewsAlertData } from '../lib/types';

export interface PlatformConnection {
  platform: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  pairsCount: number;
  lastUpdate: number;
  error?: string;
}

interface WSMessage {
  type: 'snapshot' | 'update' | 'remove' | 'status' | 'heartbeat' | 'bot_update'
    | 'ai_insight_update' | 'ai_risk_update' | 'ai_chat_stream' | 'ai_news_alert'
    | 'ai_status' | 'ai_bot_guard_result';
  opportunities?: any[];
  updates?: any[];
  removedIds?: string[];
  connections?: PlatformConnection[];
  stats?: {
    totalOpportunities: number;
    avgSpread: number;
    bestOpportunity: number;
    totalVolume: number;
  };
  aiInsightUpdate?: {
    opportunityId: string;
    insight: string;
    risk: string;
    confidence: number;
    reason: string;
    model?: string;
    analyzedAt: number;
  };
  aiRiskUpdate?: {
    opportunityId: string;
    riskBreakdown: any;
  };
  aiNewsAlert?: NewsAlertData;
  aiStatus?: AIStatusData;
  timestamp: number;
}

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

export function useLiveData(skip = false) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [priceFlashes, setPriceFlashes] = useState<Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }>>({});
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  const [newsAlerts, setNewsAlerts] = useState<NewsAlertData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOpps = useRef<Map<string, ArbitrageOpportunity>>(new Map());
  const knownIds = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          handleMessage(msg);
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, []);

  const handleMessage = useCallback((msg: WSMessage) => {
    if (msg.connections) {
      setConnections(msg.connections);
    }

    if (msg.type === 'snapshot' && msg.opportunities) {
      const clientOpps = msg.opportunities.map(serverOppToClient);

      const newIds = new Set<string>();
      clientOpps.forEach(opp => {
        if (!knownIds.current.has(opp.id)) {
          newIds.add(opp.id);
          knownIds.current.add(opp.id);
        }
      });

      const removedIds = new Set<string>();
      prevOpps.current.forEach((_, id) => {
        if (!clientOpps.find(o => o.id === id)) {
          removedIds.add(id);
          knownIds.current.delete(id);
        }
      });

      const flashes: Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }> = {};
      clientOpps.forEach(opp => {
        const prev = prevOpps.current.get(opp.id);
        if (prev) {
          if (opp.buyPrice !== prev.buyPrice) {
            flashes[opp.id] = { ...flashes[opp.id], buy: opp.buyPrice > prev.buyPrice ? 'up' : 'down' };
          }
          if (opp.sellPrice !== prev.sellPrice) {
            flashes[opp.id] = { ...flashes[opp.id], sell: opp.sellPrice > prev.sellPrice ? 'up' : 'down' };
          }
        }
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

      if (newIds.size > 0) {
        setNewRowIds(prev => {
          const next = new Set(prev);
          newIds.forEach(id => next.add(id));
          return next;
        });
        setTimeout(() => {
          setNewRowIds(prev => {
            const next = new Set(prev);
            newIds.forEach(id => next.delete(id));
            return next;
          });
        }, 1200);
      }

      const oppMap = new Map<string, ArbitrageOpportunity>();
      clientOpps.forEach(o => oppMap.set(o.id, o));
      prevOpps.current = oppMap;

      setOpportunities(clientOpps);
    }

    if (msg.type === 'update' && msg.updates) {
      const updates = msg.updates.map(serverOppToClient);
      const updateMap = new Map<string, ArbitrageOpportunity>();
      updates.forEach(u => updateMap.set(u.id, u));

      const flashes: Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }> = {};
      updates.forEach(opp => {
        const prev = prevOpps.current.get(opp.id);
        if (prev) {
          if (opp.buyPrice !== prev.buyPrice) {
            flashes[opp.id] = { ...flashes[opp.id], buy: opp.buyPrice > prev.buyPrice ? 'up' : 'down' };
          }
          if (opp.sellPrice !== prev.sellPrice) {
            flashes[opp.id] = { ...flashes[opp.id], sell: opp.sellPrice > prev.sellPrice ? 'up' : 'down' };
          }
        }
        prevOpps.current.set(opp.id, opp);
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

      setOpportunities(prev => prev.map(o => updateMap.has(o.id) ? updateMap.get(o.id)! : o));
    }

    if (msg.type === 'remove' && msg.removedIds) {
      const removeSet = new Set(msg.removedIds);
      removeSet.forEach(id => {
        prevOpps.current.delete(id);
        knownIds.current.delete(id);
      });
      setOpportunities(prev => prev.filter(o => !removeSet.has(o.id)));
    }

    if (msg.type === 'ai_insight_update' && msg.aiInsightUpdate) {
      const update = msg.aiInsightUpdate;
      setOpportunities(prev => prev.map(o => {
        if (o.id !== update.opportunityId) return o;
        return {
          ...o,
          aiInsight: update.insight,
          aiRisk: update.risk as any,
          aiConfidence: update.confidence as any,
          aiReason: update.reason,
          aiModel: update.model || null,
          aiAnalyzedAt: update.analyzedAt,
          hasAiInsight: true,
          isAiAnalyzing: false,
        };
      }));
    }

    if (msg.type === 'ai_risk_update' && msg.aiRiskUpdate) {
      const update = msg.aiRiskUpdate;
      setOpportunities(prev => prev.map(o => {
        if (o.id !== update.opportunityId) return o;
        return { ...o, aiRiskBreakdown: update.riskBreakdown };
      }));
    }

    if (msg.type === 'ai_news_alert' && msg.aiNewsAlert) {
      setNewsAlerts(prev => [msg.aiNewsAlert!, ...prev].slice(0, 20));
    }
  }, []);

  useEffect(() => {
    if (skip) return;
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect, skip]);

  return { opportunities, connections, isConnected, priceFlashes, newRowIds, newsAlerts };
}
