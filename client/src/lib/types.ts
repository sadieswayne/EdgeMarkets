export type OpportunityType = 'prediction' | 'crypto_spot' | 'futures_basis' | 'forex' | 'options';
export type OpportunityStatus = 'active' | 'expiring' | 'expired';
export type AIRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'AVOID';

export interface RiskCategoryScore {
  score: number;
  note: string;
}

export interface AIRiskBreakdown {
  overallRisk: AIRiskLevel;
  overallScore: number;
  breakdown: {
    execution: RiskCategoryScore;
    settlement: RiskCategoryScore;
    slippage: RiskCategoryScore;
    counterparty: RiskCategoryScore;
    timing: RiskCategoryScore;
  };
  recommendation: string;
  analyzedAt: number;
  fromCache: boolean;
}

export interface ArbitrageOpportunity {
  id: string;
  type: OpportunityType;
  asset: string;
  assetShort: string;
  buyPlatform: string;
  sellPlatform: string;
  buyPrice: number;
  sellPrice: number;
  rawSpread: number;
  netProfit: number;
  netProfitDollar: number;
  confidence: 1 | 2 | 3 | 4 | 5;
  liquidity: number;
  buyFee: number;
  sellFee: number;
  slippageEst: number;
  detectedAt: Date;
  aiInsight: string;
  aiRisk: AIRiskLevel | null;
  aiReason: string | null;
  aiConfidence: 1 | 2 | 3 | 4 | 5 | null;
  aiAnalyzedAt: number | null;
  aiRiskBreakdown: AIRiskBreakdown | null;
  algorithmicRisk: AIRiskLevel;
  hasAiInsight: boolean;
  isAiAnalyzing: boolean;
  aiModel: string | null;
  status: OpportunityStatus;
  spreadHistory: number[];
}

export interface CategoryConfig {
  id: OpportunityType;
  label: string;
  icon: string;
  color: string;
}

export interface FilterState {
  category: OpportunityType | 'all';
  minSpread: number;
  minProfit: number;
  platforms: string[];
  liquidity: string;
  timeSensitivity: string;
  sort: string;
}

export interface LiveStats {
  totalOpportunities: number;
  avgSpread: number;
  bestOpportunity: number;
  totalVolume: number;
}

export interface AIStatusData {
  connected: boolean;
  callsToday: number;
  costToday: number;
  dailyLimit: number;
  inputTokens: number;
  outputTokens: number;
  isWarning: boolean;
  isLimited: boolean;
}

export interface NewsAlertData {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: number;
  relevance: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  affectedAssets: string[];
  affectedMarkets: string[];
  analyzedAt: number;
}
