import { useState, useEffect } from 'react';
import type { Trade, TabType } from './types';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LogTradeView } from './components/LogTradeView';
import { HistoryView } from './components/HistoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Calendar } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [startingCapital, setStartingCapital] = useState<number>(1254300);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState<boolean>(false);
  const [tempCapital, setTempCapital] = useState<string>('1254300');

  const handleOpenCapitalModal = () => {
    setTempCapital(startingCapital.toString());
    setIsCapitalModalOpen(true);
  };

  // Global Image modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Global Date Filter State
  const [timeframe, setTimeframe] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Load trades, coach instructions, and starting capital from backend SQLite database
  useEffect(() => {
    async function loadData() {
      try {
        const [tradesRes, instRes, capRes] = await Promise.all([
          fetch('/api/trades'),
          fetch('/api/coach-instructions'),
          fetch('/api/starting-capital')
        ]);
        if (!tradesRes.ok || !instRes.ok || !capRes.ok) {
          throw new Error('Failed to load data from server');
        }
        const tradesData = await tradesRes.json();
        const instData = await instRes.json();
        const capData = await capRes.json();
        setTrades(tradesData);
        setCustomInstructions(instData.value);
        setStartingCapital(capData.value);
      } catch (e) {
        console.error('Error loading data from API', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateStartingCapital = async (value: number) => {
    setStartingCapital(value);
    try {
      await fetch('/api/starting-capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
    } catch (e) {
      console.error('Failed to update starting capital', e);
    }
  };

  // Debounce saving custom instructions to SQLite database (avoids storming the backend)
  useEffect(() => {
    if (isLoading) return;
    const delayDebounceFn = setTimeout(() => {
      fetch('/api/coach-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: customInstructions })
      }).catch(err => console.error('Failed to save custom instructions', err));
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [customInstructions, isLoading]);

  // Handle Trade Addition
  const handleAddTrade = async (newTrade: Trade) => {
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrade)
      });
      if (!res.ok) throw new Error('Network response was not ok');
      setTrades((prev) => [newTrade, ...prev]);
    } catch (e) {
      console.error('Failed to add trade', e);
      alert('Error: Could not save the trade to the database.');
    }
  };

  // Handle Trade Deletion
  const handleDeleteTrade = async (id: string) => {
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Network response was not ok');
      setTrades((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error('Failed to delete trade', e);
      alert('Error: Could not delete the trade from the database.');
    }
  };

  // Handle Reset Trades
  const handleResetTrades = async () => {
    if (confirm('Are you sure you want to reset all trades to default mock data? This will overwrite your current logs.')) {
      try {
        setIsLoading(true);
        const res = await fetch('/api/reset', {
          method: 'POST'
        });
        if (!res.ok) throw new Error('Network response was not ok');
        
        // Reload all data
        const [tradesRes, instRes, capRes] = await Promise.all([
          fetch('/api/trades'),
          fetch('/api/coach-instructions'),
          fetch('/api/starting-capital')
        ]);
        if (tradesRes.ok && instRes.ok && capRes.ok) {
          const tradesData = await tradesRes.json();
          const instData = await instRes.json();
          const capData = await capRes.json();
          setTrades(tradesData);
          setCustomInstructions(instData.value);
          setStartingCapital(capData.value);
        }
        setTimeframe('ALL');
      } catch (e) {
        console.error('Failed to reset trades', e);
        alert('Error: Could not reset database.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Extract unique months in chronological order from trade logs
  const uniqueMonths = Array.from(
    new Set(
      trades.map((t) => {
        const dateObj = new Date(t.date);
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  )
    .sort((a, b) => b.localeCompare(a)) // Sort newest first
    .map((monthKey) => {
      const [year, month] = monthKey.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      const label = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return { value: monthKey, label };
    });

  // Filter trades dynamically based on the global date filter
  const filteredTrades = trades.filter((t) => {
    if (timeframe === 'ALL') return true;

    const tradeDateStr = t.date.split('T')[0]; // e.g. '2026-05-04'

    if (timeframe === 'CUSTOM') {
      const matchesStart = startDate ? tradeDateStr >= startDate : true;
      const matchesEnd = endDate ? tradeDateStr <= endDate : true;
      return matchesStart && matchesEnd;
    }

    // Monthly filter (e.g. timeframe is '2026-05')
    return tradeDateStr.startsWith(timeframe);
  });

  const isFiltered = timeframe !== 'ALL' && (timeframe !== 'CUSTOM' || startDate !== '' || endDate !== '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-[#1C1C1E] flex flex-col items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Outer Ring */}
            <div className="absolute w-16 h-16 rounded-full border-4 border-[#166534]/20 animate-ping" />
            {/* Spinning Inner Arc */}
            <div className="w-16 h-16 rounded-full border-4 border-t-[#166534] border-r-transparent border-b-[#166534]/40 border-l-transparent animate-spin" />
            {/* Static Core Icon placeholder */}
            <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-[#244230] to-[#5C8A6E] flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-black">J</span>
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-base font-extrabold font-display tracking-tight text-[#1c1c1e]">
              Journal.ai Database
            </h1>
            <p className="text-xs font-bold text-[#5c5c5e] uppercase tracking-wider animate-pulse">
              Connecting to VPS Server...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1C1C1E] flex flex-col font-sans select-none antialiased">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        startingCapital={startingCapital}
        onEditCapital={handleOpenCapitalModal}
      />

      {/* Global Date Filter Toolbar */}
      {activeTab !== 'LOG' && (
        <div className="bg-[#FAFAF7]/80 backdrop-blur-md border-b border-[#D9D9D2]/70 px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-[#1C1C1E] sticky top-[61px] md:top-[73px] z-30">
          <div className="flex items-center gap-2 text-[#5C5C5E]">
            <Calendar size={14} />
            <span>TIMEFRAME FILTER:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown selection */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-white border border-[#D9D9D2] px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#244230] text-xs font-bold text-[#1C1C1E] cursor-pointer"
            >
              <option value="ALL">All Time</option>
              {uniqueMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value="CUSTOM">Custom Date Range...</option>
            </select>

            {/* Custom Range picker inputs */}
            {timeframe === 'CUSTOM' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-[#D9D9D2] px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#244230] text-xs font-semibold text-[#1C1C1E]"
                />
                <span className="text-[#5C5C5E] font-medium">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-[#D9D9D2] px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#244230] text-xs font-semibold text-[#1C1C1E]"
                />
              </div>
            )}

            {/* Indicator pill */}
            {isFiltered && (
              <span className="bg-[#D4E8DC] text-[#166534] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-ping" />
                <span>FILTERED: {filteredTrades.length} TRADES</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area with elegant AnimatePresence tab transitions */}
      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'DASHBOARD' && (
            <motion.div
              key="dashboard"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <DashboardView
                trades={filteredTrades}
                startingCapital={startingCapital}
                onEditCapital={handleOpenCapitalModal}
                customInstructions={customInstructions}
                setCustomInstructions={setCustomInstructions}
                onSelectTradeImage={setSelectedImage}
                onResetTrades={handleResetTrades}
              />
            </motion.div>
          )}

          {activeTab === 'LOG' && (
            <motion.div
              key="log"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <LogTradeView onAddTrade={handleAddTrade} setActiveTab={setActiveTab} />
            </motion.div>
          )}

          {activeTab === 'HISTORY' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <HistoryView
                trades={filteredTrades}
                onDeleteTrade={handleDeleteTrade}
              />
            </motion.div>
          )}

          {activeTab === 'ANALYTICS' && (
            <motion.div
              key="analytics"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <AnalyticsView trades={filteredTrades} onSelectTradeImage={setSelectedImage} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Starting Capital Edit Modal */}
      <AnimatePresence>
        {isCapitalModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCapitalModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-[#D9D9D2] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-[#D9D9D2]/60">
                <h3 className="text-base font-extrabold font-display text-[#1C1C1E] uppercase tracking-tight">
                  Update Starting Capital
                </h3>
                <button
                  onClick={() => setIsCapitalModalOpen(false)}
                  className="text-[#5C5C5E] hover:text-[#1C1C1E] p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider block">
                  Enter New Starting Capital (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#5C5C5E]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={tempCapital}
                    onChange={(e) => setTempCapital(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl pl-8 pr-4 py-3 text-sm font-extrabold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#244230]"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-[#5C5C5E] font-medium leading-relaxed">
                  Your Net Portfolio Equity, Win Rate impact metrics, Max Drawdown calculation, and AI Coach insights will instantly update based on this starting capital.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCapitalModalOpen(false)}
                  className="px-4 py-2 border border-[#D9D9D2] text-[#5C5C5E] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseFloat(tempCapital);
                    handleUpdateStartingCapital(isNaN(parsed) ? 0 : parsed);
                    setIsCapitalModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#244230] text-white rounded-xl text-xs font-bold hover:bg-[#1b3224] transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Backdrop-blur Fullscreen Screenshot Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative max-w-5xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Trade Chart Fullscreen"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 sm:right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
