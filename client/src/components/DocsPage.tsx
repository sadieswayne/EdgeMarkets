import { useState } from 'react';
import {
  BookOpen, Zap, TrendingUp, BarChart3, ArrowLeftRight, Bitcoin,
  Shield, Bot, Brain, Globe, ChevronRight, ExternalLink,
  Layers, Activity, Lock, Eye, Terminal, Cpu, Wifi, Clock,
  DollarSign, AlertTriangle, CheckCircle, ArrowRight
} from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'arbitrage', label: 'What is Arbitrage', icon: TrendingUp },
  { id: 'markets', label: 'Market Types', icon: Layers },
  { id: 'platforms', label: 'Supported Platforms', icon: Globe },
  { id: 'explorer', label: 'Explorer Tab', icon: Activity },
  { id: 'autopilot', label: 'Autopilot Tab', icon: Bot },
  { id: 'ai', label: 'AI Analysis', icon: Brain },
  { id: 'wallets', label: 'Wallets & API Keys', icon: Lock },
  { id: 'risk', label: 'Risk & Fees', icon: AlertTriangle },
  { id: 'architecture', label: 'Architecture', icon: Cpu },
  { id: 'glossary', label: 'Glossary', icon: Terminal },
];

function SectionHeading({ id, icon: Icon, title, subtitle }: { id: string; icon: any; title: string; subtitle: string }) {
  return (
    <div id={id} className="mb-6 scroll-mt-8">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-glow)' }}
        >
          <Icon size={18} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h2 className="text-[20px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
        </div>
      </div>
      <div className="h-px mt-4" style={{ backgroundColor: 'var(--border-primary)' }} />
    </div>
  );
}

function InfoCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {title && (
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: accent || 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}

function PlatformCard({ name, type, pairs, description }: { name: string; type: string; pairs: string; description: string }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--pill-bg)', color: 'var(--text-tertiary)' }}
        >
          {type}
        </span>
      </div>
      <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
      <span className="text-[11px] font-mono" style={{ color: 'var(--accent-primary)' }}>{pairs}</span>
    </div>
  );
}

function StepItem({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
        style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)' }}
      >
        {number}
      </div>
      <div>
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
      </div>
    </div>
  );
}

function FeatureBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[11px] px-2.5 py-1 rounded-full font-medium"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <nav
        className="w-[220px] flex-shrink-0 overflow-y-auto py-4 px-3"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-2 px-3 mb-5">
          <BookOpen size={15} style={{ color: 'var(--accent-primary)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Documentation</span>
        </div>
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              data-testid={`docs-nav-${section.id}`}
              onClick={() => scrollTo(section.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 mb-0.5"
              style={{
                backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)';
                }
              }}
            >
              <Icon size={14} />
              <span className="text-[12px] font-medium">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="flex-1 overflow-y-auto px-10 py-8"
        style={{ backgroundColor: 'var(--bg-primary)' }}
        onScroll={(e) => {
          const container = e.currentTarget;
          for (const section of [...SECTIONS].reverse()) {
            const el = document.getElementById(section.id);
            if (el && el.offsetTop - container.scrollTop <= 120) {
              setActiveSection(section.id);
              break;
            }
          }
        }}
      >
        <div className="max-w-[780px] mx-auto">

          <SectionHeading id="overview" icon={BookOpen} title="What is EDGE?" subtitle="Professional arbitrage detection terminal" />
          <InfoCard title="">
            <p className="mb-4">
              <strong style={{ color: 'var(--text-primary)' }}>EDGE</strong> is a professional-grade arbitrage trading terminal that monitors price discrepancies across multiple financial platforms in real time. It scans crypto spot exchanges, prediction markets, forex brokers, and options exchanges simultaneously to detect opportunities where the same asset is priced differently on two platforms.
            </p>
            <p className="mb-4">
              When a price gap exists between two platforms, traders can theoretically buy on the cheaper platform and sell on the more expensive one, capturing the difference as profit. EDGE automates the detection of these opportunities, calculates fees and slippage, and presents actionable data in a Bloomberg Terminal-inspired interface.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <FeatureBadge label="12 Live Feeds" color="#3B82F6" />
              <FeatureBadge label="5 Market Types" color="#A78BFA" />
              <FeatureBadge label="200+ Opportunities" color="#10B981" />
              <FeatureBadge label="AI-Powered Analysis" color="#F59E0B" />
              <FeatureBadge label="Automated Bots" color="#EF4444" />
              <FeatureBadge label="Real-Time WebSocket" color="#06B6D4" />
            </div>
          </InfoCard>

          <InfoCard title="Key Capabilities">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Activity, label: 'Real-time price monitoring across 12 platforms' },
                { icon: Zap, label: 'Sub-second arbitrage detection engine (500ms cycles)' },
                { icon: Brain, label: 'AI-powered insights with Claude (Sonnet/Opus/Haiku)' },
                { icon: Bot, label: 'Autopilot bots with paper trading simulation' },
                { icon: Shield, label: 'Risk scoring with 5-category breakdown' },
                { icon: Lock, label: 'Encrypted API key vault (client-side only)' },
                { icon: Globe, label: 'Deep links to execute trades on source platforms' },
                { icon: Eye, label: 'Portfolio tracking for Solana + EVM wallets' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <item.icon size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </InfoCard>

          <SectionHeading id="arbitrage" icon={TrendingUp} title="What is Arbitrage?" subtitle="Understanding price discrepancy trading" />
          <InfoCard title="The Core Concept">
            <p className="mb-4">
              Arbitrage is the practice of profiting from price differences of the same asset across different markets or platforms. In efficient markets, the same asset should trade at the same price everywhere. When it doesn't, an arbitrage opportunity exists.
            </p>
            <div
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
            >
              <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Example: Crypto Spot Arbitrage</p>
              <div className="flex items-center gap-3 text-[12px]">
                <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--green-subtle)', border: '1px solid var(--green-border)' }}>
                  <span style={{ color: 'var(--green)' }}>Buy BTC on Binance</span>
                  <div className="font-mono mt-1 text-[14px]" style={{ color: 'var(--green)' }}>$97,342.50</div>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--red-subtle)', border: '1px solid var(--red-border)' }}>
                  <span style={{ color: 'var(--red)' }}>Sell BTC on Bybit</span>
                  <div className="font-mono mt-1 text-[14px]" style={{ color: 'var(--red)' }}>$97,425.80</div>
                </div>
                <span className="text-[11px] font-mono px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
                  +0.085% spread
                </span>
              </div>
            </div>
            <p className="mb-3">
              The <strong style={{ color: 'var(--text-primary)' }}>gross spread</strong> is the raw price difference percentage. However, the <strong style={{ color: 'var(--text-primary)' }}>net profit</strong> must account for:
            </p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Trading fees</strong> on both the buy and sell sides (typically 0.05%-0.15% per trade)</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Slippage</strong> — the price may move between when you see it and when your order fills</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Transfer costs</strong> — moving assets between platforms takes time and may incur network fees</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Execution risk</strong> — the opportunity may close before both legs are filled</span>
              </li>
            </ul>
          </InfoCard>

          <InfoCard title="Why Many Opportunities Show Negative Net Profit">
            <p className="mb-3">
              In efficient markets, most price discrepancies are smaller than the combined fees required to exploit them. This is normal and expected. EDGE shows these "monitoring" opportunities because:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <CheckCircle size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--green)' }} />
                <span>Spreads can widen suddenly during market volatility, turning negative-net into positive-net opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--green)' }} />
                <span>Traders with lower fee tiers (VIP/market maker) may find opportunities profitable at smaller spreads</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--green)' }} />
                <span>Historical spread data helps identify patterns and timing for profitable entries</span>
              </li>
            </ul>
          </InfoCard>

          <SectionHeading id="markets" icon={Layers} title="Market Types" subtitle="Five categories of arbitrage opportunities" />

          <InfoCard title="Crypto Spot">
            <div className="flex items-center gap-2 mb-3">
              <Bitcoin size={14} style={{ color: '#F59E0B' }} />
              <span className="text-[12px] font-medium" style={{ color: '#F59E0B' }}>Cross-Exchange Price Differences</span>
            </div>
            <p className="mb-3">
              Crypto spot arbitrage exploits price differences for the same cryptocurrency trading pair across different exchanges. For example, BTC/USDT might trade at $97,342 on Binance but $97,425 on Bybit simultaneously. EDGE monitors 4 major exchanges (Binance, Coinbase, Bybit, Kraken) via WebSocket feeds for real-time price updates.
            </p>
            <p>
              These opportunities typically have very small spreads (0.01%-0.5%) and are most common during periods of high volatility, news events, or exchange-specific liquidity imbalances.
            </p>
          </InfoCard>

          <InfoCard title="Prediction Markets">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} style={{ color: '#A78BFA' }} />
              <span className="text-[12px] font-medium" style={{ color: '#A78BFA' }}>Cross-Platform Odds Discrepancies</span>
            </div>
            <p className="mb-3">
              Prediction market arbitrage finds the same event priced differently on Polymarket vs Kalshi. For instance, "Will BTC hit $100K by March 2026?" might be priced at 55 cents on Kalshi but 62 cents on Polymarket. EDGE uses fuzzy keyword matching (60% keyword overlap) to identify equivalent markets across platforms.
            </p>
            <p>
              These tend to have wider spreads (3%-10%) but lower liquidity and longer settlement times compared to crypto spot.
            </p>
          </InfoCard>

          <InfoCard title="Futures / Basis">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} style={{ color: '#3B82F6' }} />
              <span className="text-[12px] font-medium" style={{ color: '#3B82F6' }}>Spot vs Futures Premium Capture</span>
            </div>
            <p className="mb-3">
              Basis trading captures the premium between spot and futures prices. Futures contracts often trade above spot price (contango), creating a carry trade opportunity. Cash-and-carry arbitrage involves buying spot and selling futures, locking in the basis as profit when the futures contract expires.
            </p>
            <p>
              This also includes funding rate arbitrage, where perpetual futures funding rates diverge between exchanges, creating an opportunity to collect funding on one while hedging on another.
            </p>
          </InfoCard>

          <InfoCard title="Forex Inter-Broker">
            <div className="flex items-center gap-2 mb-3">
              <ArrowLeftRight size={14} style={{ color: '#10B981' }} />
              <span className="text-[12px] font-medium" style={{ color: '#10B981' }}>Cross-Broker FX Rate Differences</span>
            </div>
            <p className="mb-3">
              EDGE monitors 12 major forex pairs (EUR/USD, GBP/USD, USD/JPY, etc.) across 4 brokers: OANDA, FXCM, Interactive Brokers, and Saxo Bank. Each broker applies different spread markups to the interbank rate, creating small but persistent pricing differences.
            </p>
            <p>
              Forex arb spreads are typically very tight (0.001%-0.05%) due to the highly efficient nature of FX markets, but the massive liquidity means even tiny edges can be profitable at scale.
            </p>
          </InfoCard>

          <InfoCard title="Options Cross-Exchange">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} style={{ color: '#EF4444' }} />
              <span className="text-[12px] font-medium" style={{ color: '#EF4444' }}>IV Differentials & Put-Call Parity Violations</span>
            </div>
            <p className="mb-3">
              Options arbitrage detects pricing inconsistencies between Deribit and OKX for BTC and ETH options. EDGE uses the Black-Scholes pricing model with implied volatility (IV) differentials to identify mispriced options. Opportunities include:
            </p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>IV Surface Arbitrage</strong> — same strike/expiry priced with different implied volatilities</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Put-Call Parity</strong> — violations of the fundamental relationship between puts, calls, and the underlying</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Cross-Exchange Spread</strong> — same option contract priced differently on Deribit vs OKX</span>
              </li>
            </ul>
          </InfoCard>

          <SectionHeading id="platforms" icon={Globe} title="Supported Platforms" subtitle="12 data feeds across 4 market categories" />
          <div className="grid grid-cols-2 gap-3 mb-6">
            <PlatformCard name="Binance" type="Crypto Spot" pairs="BTC, ETH, SOL, AVAX + more" description="World's largest crypto exchange. Connected via WebSocket with REST fallback for geo-blocked regions." />
            <PlatformCard name="Coinbase" type="Crypto Spot" pairs="BTC, ETH, SOL, LINK + more" description="US-regulated exchange. Real-time WebSocket price feed with deep USD liquidity." />
            <PlatformCard name="Bybit" type="Crypto Spot" pairs="BTC, ETH, SOL, DOGE + more" description="High-volume derivatives exchange. Uses V5 spot WebSocket with lastPrice fallback." />
            <PlatformCard name="Kraken" type="Crypto Spot" pairs="BTC, ETH, MATIC, LINK + more" description="European-focused exchange known for security. WebSocket feed for spot prices." />
            <PlatformCard name="Polymarket" type="Prediction" pairs="500+ active markets" description="Decentralized prediction market on Polygon. REST polling via CLOB API for event pricing." />
            <PlatformCard name="Kalshi" type="Prediction" pairs="1,700+ event contracts" description="CFTC-regulated prediction exchange. REST API with pagination for broad market coverage." />
            <PlatformCard name="OANDA" type="Forex" pairs="12 major FX pairs" description="Leading retail forex broker. Tight spreads with premium pricing tier." />
            <PlatformCard name="FXCM" type="Forex" pairs="12 major FX pairs" description="Major forex broker with competitive spreads. Active trader pricing model." />
            <PlatformCard name="Interactive Brokers" type="Forex" pairs="12 major FX pairs" description="Professional-grade broker with institutional spreads. Lowest markup of all brokers." />
            <PlatformCard name="Saxo Bank" type="Forex" pairs="12 major FX pairs" description="Premium European broker. Classic account tier spread modeling." />
            <PlatformCard name="Deribit" type="Options" pairs="BTC + ETH options" description="Dominant crypto options exchange. Black-Scholes pricing with IV surface data." />
            <PlatformCard name="OKX" type="Options" pairs="BTC + ETH options" description="Multi-asset crypto exchange with growing options volume. Cross-exchange IV comparison." />
          </div>

          <SectionHeading id="explorer" icon={Activity} title="Explorer Tab" subtitle="Real-time opportunity scanner and analysis" />
          <InfoCard title="The Main Dashboard">
            <p className="mb-4">
              The Explorer tab is EDGE's primary interface. It displays all detected arbitrage opportunities in a real-time updating table with animated price flashes, confidence indicators, and actionable trade links.
            </p>
            <StepItem number={1} title="Opportunity Table" description="Shows all active opportunities sorted by profit, spread, age, or liquidity. Each row displays the asset pair, buy/sell platforms, prices, gross spread, net profit, confidence bars, and age." />
            <StepItem number={2} title="Category Filters" description="Use the sidebar to filter by market type (Crypto Spot, Prediction, Forex, Options, Futures). Each category shows a live count of active opportunities." />
            <StepItem number={3} title="Expanded Detail View" description="Click any row to expand it and see the full analysis: buy and sell leg details, fee breakdown, AI insight (if available), sparkline chart of spread history, and direct trade execution links." />
            <StepItem number={4} title="Trade Execution Links" description="Each opportunity has Buy and Sell buttons that deep-link directly to the relevant trading page on the source platform, pre-populated with the correct asset pair." />
          </InfoCard>

          <InfoCard title="Understanding the Table Columns">
            <div className="space-y-3">
              {[
                { col: 'Asset', desc: 'The trading pair or event being monitored (e.g., BTC/USDT, "Will BTC hit $100K?")' },
                { col: 'Buy / Sell', desc: 'The platforms where you would buy (cheaper) and sell (more expensive)' },
                { col: 'Buy Price / Sell Price', desc: 'Current quoted prices with green/red flash animations on price updates' },
                { col: 'Spread %', desc: 'Gross spread — the raw price difference as a percentage before fees' },
                { col: 'Net %', desc: 'Net profit after subtracting estimated buy fees, sell fees, and slippage' },
                { col: 'Confidence', desc: '1-5 bar signal indicator based on liquidity depth, spread stability, and execution likelihood' },
                { col: 'Liquidity', desc: 'Estimated available liquidity (order book depth) for the opportunity' },
                { col: 'Age', desc: 'How long ago the opportunity was first detected' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-[12px] font-mono font-medium flex-shrink-0 w-[100px]" style={{ color: 'var(--accent-primary)' }}>{item.col}</span>
                  <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="Sidebar Controls">
            <p className="mb-3">The left sidebar provides filtering and status information:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Category Filters</strong> — Filter by All, Prediction Markets, Crypto Spot, Futures/Basis, Forex, or Options</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Min Spread</strong> — Set a minimum gross spread threshold to filter out small opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Liquidity Filter</strong> — Filter by minimum available liquidity ($1K+, $10K+, $100K+)</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Feed Status</strong> — Shows connection status for all 12 data feeds with pair counts</span>
              </li>
            </ul>
          </InfoCard>

          <SectionHeading id="autopilot" icon={Bot} title="Autopilot Tab" subtitle="Automated bot trading framework" />
          <InfoCard title="Bot Framework Overview">
            <p className="mb-4">
              The Autopilot tab provides an automated trading bot framework. Bots run server-side, meaning you don't need to keep your browser open for them to operate. Currently, all bots run in <strong style={{ color: 'var(--text-primary)' }}>paper trading mode</strong>, simulating realistic execution with slippage, partial fills, and occasional failures.
            </p>
            <p className="mb-3">Available bot strategies:</p>
            <div className="space-y-2">
              {[
                { name: 'Spot Arbitrage Scanner', desc: 'Monitors cross-exchange crypto spot price differences and executes when spread exceeds threshold' },
                { name: 'Prediction Market Arb', desc: 'Scans for equivalent events priced differently across Polymarket and Kalshi' },
                { name: 'Funding Rate Harvester', desc: 'Captures funding rate differentials between perpetual futures exchanges' },
                { name: 'Basis Trade Bot', desc: 'Executes cash-and-carry arbitrage between spot and futures markets' },
                { name: 'Stablecoin Peg Monitor', desc: 'Detects and trades temporary stablecoin depegging events across DEXs and CEXs' },
                { name: 'Cross-DEX Arbitrage', desc: 'Monitors price differences across decentralized exchanges for the same token pair' },
              ].map((bot, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <Bot size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{bot.name}</span>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{bot.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="Bot Safety Features">
            <div className="space-y-2">
              {[
                { icon: Shield, label: 'Circuit Breakers', desc: 'Daily loss limit, 3 consecutive failures auto-pause, max concurrent positions' },
                { icon: AlertTriangle, label: 'AI Trade Guard', desc: 'Claude validates every bot trade before execution, checking for market manipulation, unusual conditions' },
                { icon: Clock, label: 'Health Monitoring', desc: 'Continuous health checks ensure bots are operating within parameters' },
                { icon: DollarSign, label: 'Paper Trading', desc: 'All bots simulate execution with realistic slippage and partial fills — no real money at risk' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <item.icon size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--green)' }} />
                  <div>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>

          <SectionHeading id="ai" icon={Brain} title="AI Analysis Layer" subtitle="Claude-powered insights and risk assessment" />
          <InfoCard title="AI Integration">
            <p className="mb-4">
              EDGE integrates Anthropic's Claude AI models for intelligent analysis of arbitrage opportunities. The AI layer operates on a tiered system:
            </p>
            <div className="space-y-3 mb-4">
              {[
                { model: 'Claude Haiku', speed: 'Fastest', use: 'Quick screening, news relevance filtering', color: '#10B981' },
                { model: 'Claude Sonnet', speed: 'Balanced', use: 'Default analysis, opportunity insights, risk scoring', color: '#3B82F6' },
                { model: 'Claude Opus', speed: 'Deep', use: 'High-value opportunities (>5% profit or >$100), complex analysis', color: '#A78BFA' },
              ].map((tier, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <Brain size={14} style={{ color: tier.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{tier.model}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>{tier.speed}</span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{tier.use}</p>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="AI Features">
            <div className="space-y-3">
              <div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Opportunity Insights</p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  AI analyzes high-profit opportunities automatically, providing actionable commentary on execution timing, spread drivers, order book depth, and historical fill rates. Algorithmic fallback insights are always available for every opportunity.
                </p>
              </div>
              <div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Risk Scoring</p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  5-category risk breakdown: Execution Risk, Settlement Risk, Slippage Risk, Counterparty Risk, and Timing Risk. Each scored 0-100 with a detailed note explaining the assessment. Overall risk rated as LOW, MEDIUM, HIGH, or AVOID.
                </p>
              </div>
              <div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Interactive Chat</p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  Ask Claude about any opportunity, trading strategy, or market condition. The chat panel supports streaming responses and can be opened with context about a specific opportunity for targeted advice.
                </p>
              </div>
              <div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>News Monitoring</p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  RSS polling with batch AI analysis. News articles are scored for relevance and market impact, with alerts surfaced for critical events that may affect active arbitrage opportunities.
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="AI Cost Management">
            <p className="mb-3">
              EDGE implements strict cost controls for AI usage:
            </p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>$20 daily cost limit</strong> with model-aware pricing tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>TTL-based caching</strong> — insights cached 60s, risk scores 120s, news analysis 300s</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Tiered triggering</strong> — AI only called for opportunities with net profit &gt; 0.5%</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight size={12} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span><strong style={{ color: 'var(--text-primary)' }}>Status indicator</strong> in the top bar shows call count and daily cost</span>
              </li>
            </ul>
          </InfoCard>

          <SectionHeading id="wallets" icon={Lock} title="Wallets & API Keys" subtitle="Connecting your accounts" />
          <InfoCard title="Wallet Connectivity">
            <p className="mb-4">
              EDGE supports connecting crypto wallets for portfolio tracking. Wallet connections are <strong style={{ color: 'var(--text-primary)' }}>read-only</strong> — EDGE never has custody of your funds or the ability to initiate transactions.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Solana Wallets</p>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Phantom, Solflare via @solana/wallet-adapter</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>EVM Wallets</p>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>MetaMask and other EVM wallets via wagmi + viem</p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Exchange API Keys">
            <p className="mb-3">
              You can add exchange API keys for enhanced portfolio tracking across centralized exchanges. API keys are stored in an <strong style={{ color: 'var(--text-primary)' }}>encrypted vault in your browser's localStorage</strong> — they are never sent to EDGE's servers or to AI models.
            </p>
            <div
              className="p-3 rounded-lg flex items-start gap-2"
              style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}
            >
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--red)' }} />
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--red)' }}>Security Note:</strong> Always use read-only API keys. Never provide keys with trading or withdrawal permissions unless you fully understand the risks.
              </p>
            </div>
          </InfoCard>

          <SectionHeading id="risk" icon={AlertTriangle} title="Risk & Fees" subtitle="Understanding costs and dangers" />
          <InfoCard title="Fee Structure">
            <p className="mb-3">EDGE estimates the following fees for each opportunity:</p>
            <div className="space-y-2">
              {[
                { fee: 'Buy Fee', range: '0.05% - 0.15%', desc: 'Maker/taker fee on the buy-side exchange' },
                { fee: 'Sell Fee', range: '0.05% - 0.15%', desc: 'Maker/taker fee on the sell-side exchange' },
                { fee: 'Slippage Est.', range: '0.01% - 0.05%', desc: 'Estimated price slippage from market impact' },
                { fee: 'Network Fee', range: 'Variable', desc: 'Blockchain transfer costs (for cross-chain moves)' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <span className="text-[12px] font-mono w-[100px] flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{item.fee}</span>
                  <span className="text-[11px] font-mono w-[100px] flex-shrink-0" style={{ color: 'var(--amber)' }}>{item.range}</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="Risk Categories">
            <div className="space-y-3">
              {[
                { level: 'LOW', color: 'var(--green)', desc: 'High liquidity, stable spread, reliable platforms, fast execution. Generally safe for experienced traders.' },
                { level: 'MEDIUM', color: 'var(--amber)', desc: 'Moderate liquidity or spread volatility. May require careful timing and position sizing.' },
                { level: 'HIGH', color: 'var(--red)', desc: 'Thin liquidity, volatile spread, or platform reliability concerns. Proceed with caution.' },
                { level: 'AVOID', color: '#DC2626', desc: 'Extremely high risk. Spread likely to close before execution, or platform has known issues.' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded" style={{ color: item.color, backgroundColor: `${item.color}15` }}>{item.level}</span>
                  <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="Important Disclaimers">
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--red)' }}>Not Financial Advice:</strong> EDGE is an informational tool. All trading involves risk of loss. Past arbitrage performance does not guarantee future results.
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--red)' }}>Execution Risk:</strong> Displayed prices may be delayed or stale. Actual execution prices may differ significantly from displayed prices, especially during high volatility.
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--red)' }}>Regulatory:</strong> Arbitrage trading may be subject to regulation in your jurisdiction. Ensure you comply with all applicable laws before trading.
                </p>
              </div>
            </div>
          </InfoCard>

          <SectionHeading id="architecture" icon={Cpu} title="Technical Architecture" subtitle="How EDGE works under the hood" />
          <InfoCard title="System Overview">
            <div className="space-y-3">
              <div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Frontend</p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  React + TypeScript + Tailwind CSS + Framer Motion. JetBrains Mono for numbers, Geist Sans for UI text. Desktop-optimized terminal interface that fills the viewport with no page scrolling.
                </p>
              </div>
              <div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Backend</p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  Express.js server with WebSocket (ws library) attached to the same HTTP server on port 5000. All data feeds, arbitrage engine, and bot orchestrator run server-side.
                </p>
              </div>
              <div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Data Pipeline</p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  12 platform feeds push normalized prices into an in-memory price store (30s TTL). The arbitrage engine runs every 500ms, comparing prices across platforms to detect opportunities. Detected opportunities are broadcast to all connected clients via WebSocket.
                </p>
              </div>
              <div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Data Normalization</p>
                <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  All platform data is normalized into a unified NormalizedPrice format before comparison. This handles differences in API response formats, price quoting conventions, and asset naming across platforms.
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Arbitrage Detection Engine">
            <StepItem number={1} title="Price Collection" description="12 feeds push data into the price store. WebSocket feeds provide real-time updates; REST feeds poll at configured intervals." />
            <StepItem number={2} title="Normalization" description="Raw prices are converted to a unified format with platform, asset, bid, ask, volume, and timestamp fields." />
            <StepItem number={3} title="Comparison" description="Every 500ms, the engine compares all same-asset prices across platforms. For prediction markets, fuzzy keyword matching (60% overlap) identifies equivalent events." />
            <StepItem number={4} title="Opportunity Scoring" description="Detected spreads are scored for confidence (1-5) based on liquidity, spread stability, and platform reliability. Fees and slippage are estimated." />
            <StepItem number={5} title="Broadcasting" description="New and updated opportunities are sent to all WebSocket clients. The frontend receives snapshots and incremental updates." />
          </InfoCard>

          <SectionHeading id="glossary" icon={Terminal} title="Glossary" subtitle="Key terms and definitions" />
          <InfoCard title="">
            <div className="space-y-4">
              {[
                { term: 'Arbitrage', def: 'Profiting from price differences of the same asset across different markets or platforms.' },
                { term: 'Spread', def: 'The percentage difference between the buy price and sell price of an opportunity.' },
                { term: 'Net Profit', def: 'Spread minus all estimated fees (buy fee, sell fee, slippage). The actual expected return.' },
                { term: 'Slippage', def: 'The difference between expected and actual execution price, caused by market movement or low liquidity.' },
                { term: 'Liquidity', def: 'The available volume (order book depth) at quoted prices. Higher liquidity means larger positions are executable.' },
                { term: 'Confidence', def: 'A 1-5 rating of how reliable and executable an opportunity is, based on liquidity, spread stability, and platform factors.' },
                { term: 'Implied Volatility (IV)', def: 'The market\'s expectation of future price movement, used in options pricing. IV differences across exchanges create arb opportunities.' },
                { term: 'Black-Scholes', def: 'A mathematical model for pricing options contracts. EDGE uses it to calculate theoretical option values for cross-exchange comparison.' },
                { term: 'Basis Trade', def: 'Buying spot and selling futures to capture the premium (basis) between them.' },
                { term: 'Funding Rate', def: 'Periodic payments between long and short perpetual futures holders. Rate differences across exchanges create arb opportunities.' },
                { term: 'Put-Call Parity', def: 'A fundamental relationship between put and call option prices. Violations indicate mispricing and potential arb.' },
                { term: 'Contango', def: 'When futures prices are higher than spot prices. Common in crypto and commodities markets.' },
                { term: 'CLOB', def: 'Central Limit Order Book. The order matching system used by Polymarket and traditional exchanges.' },
                { term: 'Deep Link', def: 'A URL that opens a specific trading page on an exchange, pre-populated with the correct asset pair.' },
                { term: 'Paper Trading', def: 'Simulated trading with virtual money to test strategies without financial risk.' },
                { term: 'Circuit Breaker', def: 'Automated safety mechanism that pauses bot trading when loss limits or failure thresholds are reached.' },
                { term: 'TTL', def: 'Time To Live. How long a cached value remains valid before being refreshed.' },
                { term: 'WebSocket', def: 'A persistent two-way connection between client and server enabling real-time data streaming.' },
              ].map((item, i) => (
                <div key={i}>
                  <span className="text-[13px] font-medium font-mono" style={{ color: 'var(--accent-primary)' }}>{item.term}</span>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.def}</p>
                </div>
              ))}
            </div>
          </InfoCard>

          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
