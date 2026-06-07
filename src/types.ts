export interface Trade {
  id: string;
  symbol: string;             // e.g. "NIFTY 50", "BTC/USD"
  type: 'BUY' | 'SELL';
  market: 'EQUITY' | 'INDEX' | 'CRYPTO';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  date: string;               // ISO string
  strategy: string;           // from STRATEGIES list
  setupName?: string;         // free-text setup label
  emotion: string;            // emoji string
  screenshot?: string;        // base64 data URL
  sl: number;                 // stop loss price
  tp: number;                 // take profit price
  pnl: number;                // computed: (exit - entry) * qty for BUY, reversed for SELL
  pnlPercentage: number;      // pnl / (entry * qty) * 100
  notes: string;
  status: 'CLOSED';
  recurring?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  strikePrice?: number;
  optionType?: 'CE' | 'PE' | 'NONE';
}

export interface EmotionOption {
  emoji: string;
  label: string;
}

export type TabType = 'DASHBOARD' | 'LOG' | 'HISTORY' | 'ANALYTICS';
export type AnalyticsSubTabType = 'OVERVIEW' | 'STRATEGY' | 'CALENDAR' | 'PSYCHOLOGY';
