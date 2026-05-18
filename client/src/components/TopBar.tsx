import { Wallet, Settings, Zap, Menu, ChevronDown } from 'lucide-react';
import type { WalletState } from '../hooks/useWalletState';
import { AIStatusIndicator } from './AIStatusIndicator';

interface TopBarProps {
  activeTab: 'explorer' | 'autopilot' | 'docs';
  onTabChange: (tab: 'explorer' | 'autopilot' | 'docs') => void;
  walletState: WalletState;
  onConnectClick: () => void;
  onPortfolioClick: () => void;
  onAIChatOpen: () => void;
  showHamburger?: boolean;
  onToggleSidebar?: () => void;
  isConnected?: boolean;
  isMock?: boolean;
}

export function TopBar({
  activeTab, onTabChange, walletState, onConnectClick, onPortfolioClick, onAIChatOpen,
  showHamburger, onToggleSidebar, isConnected = true, isMock = false,
}: TopBarProps) {
  const statusColor = isMock ? 'var(--amber)' : isConnected ? 'var(--green)' : 'var(--red)';
  const statusText = isMock ? 'MOCK' : isConnected ? 'LIVE' : 'RECONNECTING';

  const { solana, evm, exchanges } = walletState;
  const anyWalletConnected = solana.connected || evm.connected;
  const exchangeCount = Object.values(exchanges).filter(e => e.connected || e.hasApiKey).length;
  const hasAnyConnection = anyWalletConnected || exchangeCount > 0;

  const truncate = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <header
      data-testid="top-bar"
      className="flex items-center justify-between px-5 flex-shrink-0"
      style={{
        height: 56,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center gap-2.5">
        {showHamburger && (
          <button
            data-testid="button-hamburger"
            onClick={onToggleSidebar}
            className="p-1.5 mr-1 rounded-lg transition-colors duration-150"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <Menu size={18} />
          </button>
        )}
        <img src="/logo.png" alt="EDGE Logo" className="w-5 h-5 object-contain" />
        <div className="flex flex-col">
          <span
            className="text-[18px] font-bold tracking-wide leading-none"
            style={{ color: 'var(--text-primary)' }}
          >
            EDGE
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.15em] leading-none mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Arbitrage Terminal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <button
          data-testid="tab-explorer"
          onClick={() => onTabChange('explorer')}
          className="px-5 py-1.5 text-[12px] font-medium tracking-wide transition-all duration-200 rounded-lg"
          style={{
            color: activeTab === 'explorer' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            backgroundColor: activeTab === 'explorer' ? 'var(--bg-hover)' : 'transparent',
          }}
        >
          Explorer
        </button>
        <button
          data-testid="tab-autopilot"
          onClick={() => onTabChange('autopilot')}
          className="px-5 py-1.5 text-[12px] font-medium tracking-wide transition-all duration-200 rounded-lg"
          style={{
            color: activeTab === 'autopilot' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            backgroundColor: activeTab === 'autopilot' ? 'var(--bg-hover)' : 'transparent',
          }}
        >
          Autopilot
        </button>
        <button
          data-testid="tab-docs"
          onClick={() => onTabChange('docs')}
          className="px-5 py-1.5 text-[12px] font-medium tracking-wide transition-all duration-200 rounded-lg"
          style={{
            color: activeTab === 'docs' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            backgroundColor: activeTab === 'docs' ? 'var(--bg-hover)' : 'transparent',
          }}
        >
          Docs
        </button>
      </div>

      <div className="flex items-center gap-3">
        <AIStatusIndicator onChatOpen={onAIChatOpen} />

        <a
          href="https://x.com/EdgeMarketsX"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-2.5 py-1.5 transition-all duration-150 rounded-lg group"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3.5 h-3.5 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
          </svg>
          <span className="text-[11px] font-medium tracking-tight">@EdgeMarketsX</span>
        </a>

        <div data-testid="status-connection" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div
            className={`w-2 h-2 rounded-full ${isConnected || isMock ? 'animate-pulse-dot' : ''}`}
            style={{ backgroundColor: statusColor }}
          />
          <span
            className="text-[11px] uppercase tracking-[0.05em] font-medium"
            style={{ color: statusColor }}
          >
            {statusText}
          </span>
        </div>

        {hasAnyConnection ? (
          <div className="flex items-center gap-2">
            {solana.connected && solana.address && (
              <button
                data-testid="button-sol-address"
                onClick={onPortfolioClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all duration-150"
                style={{
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-primary)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green)' }} />
                {truncate(solana.address)}
              </button>
            )}
            {evm.connected && evm.address && (
              <button
                data-testid="button-evm-address"
                onClick={onPortfolioClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all duration-150"
                style={{
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-primary)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green)' }} />
                {truncate(evm.address)}
              </button>
            )}
            {exchangeCount > 0 && !solana.connected && !evm.connected && (
              <button
                data-testid="button-exchanges"
                onClick={onPortfolioClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all duration-150"
                style={{
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green)' }} />
                {exchangeCount} exchange{exchangeCount > 1 ? 's' : ''}
              </button>
            )}
            <button
              data-testid="button-wallet-settings"
              onClick={onConnectClick}
              className="p-1.5 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <Settings size={16} />
            </button>
          </div>
        ) : (
          <button
            data-testid="button-wallet"
            onClick={onConnectClick}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150"
            style={{
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-primary)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            <Wallet size={14} />
            Connect
          </button>
        )}
      </div>
    </header>
  );
}
