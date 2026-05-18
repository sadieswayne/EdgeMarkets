import { useState, useCallback, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { CombinedProvider } from './components/providers/CombinedProvider';
import { LoadingScreen } from './components/LoadingScreen';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { OpportunityTable } from './components/OpportunityTable';
import { AutopilotTab } from './components/AutopilotTab';
import { DocsPage } from './components/DocsPage';
import { TickerBar } from './components/TickerBar';
import { MobileGuard } from './components/MobileGuard';
import { ConnectModal } from './components/wallet/ConnectModal';
import { ToastContainer } from './components/wallet/ToastContainer';
import { PortfolioPanel } from './components/portfolio/PortfolioPanel';
import { AIChatPanel } from './components/AIChatPanel';
import { NewsAlertBar } from './components/NewsAlertBar';
import { useTerminal } from './hooks/useTerminal';
import { useWalletState } from './hooks/useWalletState';
import { useToast } from './hooks/useToast';
import { storeApiKey } from './lib/keyVault';

function AppInner() {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatOpportunityId, setChatOpportunityId] = useState<string | null>(null);
  const [chatOpportunityLabel, setChatOpportunityLabel] = useState<string>('');

  const {
    opportunities,
    allOpportunities,
    priceFlashes,
    newRowIds,
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    expandedRow,
    setExpandedRow,
    liveStats,
    categoryCounts,
    connections,
    isConnected,
    isMock,
    newsAlerts,
  } = useTerminal();

  const { state: walletState, setExchangeConnected, removeExchangeKey } = useWalletState();
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
      if (w >= 1024) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (chatOpen) { setChatOpen(false); return; }
        if (connectModalOpen) { setConnectModalOpen(false); return; }
        if (portfolioOpen) { setPortfolioOpen(false); return; }
        if (sidebarOpen) { setSidebarOpen(false); return; }
        setExpandedRow(null);
      }
      if (e.key === '1' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;
        setActiveTab('explorer');
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;
        setActiveTab('autopilot');
      }
      if (e.key === '3' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;
        setActiveTab('docs');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setExpandedRow, setActiveTab, sidebarOpen, connectModalOpen, portfolioOpen, chatOpen]);

  const handleLoadComplete = useCallback(() => setLoading(false), []);

  const openAIChat = useCallback((opportunityId?: string, label?: string) => {
    setChatOpportunityId(opportunityId || null);
    setChatOpportunityLabel(label || '');
    setChatOpen(true);
  }, []);

  const handleExchangeKeySubmit = useCallback((platform: string, apiKey: string, apiSecret: string, passphrase?: string) => {
    setExchangeConnected(platform, { connected: true, hasApiKey: true, loading: false });
    showToast({
      type: 'success',
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Connected`,
      message: 'API key saved and verified',
      platform,
      duration: 4000,
    });
  }, [setExchangeConnected, showToast]);

  const handleExchangeDisconnect = useCallback((platform: string) => {
    removeExchangeKey(platform);
    showToast({
      type: 'info',
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Disconnected`,
      message: 'API key removed',
      platform,
      duration: 3000,
    });
  }, [removeExchangeKey, showToast]);

  if (isMobile) return <MobileGuard />;
  if (loading) return <LoadingScreen onComplete={handleLoadComplete} />;

  const showDrawerSidebar = isTablet;

  return (
    <div
      className="flex flex-col h-screen animate-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        walletState={walletState}
        onConnectClick={() => setConnectModalOpen(true)}
        onPortfolioClick={() => setPortfolioOpen(true)}
        onAIChatOpen={() => openAIChat()}
        showHamburger={showDrawerSidebar}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        isConnected={isConnected}
        isMock={isMock}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {activeTab !== 'docs' && showDrawerSidebar && sidebarOpen && (
          <div
            className="fixed inset-0 z-30"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {activeTab !== 'docs' && (showDrawerSidebar ? (
          <div
            className="fixed top-[56px] left-0 bottom-[36px] z-40 transition-transform duration-300"
            style={{
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            }}
          >
            <Sidebar
              filters={filters}
              onFiltersChange={setFilters}
              liveStats={liveStats}
              categoryCounts={categoryCounts}
              connections={connections}
              activeTab={activeTab}
            />
          </div>
        ) : (
          <Sidebar
            filters={filters}
            onFiltersChange={setFilters}
            liveStats={liveStats}
            categoryCounts={categoryCounts}
            connections={connections}
            activeTab={activeTab}
          />
        ))}

        <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {activeTab === 'explorer' ? (
            <OpportunityTable
              opportunities={opportunities}
              priceFlashes={priceFlashes}
              newRowIds={newRowIds}
              expandedRow={expandedRow}
              onExpandRow={setExpandedRow}
              sort={filters.sort}
              onSortChange={(sort) => setFilters(prev => ({ ...prev, sort }))}
              walletState={walletState}
              onExecute={(platform: string, asset: string) => {
                showToast({
                  type: 'info',
                  title: `Opening ${platform}`,
                  message: `Navigate to ${asset} trade page`,
                  platform,
                  duration: 5000,
                });
              }}
              onAskAI={openAIChat}
            />
          ) : activeTab === 'autopilot' ? (
            <AutopilotTab />
          ) : (
            <DocsPage />
          )}
        </main>
      </div>

      <NewsAlertBar alerts={newsAlerts} />

      <TickerBar opportunities={allOpportunities} />

      <ConnectModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        exchanges={walletState.exchanges}
        onExchangeKeySubmit={handleExchangeKeySubmit}
        onExchangeDisconnect={handleExchangeDisconnect}
      />

      <PortfolioPanel
        isOpen={portfolioOpen}
        onClose={() => setPortfolioOpen(false)}
        walletState={walletState}
      />

      <AIChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        opportunityId={chatOpportunityId}
        opportunityLabel={chatOpportunityLabel}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function App() {
  return (
    <CombinedProvider>
      <AppInner />
    </CombinedProvider>
  );
}

export default App;
