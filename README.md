# Journal.ai — Multi-User Portfolio & Analytics Engine

**Journal.ai** is a premium, high-performance trading journal designed for Indian (NSE/BSE) and Crypto markets. Built with modern UI design principles, it offers traders native multi-user support, real-time analytics, psychological trade tracking, and an automated AI Coach.

---

## 🚀 Key Features

* **🔐 Multi-User Authentication**: Secure registration and login using `bcryptjs` password hashing and 30-day JWT sessions.
* **📂 Strict Data Isolation**: Fully private workspaces. Trades, starting capital, and strategies are isolated securely in the SQLite database by user ID.
* **📈 Premium Analytics Dashboard**:
  * **Win Rate & Drawdown Metrics**: Instantly calculated based on custom starting capital.
  * **Interactive Equity Curve**: Displays cumulative performance over time.
  * **Trading Calendar Heatmap**: Displays daily green/red P&L performance.
  * **Size vs. P&L Scatter Plot**: Audits relationship between trade sizing and risk.
* **🧠 Dharma AI Coach**: Auto-analyzes focus items, psychological tags (Calm, Confident, Anxious, Revenge), and highlights emotional leaks in your trading.
* **📱 Responsive Design**: Fully optimized mobile layout with interactive bottom navigation bar and accessible logout indicators.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Vite, TailwindCSS (for utility layout structure), Recharts (data visualizations), Framer Motion (micro-animations).
* **Backend**: Node.js, Express, SQLite3, SQLite-async (data layer), jsonwebtoken (auth tokens), bcryptjs (hashing).
* **Production/VPS**: Nginx (Reverse Proxy), PM2 (Process Manager), Let's Encrypt (Certbot SSL encryption).

---

## 💻 Local Quick Start

To run the application locally on your machine:

### 1. Prerequisites
Make sure you have **Node.js** (v18 or newer) installed.

### 2. Installation & Running
```bash
# Clone the repository
git clone https://github.com/saniroy3311-spec/Journal.ai.git
cd Journal.ai

# Install dependencies
npm install

# Compile the frontend assets
npm run build

# Start the Express server
npm start
```
Open **`http://localhost:3000`** in your browser. 
- You can log in using the pre-seeded account: **username**: `demo` / **password**: `demo`
- Or click **Create Account** to register a blank, private workspace.

---

## 🌐 VPS Deployment & Management

The application is deployed on a **Hostinger VPS** using a secure Nginx reverse proxy and PM2 for 24/7 background uptime.

### ⬇️ Update VPS to Latest Version
To pull the newest updates from GitHub and restart the server, run this on your VPS terminal:
```bash
cd /var/www/trading-journal && git reset --hard && git pull origin main && npm install && npm run build && pm2 restart trading-journal --update-env
```

### 🔍 PM2 Command Reference
```bash
# Check running status of the server
pm2 status

# View live log output stream
pm2 logs trading-journal

# Restart the process manually
pm2 restart trading-journal
```

### 🔒 Secure SSL Domain
The VPS is secure and accessible over HTTPS using a wildcard DNS setup:
👉 **[https://187-127-136-139.sslip.io](https://187-127-136-139.sslip.io)**
