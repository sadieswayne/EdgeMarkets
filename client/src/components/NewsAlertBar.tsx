import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewsAlertData } from '../lib/types';

interface NewsAlertBarProps {
  alerts: NewsAlertData[];
}

export function NewsAlertBar({ alerts }: NewsAlertBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [fetchedAlerts, setFetchedAlerts] = useState<NewsAlertData[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/ai/news?limit=10');
        const data = await res.json();
        if (data.alerts?.length > 0) {
          setFetchedAlerts(data.alerts);
        }
      } catch {}
    };
    fetchNews();
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, []);

  const allAlerts = [...alerts, ...fetchedAlerts]
    .filter((a, i, arr) => arr.findIndex(b => b.id === a.id) === i)
    .sort((a, b) => b.analyzedAt - a.analyzedAt)
    .slice(0, 10);

  const relevantAlerts = allAlerts.filter(a => a.relevance === 'high' || a.relevance === 'critical');

  if (relevantAlerts.length === 0) return null;

  const urgencyColor = (relevance: string) => {
    if (relevance === 'critical') return 'var(--red)';
    if (relevance === 'high') return 'var(--amber)';
    return 'var(--text-tertiary)';
  };

  return (
    <div
      data-testid="news-alert-bar"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-primary)',
      }}
    >
      <button
        data-testid="button-toggle-news"
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-2 text-[11px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} style={{ color: urgencyColor(relevantAlerts[0]?.relevance) }} />
          <span className="font-medium truncate max-w-[400px]">
            {relevantAlerts[0]?.title}
          </span>
          <span
            className="uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full font-medium"
            style={{ color: urgencyColor(relevantAlerts[0]?.relevance), backgroundColor: relevantAlerts[0]?.relevance === 'critical' ? 'var(--red-dim)' : 'var(--amber-dim)' }}
          >
            {relevantAlerts[0]?.relevance}
          </span>
          {relevantAlerts.length > 1 && (
            <span style={{ color: 'var(--text-tertiary)' }}>
              +{relevantAlerts.length - 1} more
            </span>
          )}
        </div>
        {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-2 space-y-1.5"
              style={{ borderTop: '1px solid var(--border-primary)' }}
            >
              {relevantAlerts.map(alert => (
                <div
                  key={alert.id}
                  data-testid={`news-alert-${alert.id}`}
                  className="flex items-start justify-between gap-3 py-2 rounded-lg px-2 transition-colors duration-150"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: urgencyColor(alert.relevance) }}
                      />
                      <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>
                        {alert.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 ml-3.5">
                      <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                        {alert.source}
                      </span>
                      {alert.impact && (
                        <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
                          {alert.impact}
                        </span>
                      )}
                    </div>
                  </div>
                  {alert.url && (
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 transition-colors duration-150 rounded"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
