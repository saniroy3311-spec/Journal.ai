import type { Trade, EmotionOption } from './types';

export const STRATEGIES = [
  'ORB 15 min',
  'VWAP Rejection',
  'Trendline Breakout',
  'Support/Resistance',
  'Moving Average Crossover',
  'Scalp',
  'Naked Price Action'
];

export const EMOTIONS: EmotionOption[] = [
  { emoji: '😎', label: 'Confident' },
  { emoji: '😊', label: 'Calm' },
  { emoji: '😟', label: 'Anxious' },
  { emoji: '😡', label: 'Revenge' },
  { emoji: '😴', label: 'Bored' },
  { emoji: '🤔', label: 'Indecisive' }
];

export const INDIAN_MARKETS = [
  'NIFTY 50',
  'BANKNIFTY',
  'FINNIFTY',
  'SENSEX',
  'MIDCPNIFTY',
  'RELIANCE',
  'TCS',
  'HDFC BANK',
  'ICICI BANK',
  'INFY'
];

export const CRYPTO_MARKETS = [
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
  'DOGE/USD'
];

export const INITIAL_TRADES: Trade[] = [
  {
    id: 't1',
    symbol: 'NIFTY 50',
    type: 'BUY',
    market: 'INDEX',
    entryPrice: 22000,
    exitPrice: 22250,
    quantity: 50,
    date: '2026-05-04T10:00:00.000Z',
    strategy: 'Trendline Breakout',
    setupName: 'H4 Breakout',
    emotion: '😎',
    sl: 21900,
    tp: 22350,
    pnl: 12500, // (22250 - 22000) * 50
    pnlPercentage: 1.136, // 12500 / (22000 * 50) * 100
    notes: 'Clean breakouts above resistance on high volume. Held trade through retest and hit TP successfully.',
    status: 'CLOSED',
    recurring: 'NONE'
  },
  {
    id: 't2',
    symbol: 'BTC/USD',
    type: 'BUY',
    market: 'CRYPTO',
    entryPrice: 60000,
    exitPrice: 62400,
    quantity: 0.1,
    date: '2026-05-05T14:30:00.000Z',
    strategy: 'Support/Resistance',
    setupName: 'Daily Level Hold',
    emotion: '😊',
    sl: 59200,
    tp: 63000,
    pnl: 240, // (62400 - 60000) * 0.1
    pnlPercentage: 4.0, // 240 / (60000 * 0.1) * 100
    notes: 'Bought the bounce at the key 60k support level. Solid risk reward, calm execution.',
    status: 'CLOSED',
    recurring: 'NONE'
  },
  {
    id: 't3',
    symbol: 'BANKNIFTY',
    type: 'SELL',
    market: 'INDEX',
    entryPrice: 48000,
    exitPrice: 48400,
    quantity: 30,
    date: '2026-05-08T09:45:00.000Z',
    strategy: 'VWAP Rejection',
    setupName: 'Faded Open',
    emotion: '😟',
    sl: 47750,
    tp: 48500,
    pnl: -12000, // (48000 - 48400) * 30 for SELL
    pnlPercentage: -0.833, // -12000 / (48000 * 30) * 100
    notes: 'Tried to short VWAP extension on open but momentum was too strong. Squeezed out. Stopped out.',
    status: 'CLOSED',
    recurring: 'NONE'
  },
  {
    id: 't4',
    symbol: 'RELIANCE',
    type: 'BUY',
    market: 'EQUITY',
    entryPrice: 2800,
    exitPrice: 2860,
    quantity: 150,
    date: '2026-05-12T11:15:00.000Z',
    strategy: 'ORB 15 min',
    setupName: 'Opening Drive',
    emotion: '😎',
    sl: 2770,
    tp: 2880,
    pnl: 9000, // (2860 - 2800) * 150
    pnlPercentage: 2.143, // 9000 / (2800 * 150) * 100
    notes: 'Classic opening range breakout on heavy volume. Moved stop to break even early and rode it to target area.',
    status: 'CLOSED',
    recurring: 'NONE'
  },
  {
    id: 't5',
    symbol: 'SOL/USD',
    type: 'BUY',
    market: 'CRYPTO',
    entryPrice: 140,
    exitPrice: 132,
    quantity: 100,
    date: '2026-05-15T18:20:00.000Z',
    strategy: 'Scalp',
    setupName: 'M5 EMA Touch',
    emotion: '😡',
    sl: 136,
    tp: 146,
    pnl: -800, // (132 - 140) * 100
    pnlPercentage: -5.714, // -800 / (140 * 100) * 100
    notes: 'Violated trading rules. Moved stop loss down during the trade because of panic. Double loss. Revenge trading.',
    status: 'CLOSED',
    recurring: 'NONE'
  },
  {
    id: 't6',
    symbol: 'ETH/USD',
    type: 'BUY',
    market: 'CRYPTO',
    entryPrice: 3000,
    exitPrice: 3180,
    quantity: 4,
    date: '2026-05-18T12:00:00.000Z',
    strategy: 'Support/Resistance',
    setupName: 'H1 Range Bounce',
    emotion: '😊',
    sl: 2940,
    tp: 3200,
    pnl: 720, // (3180 - 3000) * 4
    pnlPercentage: 6.0, // 720 / (3000 * 4) * 100
    notes: 'Well planned trade from the bottom of the hourly channel. Patient hold.',
    status: 'CLOSED',
    recurring: 'NONE'
  },
  {
    id: 't7',
    symbol: 'TCS',
    type: 'SELL',
    market: 'EQUITY',
    entryPrice: 3900,
    exitPrice: 3820,
    quantity: 100,
    date: '2026-05-20T14:00:00.000Z',
    strategy: 'Moving Average Crossover',
    setupName: 'EMA 20/50 Death Cross',
    emotion: '😎',
    sl: 3940,
    tp: 3800,
    pnl: 8000, // (3900 - 3820) * 100 for SELL
    pnlPercentage: 2.051, // 8000 / (3900 * 100) * 100
    notes: 'Short entry on EMA death cross on daily chart. Stock was weak relative to Nifty. Solid trend follow.',
    status: 'CLOSED',
    recurring: 'NONE'
  }
];
