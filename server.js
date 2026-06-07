import express from 'express';
import cors from 'cors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'journal_secret_key_123_abc';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let db;

async function seedUserTrades(userId) {
  const initialTrades = [
    {
      id: `${userId}_t1`,
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
      id: `${userId}_t2`,
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
      id: `${userId}_t3`,
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
      id: `${userId}_t4`,
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
      id: `${userId}_t5`,
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
      id: `${userId}_t6`,
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
      id: `${userId}_t7`,
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
      `INSERT INTO trades (id, symbol, type, market, entryPrice, exitPrice, quantity, date, strategy, setupName, emotion, screenshot, sl, tp, pnl, pnlPercentage, notes, status, recurring, strikePrice, optionType, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.symbol, t.type, t.market, t.entryPrice, t.exitPrice, t.quantity, t.date, t.strategy, t.setupName, t.emotion, t.screenshot || null, t.sl, t.tp, t.pnl, t.pnlPercentage, t.notes, t.status, t.recurring || 'NONE', null, 'NONE', userId]
    );
  }

  // Seed default configurations
  await db.run('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)', [`${userId}_starting_capital`, '1254300']);
  await db.run('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)', [`${userId}_dharma_custom_instructions`, '']);
}

async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create tables if they do not exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

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
      recurring TEXT,
      strikePrice REAL,
      optionType TEXT,
      userId TEXT
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrate schema for existing databases (adds columns if missing)
  try {
    await db.exec(`ALTER TABLE trades ADD COLUMN strikePrice REAL;`);
  } catch (e) { /* Ignore */ }
  try {
    await db.exec(`ALTER TABLE trades ADD COLUMN optionType TEXT;`);
  } catch (e) { /* Ignore */ }
  try {
    await db.exec(`ALTER TABLE trades ADD COLUMN userId TEXT;`);
  } catch (e) { /* Ignore */ }

  // Migrate any old trades with missing userId to the default demo user
  try {
    await db.run(`UPDATE trades SET userId = 'demo_user_id' WHERE userId IS NULL`);
  } catch (e) { /* Ignore */ }

  // Create a default user if users is empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding default user "demo" (password: "demo")...');
    const demoUserId = 'demo_user_id';
    const hashedPassword = await bcrypt.hash('demo', 10);
    await db.run(
      'INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)',
      [demoUserId, 'demo', hashedPassword]
    );
    await seedUserTrades(demoUserId);
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Authentication Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const userId = 'u_' + Math.random().toString(36).substring(2, 11);
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run(
      'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
      [userId, cleanUsername, hashedPassword]
    );

    // Seed mock data for this user
    await seedUserTrades(userId);

    const token = jwt.sign({ id: userId, username: cleanUsername }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: userId, username: cleanUsername } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [cleanUsername]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Protected API Endpoints
app.get('/api/trades', authenticateToken, async (req, res) => {
  try {
    const trades = await db.all('SELECT * FROM trades WHERE userId = ? ORDER BY date DESC', [req.user.id]);
    res.json(trades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

app.post('/api/trades', authenticateToken, async (req, res) => {
  try {
    const t = req.body;
    const existing = await db.get('SELECT id FROM trades WHERE id = ? AND userId = ?', [t.id, req.user.id]);
    
    if (existing) {
      await db.run(
        `UPDATE trades SET symbol=?, type=?, market=?, entryPrice=?, exitPrice=?, quantity=?, date=?, strategy=?, setupName=?, emotion=?, screenshot=?, sl=?, tp=?, pnl=?, pnlPercentage=?, notes=?, status=?, recurring=?, strikePrice=?, optionType=? WHERE id=? AND userId=?`,
        [t.symbol, t.type, t.market, t.entryPrice, t.exitPrice, t.quantity, t.date, t.strategy, t.setupName, t.emotion, t.screenshot || null, t.sl, t.tp, t.pnl, t.pnlPercentage, t.notes, t.status || 'CLOSED', t.recurring || 'NONE', t.strikePrice || null, t.optionType || 'NONE', t.id, req.user.id]
      );
    } else {
      await db.run(
        `INSERT INTO trades (id, symbol, type, market, entryPrice, exitPrice, quantity, date, strategy, setupName, emotion, screenshot, sl, tp, pnl, pnlPercentage, notes, status, recurring, strikePrice, optionType, userId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.symbol, t.type, t.market, t.entryPrice, t.exitPrice, t.quantity, t.date, t.strategy, t.setupName, t.emotion, t.screenshot || null, t.sl, t.tp, t.pnl, t.pnlPercentage, t.notes, t.status || 'CLOSED', t.recurring || 'NONE', t.strikePrice || null, t.optionType || 'NONE', req.user.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trade' });
  }
});

app.delete('/api/trades/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM trades WHERE id = ? AND userId = ?', [id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete trade' });
  }
});

app.get('/api/coach-instructions', authenticateToken, async (req, res) => {
  try {
    const row = await db.get('SELECT value FROM config WHERE key = ?', [`${req.user.id}_dharma_custom_instructions`]);
    res.json({ value: row ? row.value : '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch coach instructions' });
  }
});

app.post('/api/coach-instructions', authenticateToken, async (req, res) => {
  try {
    const { value } = req.body;
    await db.run(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      [`${req.user.id}_dharma_custom_instructions`, value]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update coach instructions' });
  }
});

app.get('/api/custom-strategies', authenticateToken, async (req, res) => {
  try {
    const row = await db.get('SELECT value FROM config WHERE key = ?', [`${req.user.id}_dharma_custom_strategies`]);
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

app.post('/api/custom-strategies', authenticateToken, async (req, res) => {
  try {
    const { strategies } = req.body;
    await db.run(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      [`${req.user.id}_dharma_custom_strategies`, JSON.stringify(strategies)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update custom strategies' });
  }
});

app.get('/api/starting-capital', authenticateToken, async (req, res) => {
  try {
    const row = await db.get('SELECT value FROM config WHERE key = ?', [`${req.user.id}_starting_capital`]);
    res.json({ value: row ? parseFloat(row.value) : 1254300 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch starting capital' });
  }
});

app.post('/api/starting-capital', authenticateToken, async (req, res) => {
  try {
    const { value } = req.body;
    await db.run(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      [`${req.user.id}_starting_capital`, String(value)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update starting capital' });
  }
});

app.post('/api/reset', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM trades WHERE userId = ?', [req.user.id]);
    await db.run('DELETE FROM config WHERE key LIKE ? OR key LIKE ?', [`${req.user.id}_%`, `${req.user.id}_%`]);
    await seedUserTrades(req.user.id);
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
