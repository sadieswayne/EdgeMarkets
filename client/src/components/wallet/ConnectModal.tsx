import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ArrowRight, Wallet, Shield, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { storeApiKey, retrieveApiKey, deleteApiKey } from '../../lib/keyVault';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchanges: Record<string, { connected: boolean; hasApiKey: boolean }>;
  onExchangeKeySubmit: (platform: string, apiKey: string, apiSecret: string, passphrase?: string) => void;
  onExchangeDisconnect: (platform: string) => void;
}

type ModalView = 'main' | 'apikey';

const SOLANA_WALLETS = [
  { name: 'Phantom' },
  { name: 'Solflare' },
];

const EVM_WALLETS_MAP: Record<string, string> = {
  'MetaMask': 'metamask',
  'Coinbase Wallet': 'coinbase',
  'Injected': 'injected',
};

const EXCHANGE_LIST = [
  { id: 'binance', name: 'Binance' },
  { id: 'coinbase', name: 'Coinbase' },
  { id: 'bybit', name: 'Bybit' },
  { id: 'kraken', name: 'Kraken' },
];

export function ConnectModal({ isOpen, onClose, exchanges, onExchangeKeySubmit, onExchangeDisconnect }: ConnectModalProps) {
  const [view, setView] = useState<ModalView>('main');
  const [selectedExchange, setSelectedExchange] = useState('');

  const { wallets: solWallets, select: solSelect, connected: solConnected, publicKey, disconnect: solDisconnect, wallet: currentSolWallet } = useWallet();
  const { connectors, connectAsync } = useConnect();
  const { isConnected: evmConnected, address: evmAddress, connector: activeConnector } = useAccount();
  const { disconnect: evmDisconnect } = useDisconnect();

  useEffect(() => {
    if (!isOpen) {
      setView('main');
      setSelectedExchange('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSolConnect = useCallback(async (walletName: string) => {
    const adapter = solWallets.find(w => w.adapter.name === walletName);
    if (adapter) {
      try {
        solSelect(adapter.adapter.name);
      } catch (err) {
        console.error('Solana connect error:', err);
      }
    }
  }, [solWallets, solSelect]);

  const handleEvmConnect = useCallback(async (connector: any) => {
    try {
      await connectAsync({ connector });
    } catch (err) {
      console.error('EVM connect error:', err);
    }
  }, [connectAsync]);

  const truncateAddr = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-[480px] max-h-[85vh] overflow-y-auto scrollbar-thin rounded-2xl"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {view === 'main' ? (
            <MainView
              onClose={onClose}
              solConnected={solConnected}
              solAddress={publicKey?.toBase58() || null}
              solWalletName={currentSolWallet?.adapter.name || null}
              onSolConnect={handleSolConnect}
              onSolDisconnect={solDisconnect}
              evmConnected={evmConnected}
              evmAddress={evmAddress || null}
              evmConnectorName={activeConnector?.name || null}
              evmConnectors={connectors}
              onEvmConnect={handleEvmConnect}
              onEvmDisconnect={evmDisconnect}
              exchanges={exchanges}
              onAddApiKey={(id) => { setSelectedExchange(id); setView('apikey'); }}
              onExchangeDisconnect={onExchangeDisconnect}
              truncateAddr={truncateAddr}
            />
          ) : (
            <ApiKeyView
              platform={selectedExchange}
              onBack={() => setView('main')}
              onClose={onClose}
              onSubmit={onExchangeKeySubmit}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MainView({
  onClose, solConnected, solAddress, solWalletName, onSolConnect, onSolDisconnect,
  evmConnected, evmAddress, evmConnectorName, evmConnectors, onEvmConnect, onEvmDisconnect,
  exchanges, onAddApiKey, onExchangeDisconnect, truncateAddr,
}: {
  onClose: () => void;
  solConnected: boolean;
  solAddress: string | null;
  solWalletName: string | null;
  onSolConnect: (name: string) => void;
  onSolDisconnect: () => void;
  evmConnected: boolean;
  evmAddress: string | null;
  evmConnectorName: string | null;
  evmConnectors: any[];
  onEvmConnect: (connector: any) => void;
  onEvmDisconnect: () => void;
  exchanges: Record<string, { connected: boolean; hasApiKey: boolean }>;
  onAddApiKey: (id: string) => void;
  onExchangeDisconnect: (platform: string) => void;
  truncateAddr: (addr: string) => string;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[15px] font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
          CONNECT TO EDGE
        </span>
        <button
          data-testid="button-close-modal"
          onClick={onClose}
          className="p-1 transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <X size={18} />
        </button>
      </div>

      <SectionHeader label="SOLANA WALLETS" />
      <div className="flex flex-col gap-2 mb-5">
        {SOLANA_WALLETS.map(w => {
          const isThis = solConnected && solWalletName === w.name;
          return (
            <WalletRow
              key={w.name}
              name={w.name}
              connected={isThis}
              address={isThis ? solAddress : null}
              onConnect={() => onSolConnect(w.name)}
              onDisconnect={onSolDisconnect}
              truncateAddr={truncateAddr}
            />
          );
        })}
      </div>

      <SectionHeader label="EVM WALLETS" />
      <div className="flex flex-col gap-2 mb-5">
        {evmConnectors.filter(c => c.name !== 'Injected').map(connector => {
          const isThis = evmConnected && evmConnectorName === connector.name;
          return (
            <WalletRow
              key={connector.uid}
              name={connector.name}
              connected={isThis}
              address={isThis && evmAddress ? evmAddress : null}
              onConnect={() => onEvmConnect(connector)}
              onDisconnect={onEvmDisconnect}
              truncateAddr={truncateAddr}
            />
          );
        })}
      </div>

      <SectionHeader label="EXCHANGE ACCOUNTS" />
      <div className="flex flex-col gap-2 mb-5">
        {EXCHANGE_LIST.map(ex => {
          const state = exchanges[ex.id];
          const isConnected = state?.connected || state?.hasApiKey;
          return (
            <div
              key={ex.id}
              data-testid={`exchange-row-${ex.id}`}
              className="flex items-center justify-between px-4 rounded-lg transition-colors"
              style={{
                height: 52,
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div className="flex items-center gap-3">
                <Wallet size={18} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{ex.name}</span>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green)' }} />
                    <span className="text-[11px] font-mono" style={{ color: 'var(--green)' }}>Connected</span>
                  </div>
                  <button
                    onClick={() => onExchangeDisconnect(ex.id)}
                    className="text-[11px] transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  data-testid={`button-add-apikey-${ex.id}`}
                  onClick={() => onAddApiKey(ex.id)}
                  className="flex items-center gap-1.5 text-[12px] transition-colors"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Add API Key <ArrowRight size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="flex items-start gap-2 pt-4 text-[11px] leading-relaxed"
        style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}
      >
        <Shield size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
        <span>
          Edge never has custody of your funds. Wallet connections are read-only.
          API keys are encrypted and stored locally in your browser.
        </span>
      </div>
    </div>
  );
}

function ApiKeyView({
  platform, onBack, onClose, onSubmit,
}: {
  platform: string;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (platform: string, apiKey: string, apiSecret: string, passphrase?: string) => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsPassphrase = platform === 'coinbase';
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  const handleSubmit = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setError('API Key and Secret are required');
      return;
    }
    if (apiKey.trim().length < 10) {
      setError('API Key seems too short');
      return;
    }
    setLoading(true);
    setError('');

    storeApiKey(platform, {
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      passphrase: passphrase.trim() || undefined,
    });

    onSubmit(platform, apiKey.trim(), apiSecret.trim(), passphrase.trim() || undefined);
    setLoading(false);
    onBack();
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[12px] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <span className="text-[15px] font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
            ADD {platformName.toUpperCase()} API KEY
          </span>
        </div>
        <button onClick={onClose} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <div>
          <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
            API Key
          </label>
          <input
            data-testid="input-api-key"
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Paste your API key here..."
            className="w-full px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-primary)'; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-primary)'; }}
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
            API Secret
          </label>
          <div className="relative">
            <input
              data-testid="input-api-secret"
              type={showSecret ? 'text' : 'password'}
              value={apiSecret}
              onChange={e => setApiSecret(e.target.value)}
              placeholder="Paste your API secret..."
              className="w-full px-3 py-2.5 pr-10 rounded-lg font-mono text-[13px] outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-primary)'; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-primary)'; }}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {needsPassphrase && (
          <div>
            <label className="text-[11px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
              Passphrase
            </label>
            <input
              data-testid="input-passphrase"
              type="password"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              placeholder="API passphrase (if required)"
              className="w-full px-3 py-2.5 rounded-lg font-mono text-[13px] outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}
      </div>

      <div
        className="mb-4 p-3 rounded-lg text-[11px] leading-relaxed"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}
      >
        <div className="font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Recommended permissions:</div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <CheckCircle size={11} style={{ color: 'var(--green)' }} />
          <span>Read account balance</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <CheckCircle size={11} style={{ color: 'var(--green)' }} />
          <span>Read open orders</span>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <X size={11} style={{ color: 'var(--red)' }} />
          <span>Trade (not needed for Phase 3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <X size={11} style={{ color: 'var(--red)' }} />
          <span>Withdraw (NEVER enable this)</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-3 text-[12px]" style={{ color: 'var(--red)' }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <button
        data-testid="button-save-apikey"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-lg text-[13px] font-medium text-white transition-all flex items-center justify-center gap-2"
        style={{ backgroundColor: 'var(--accent-primary)', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Save & Verify Connection
      </button>

      <div
        className="flex items-start gap-2 mt-4 text-[10px] leading-relaxed"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Shield size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
        <span>
          Your keys are encrypted and stored only in your browser's local storage.
          Edge servers never see your keys. They are used solely to fetch your balances
          and, in future phases, to execute trades you explicitly approve.
        </span>
      </div>
    </div>
  );
}

function WalletRow({
  name, connected, address, onConnect, onDisconnect, truncateAddr,
}: {
  name: string;
  connected: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  truncateAddr: (addr: string) => string;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 rounded-lg transition-colors"
      style={{
        height: 52,
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center gap-3">
        <Wallet size={18} style={{ color: 'var(--text-secondary)' }} />
        <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{name}</span>
      </div>
      {connected && address ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green)' }} />
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              {truncateAddr(address)}
            </span>
          </div>
          <button
            onClick={onDisconnect}
            className="text-[11px] transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="flex items-center gap-1.5 text-[12px] transition-colors"
          style={{ color: 'var(--accent-primary)' }}
        >
          Connect <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      className="text-[10px] uppercase tracking-[0.12em] mb-2"
      style={{ color: 'var(--text-tertiary)' }}
    >
      {label}
    </div>
  );
}
