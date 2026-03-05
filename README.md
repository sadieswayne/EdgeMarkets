# EDGE - Arbitrage Trading Terminal

## Overview
EDGE is a professional arbitrage trading terminal web application. It provides a Bloomberg Terminal-inspired dark UI with real-time live data from multiple exchanges for detecting arbitrage opportunities across crypto spot markets, prediction markets, and forex pairs.

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS + Framer Motion
- **Backend:** Express.js + WebSocket server (ws library)
- **AI:** Anthropic Claude (Sonnet/Opus/Haiku) via Replit AI Integrations
- **Wallet:** @solana/wallet-adapter (Phantom, Solflare), wagmi + viem (MetaMask, EVM wallets)
- **Fonts:** JetBrains Mono (numbers), Geist Sans (UI text)
- **Icons:** Lucide React
- **Data Sources:** Binance, Coinbase, Bybit, Kraken (WebSocket/REST), Polymarket, Kalshi (REST polling), OANDA, FXCM, IBKR, Saxo Bank (Frankfurter API + broker spread modeling), Deribit, OKX (options, Black-Scholes modeled with IV differentials)

## Project Architecture
```
client/src/
  App.tsx              - Main app with CombinedProvider, loading screen, layout, tab switching
  components/
    TopBar.tsx         - Header with EDGE logo, tab nav, wallet addresses, connect/portfolio buttons
    Sidebar.tsx        - Category filters (Explorer), bot filters/stats (Autopilot), adapts per active tab
    OpportunityTable.tsx - Main data table with animated rows, price flashes, trade deep links
    OpportunityDetail.tsx - Expanded detail panel with buy/sell legs, AI insight, sparkline, execute buttons
    AIChatPanel.tsx    - Slide-out AI chat panel with streaming responses, opportunity context
    AIStatusIndicator.tsx - TopBar AI status button with tooltip (cost tracking, call count)
    NewsAlertBar.tsx   - Collapsible news alert bar above ticker (high/critical alerts)
    AutopilotTab.tsx   - Full autopilot bot interface (catalog, active bots, activity log, config modal)
    TickerBar.tsx      - Bottom scrolling ticker
    LoadingScreen.tsx  - Initial loading animation
    MobileGuard.tsx    - Mobile device warning
    SparklineChart.tsx - SVG sparkline chart
    ConfidenceBars.tsx - Signal bar indicator
    PriceFlash.tsx     - Price with green/red flash animation
    providers/
      SolanaProvider.tsx  - Solana wallet adapter context (Phantom, Solflare)
      EVMProvider.tsx     - wagmi + viem EVM wallet context (MetaMask, etc.)
      CombinedProvider.tsx - Wraps both wallet providers + QueryClient
    wallet/
      ConnectModal.tsx    - Modal for connecting wallets and adding exchange API keys
      ToastContainer.tsx  - Animated notification toasts
    portfolio/
      PortfolioPanel.tsx  - Right-side sliding panel showing aggregated balances
  hooks/
    useTerminal.ts     - Central state management, supports live + mock data modes
    useLiveData.ts     - WebSocket connection to /ws for real-time opportunity streaming
    useWalletState.ts  - Unified wallet/exchange connection state management
    useToast.ts        - Toast notification hook
    useBots.ts         - Bot state management with polling, CRUD operations, type definitions
  lib/
    types.ts           - TypeScript interfaces
    mockGenerator.ts   - Mock data generation (fallback mode)
    constants.ts       - Categories, platforms, sort options
    format.ts          - Number/currency/time formatting utilities
    keyVault.ts        - Encrypted API key storage (localStorage, client-side obfuscation)
    deepLinks.ts       - Platform-specific trade URL generation

server/
  routes.ts            - Express routes, initializes feeds/engine/WebSocket/orchestrator on startup
  ws-server.ts         - WebSocket server broadcasting opportunities + bot updates on /ws path
  types.ts             - Server-side TypeScript interfaces (NormalizedPrice, WSMessage, etc.)
  feeds/
    index.ts           - FeedManager orchestrating all platform feeds
    binance.ts         - Binance WebSocket + REST fallback (handles geo-blocking 451)
    coinbase.ts        - Coinbase WebSocket feed
    bybit.ts           - Bybit V5 spot WebSocket feed (lastPrice fallback)
    kraken.ts          - Kraken WebSocket feed
    polymarket.ts      - Polymarket REST polling with CLOB API
    kalshi.ts          - Kalshi REST polling
    forex.ts           - Forex broker feeds (OANDA, FXCM, IBKR, Saxo) using Frankfurter API + broker-specific spreads
    options.ts         - Options feeds (Deribit, OKX) using Black-Scholes pricing with IV differentials for BTC/ETH
  engine/
    arbEngine.ts       - Arbitrage detection engine (runs every 500ms)
    calculator.ts      - Spread/fee/net profit calculations, confidence scoring
  store/
    priceStore.ts      - In-memory normalized price store (30s TTL)
    oppStore.ts        - Opportunity store with history tracking
  bots/
    types.ts           - Bot type definitions, template catalog (BOT_TEMPLATES), all interfaces
    orchestrator.ts    - Bot lifecycle management (create/start/pause/resume/stop), circuit breakers, health checks
    executionEngine.ts - Paper trading simulation engine (live trading stubbed for Phase 5)
    storage.ts         - JSON file persistence for bot configs and trade history (data/bots.json, data/trades.json)
  ai/
    client.ts          - Anthropic client with model selection (Sonnet/Opus/Haiku), prompt builder
    cache.ts           - TTL-based cache for AI responses (60s insights, 120s risk, 300s news)
    rateLimiter.ts     - Rate limiter with $20 daily cost tracking, model-aware pricing
    insightGenerator.ts - Tiered insight generation (algorithmic fallback, AI for high-profit opps)
    riskScorer.ts      - 5-category risk breakdown (market, execution, liquidity, platform, regulatory)
    chatHandler.ts     - Streaming chat with opportunity context, session management
    newsMonitor.ts     - RSS polling with batch AI analysis, relevance/impact scoring
    botGuard.ts        - Trade approval guard (validates bot trades before execution)
    analysisLoop.ts    - Background analysis queue (top opportunities every 5s)
    systemPrompts.ts   - Shared system prompts for all AI services
```

## Key Architecture Decisions
- WebSocket server attached to existing Express httpServer on port 5000 (Replit constraint)
- Binance auto-falls back to REST polling after 3 WebSocket failures (geo-blocking on Replit)
- Bybit uses lastPrice as fallback when bid1Price/ask1Price unavailable
- Arbitrage threshold: gross spread >= 0.005% (shows monitoring opportunities, many have negative net profit after fees - correct for efficient markets)
- Prediction market cross-platform matching uses fuzzy keyword matching (60% keyword overlap)
- All data normalized to unified NormalizedPrice format before arb engine comparison
- Price store entries expire after 30 seconds (stale data protection)
- Bots run server-side, frontend is config/monitoring only (users don't need browser open)
- Paper trading mode simulates realistic execution with slippage, partial fills, and failures
- Bot orchestrator is a singleton with in-memory state + JSON file persistence
- Activity log kept in-memory (last 200 entries), trade history persisted (last 1000 trades)
- Circuit breakers: daily loss limit, 3 consecutive failures auto-pause, max concurrent positions
- AI models: claude-sonnet-4-5 (fast, default), claude-opus-4-6 (deep analysis for high-value), claude-haiku-4-5 (fastest)
- AI strategy: Tiered analysis (algorithmic fallback always present, AI for netProfit > 0.5%, deep for > 5% or $100+)
- AI caching: 60s insights, 120s risk scores, 300s news analysis
- AI rate limiting: $20 daily cost limit, model-aware pricing
- Security: Never send user API keys or wallet addresses to AI, only market data

## API Endpoints
- GET /api/status - Feed connection status, opportunity count, stats
- GET /api/opportunities - Current detected arbitrage opportunities
- GET /api/debug/prices - Raw price store contents (debug only)
- GET /api/bots/templates - Bot template catalog
- GET /api/bots - All bot configs with performance
- GET /api/bots/:id - Single bot details
- POST /api/bots - Create new bot
- PATCH /api/bots/:id - Update bot config
- DELETE /api/bots/:id - Delete bot
- POST /api/bots/:id/start - Start bot
- POST /api/bots/:id/pause - Pause bot
- POST /api/bots/:id/resume - Resume bot
- POST /api/bots/:id/stop - Stop bot
- GET /api/bots/:id/trades - Bot trade history
- GET /api/bots/activity - Activity log
- GET /api/bots/aggregate - Aggregate bot performance
- GET /api/ai/status - AI service status, cost tracking, rate limit info
- POST /api/ai/analyze/:id - Trigger AI analysis for specific opportunity
- GET /api/ai/risk/:id - Get AI risk breakdown for opportunity
- POST /api/ai/chat - Create new AI chat session
- POST /api/ai/chat/:chatId/message - Send message to AI chat (streaming SSE response)
- GET /api/ai/news - Get AI-analyzed news alerts

## Design System
- Near-black backgrounds with blue undertone (#0A0E17)
- Electric blue accent (#3B82F6)
- Green (#10B981) for profit, Red (#EF4444) for loss
- Monospace font for all numbers with tabular-nums
- No page scrolling - terminal fills viewport
- Connection status: LIVE (green dot), MOCK (amber), RECONNECTING (red)
- No emojis - use Lucide icons and colored circles for status indicators

## Recent Changes
- 2026-02-19: Added options trading arbitrage - Deribit vs OKX, BTC + ETH options, Black-Scholes modeled pricing with IV differentials, 136+ cross-exchange opportunities, branded logos, deep links
- 2026-02-19: Added forex inter-broker arbitrage with 4 brokers (OANDA, FXCM, IBKR, Saxo Bank), 12 major pairs, branded logos, deep links
- 2026-02-18: Major prediction market matching improvements - entity-weighted similarity scoring, category-based filtering, expanded discovery (Polymarket 500 markets, Kalshi 1700+ markets via pagination), now detecting 17+ cross-platform prediction opportunities (up from 1)
- 2026-02-16: Phase 5 - AI Analysis Layer with Claude integration (insights, risk scoring, chat, news monitoring, bot guards)
- 2026-02-16: Phase 4 - Autopilot tab with bot framework, 6 pre-built strategies, paper trading, config modal, activity log, aggregate stats
- 2026-02-16: Phase 3 - Wallet connectivity (Solana/EVM), exchange API key management, portfolio panel, execution deep links
- 2026-02-16: Phase 2 complete - live data feeds, arb engine, WebSocket streaming, feed indicators
- 2026-02-13: Initial Phase 1 build - complete UI shell with mock data
