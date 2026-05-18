import { memo } from 'react';
import { X, Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WalletState, ExchangeBalance } from '../../hooks/useWalletState';
import { formatCurrency } from '../../lib/format';

interface PortfolioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  walletState: WalletState;
}

export const PortfolioPanel = memo(function PortfolioPanel({ isOpen, onClose, walletState }: PortfolioPanelProps) {
  const { solana, evm, exchanges, totalUsdValue } = walletState;

  const connectedPlatforms = Object.entries(exchanges)
    .filter(([, e]) => e.connected || e.hasApiKey)
    .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

  const walletPlatforms: string[] = [];
  if (solana.connected) walletPlatforms.push('Solana');
  if (evm.connected) walletPlatforms.push('EVM');

  const allPlatforms = [...walletPlatforms, ...connectedPlatforms];

  const arbPairs: string[] = [];
  for (let i = 0; i < allPlatforms.length; i++) {
    for (let j = i + 1; j < allPlatforms.length; j++) {
      arbPairs.push(`${allPlatforms[i]} / ${allPlatforms[j]}`);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-50 overflow-y-auto scrollbar-thin"
            style={{
              width: 380,
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border-primary)',
            }}
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Wallet size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Portfolio
                  </span>
                </div>
                <button
                  data-testid="button-close-portfolio"
                  onClick={onClose}
                  className="p-1"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                className="rounded-xl p-4 mb-5"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
              >
                <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  Total Portfolio Value
                </div>
                <div className="text-[28px] font-mono-nums font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(totalUsdValue)}
                </div>
                <div className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {allPlatforms.length} platform{allPlatforms.length !== 1 ? 's' : ''} connected
                </div>
              </div>

              {solana.connected && (
                <PlatformSection
                  name="Solana Wallet"
                  address={solana.address}
                  balances={solana.balance !== null ? [
                    { asset: 'SOL', free: solana.balance, locked: 0, total: solana.balance, usdValue: solana.balance * 150 },
                  ] : []}
                />
              )}

              {evm.connected && (
                <PlatformSection
                  name="EVM Wallet"
                  address={evm.address}
                  balances={evm.balance !== null ? [
                    { asset: 'ETH', free: evm.balance, locked: 0, total: evm.balance, usdValue: evm.balance * 3000 },
                  ] : []}
                />
              )}

              {Object.entries(exchanges).map(([platform, state]) => {
                if (!state.connected && !state.hasApiKey) return null;
                return (
                  <PlatformSection
                    key={platform}
                    name={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    balances={state.balances}
                    loading={state.loading}
                    error={state.error}
                    lastUpdated={state.lastUpdated}
                  />
                );
              })}

              {!walletState.anyConnected && (
                <div
                  className="text-center py-8 text-[13px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Connect wallets or exchanges to see your portfolio
                </div>
              )}

              {arbPairs.length > 0 && (
                <div className="mt-5" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Available for Arb
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {arbPairs.map(pair => (
                      <div
                        key={pair}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green)' }} />
                        {pair}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

function PlatformSection({
  name, address, balances, loading, error, lastUpdated,
}: {
  name: string;
  address?: string | null;
  balances: ExchangeBalance[];
  loading?: boolean;
  error?: string | null;
  lastUpdated?: number | null;
}) {
  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const totalValue = balances.reduce((s, b) => s + b.usdValue, 0);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green)' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{name}</span>
          {address && (
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {truncate(address)}
            </span>
          )}
        </div>
        <span className="text-[12px] font-mono-nums" style={{ color: 'var(--text-secondary)' }}>
          {formatCurrency(totalValue)}
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          <RefreshCw size={11} className="animate-spin" /> Loading balances...
        </div>
      )}

      {error && (
        <div className="py-1 text-[11px]" style={{ color: 'var(--red)' }}>{error}</div>
      )}

      {balances.length > 0 && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
        >
          {balances.filter(b => b.total > 0).map(b => (
            <div
              key={b.asset}
              className="flex items-center justify-between px-3 py-2 text-[11px]"
              style={{ borderBottom: '1px solid var(--border-primary)' }}
            >
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.asset}</span>
                <span className="ml-2 font-mono-nums" style={{ color: 'var(--text-tertiary)' }}>
                  {b.total.toFixed(b.total < 1 ? 6 : 4)}
                </span>
              </div>
              <span className="font-mono-nums" style={{ color: 'var(--text-secondary)' }}>
                {formatCurrency(b.usdValue)}
              </span>
            </div>
          ))}
        </div>
      )}

      {lastUpdated && (
        <div className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Updated {Math.floor((Date.now() - lastUpdated) / 1000)}s ago
        </div>
      )}
    </div>
  );
}
