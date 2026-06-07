import express from 'express';
import cors from 'cors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let db;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create tables if they do not exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      type TEXT NOT NULL,
      market TEXT NOT NULL,
      entryPrice REAL NOT NULL,
      exitPrice REAL NOT NULL,
      quantity REAL NOT NULL,
      date TEXT NOT NULL,
      strategy TEXT NOT NULL,
      setupName TEXT,
      emotion TEXT NOT NULL,
      screenshot TEXT,
      sl REAL NOT NULL,
      tp REAL NOT NULL,
      pnl REAL NOT NULL,
      pnlPercentage REAL NOT NULL,
      notes TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CLOSED',
      recurring TEXT
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed trades if database is empty
  const tradeCount = await db.get('SELECT COUNT(*) as count FROM trades');
  if (tradeCount.count === 0) {
    console.log('Database empty. Seeding initial trades...');
    const initialTrades = [
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
        pnl: 12500,
        pnlPercentage: 1.136,
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
        pnl: 240,
        pnlPercentage: 4.0,
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
        pnl: -12000,
        pnlPercentage: -0.833,
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
        pnl: 9000,
        pnlPercentage: 2.143,
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
        pnl: -800,
        pnlPercentage: -5.714,
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
        pnl: 720,
        pnlPercentage: 6.0,
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
        pnl: 8000,
        pnlPercentage: 2.051,
        notes: 'Short entry on EMA death cross on daily chart. Stock was weak relative to Nifty. Solid trend follow.',
        status: 'CLOSED',
        recurring: 'NONE'
      }
    ];

    for (const t of initialTrades) {
      await db.run(
        `INSERT INTO trades (id, symbol, type, market, entryPrice, exitPrice, quantity, date, strategy, setupName, emotion, screenshot, sl, tp, pnl, pnlPercentage, notes, status, recurring) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.symbol, t.type, t.market, t.entryPrice, t.exitPrice, t.quantity, t.date, t.strategy, t.setupName, t.emotion, t.screenshot || null, t.sl, t.tp, t.pnl, t.pnlPercentage, t.notes, t.status, t.recurring || 'NONE']
      );
    }
  }

  // Seed default custom instructions if config is empty
  const configCount = await db.get('SELECT COUNT(*) as count FROM config WHERE key = ?', ['dharma_custom_instructions']);
  if (configCount.count === 0) {
    await db.run('INSERT INTO config (key, value) VALUES (?, ?)', ['dharma_custom_instructions', '']);
  }
}

app.get('/api/trades', async (req, res) => {
  try {
    const trades = await db.all('SELECT * FROM trades ORDER BY date DESC');
    res.json(trades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

app.post('/api/trades', async (req, res) => {
  try {
    const t = req.body;
    const existing = await db.get('SELECT id FROM trades WHERE id = ?', [t.id]);
    
    if (existing) {
      await db.run(
        `UPDATE trades SET symbol=?, type=?, market=?, entryPrice=?, exitPrice=?, quantity=?, date=?, strategy=?, setupName=?, emotion=?, screenshot=?, sl=?, tp=?, pnl=?, pnlPercentage=?, notes=?, status=?, recurring=? WHERE id=?`,
        [t.symbol, t.type, t.market, t.entryPrice, t.exitPrice, t.quantity, t.date, t.strategy, t.setupName, t.emotion, t.screenshot || null, t.sl, t.tp, t.pnl, t.pnlPercentage, t.notes, t.status || 'CLOSED', t.recurring || 'NONE', t.id]
      );
    } else {
      await db.run(
        `INSERT INTO trades (id, symbol, type, market, entryPrice, exitPrice, quantity, date, strategy, setupName, emotion, screenshot, sl, tp, pnl, pnlPercentage, notes, status, recurring) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.symbol, t.type, t.market, t.entryPrice, t.exitPrice, t.quantity, t.date, t.strategy, t.setupName, t.emotion, t.screenshot || null, t.sl, t.tp, t.pnl, t.pnlPercentage, t.notes, t.status || 'CLOSED', t.recurring || 'NONE']
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trade' });
  }
});

app.delete('/api/trades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM trades WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete trade' });
  }
});

app.get('/api/coach-instructions', async (req, res) => {
  try {
    const row = await db.get('SELECT value FROM config WHERE key = ?', ['dharma_custom_instructions']);
    res.json({ value: row ? row.value : '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch coach instructions' });
  }
});

app.post('/api/coach-instructions', async (req, res) => {
  try {
    const { value } = req.body;
    await db.run(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      ['dharma_custom_instructions', value]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update coach instructions' });
  }
});

app.get('/api/custom-strategies', async (req, res) => {
  try {
    const row = await db.get('SELECT value FROM config WHERE key = ?', ['dharma_custom_strategies']);
    if (row) {
      res.json(JSON.parse(row.value));
    } else {
      const defaultStrats = [
        'ORB 15 min',
        'VWAP Rejection',
        'Trendline Breakout',
        'Support/Resistance',
        'Moving Average Crossover',
        'Scalp',
        'Naked Price Action'
      ];
      res.json(defaultStrats);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch custom strategies' });
  }
});

app.post('/api/custom-strategies', async (req, res) => {
  try {
    const { strategies } = req.body;
    await db.run(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      ['dharma_custom_strategies', JSON.stringify(strategies)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update custom strategies' });
  }
});

app.get('/api/starting-capital', async (req, res) => {
  try {
    const row = await db.get('SELECT value FROM config WHERE key = ?', ['starting_capital']);
    res.json({ value: row ? parseFloat(row.value) : 1254300 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch starting capital' });
  }
});

app.post('/api/starting-capital', async (req, res) => {
  try {
    const { value } = req.body;
    await db.run(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      ['starting_capital', String(value)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update starting capital' });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    await db.run('DELETE FROM trades');
    await db.run('DELETE FROM config');
    await initDb();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Serve static assets from dist/ folder
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback for SPA Routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize DB and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
