import React, { useState, useEffect, useRef } from 'react';
import type { Trade } from '../types';
import { STRATEGIES, EMOTIONS, INDIAN_MARKETS, CRYPTO_MARKETS } from '../constants';
import { Plus, Search, X, Check, Calculator, Eye, HelpCircle } from 'lucide-react';

interface LogTradeViewProps {
  onAddTrade: (trade: Trade) => void;
  setActiveTab: (tab: 'DASHBOARD' | 'LOG' | 'HISTORY' | 'ANALYTICS') => void;
}

export const LogTradeView: React.FC<LogTradeViewProps> = ({ onAddTrade, setActiveTab }) => {
  // Form State
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState<'EQUITY' | 'INDEX' | 'CRYPTO'>('EQUITY');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [sl, setSl] = useState<string>('');
  const [tp, setTp] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [strikePrice, setStrikePrice] = useState<string>('');
  const [optionType, setOptionType] = useState<'CE' | 'PE' | 'NONE'>('NONE');
  const [strategiesList, setStrategiesList] = useState<string[]>(STRATEGIES);
  const [strategy, setStrategy] = useState<string>(STRATEGIES[0]);

  // Fetch strategies from backend API
  useEffect(() => {
    fetch('/api/custom-strategies')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setStrategiesList(data);
        if (data.length > 0) {
          setStrategy(data[0]);
        }
      })
      .catch((e) => console.error('Failed to load strategies', e));
  }, []);

  const [emotion, setEmotion] = useState<string>('😎');
  const [notes, setNotes] = useState('');

  // Search dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStrategyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_CUSTOM') {
      const custom = prompt('Enter your custom strategy setup name:');
      if (custom && custom.trim()) {
        const cleanCustom = custom.trim();
        if (strategiesList.includes(cleanCustom)) {
          setStrategy(cleanCustom);
          return;
        }
        const updatedList = [...strategiesList, cleanCustom];
        setStrategiesList(updatedList);
        setStrategy(cleanCustom);
        
        try {
          await fetch('/api/custom-strategies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strategies: updatedList })
          });
        } catch (err) {
          console.error('Failed to save strategy list', err);
        }
      } else {
        setStrategy(strategiesList[0]);
      }
    } else {
      setStrategy(val);
    }
  };

  // Filter symbols based on market type and search query
  const marketSymbols = market === 'CRYPTO' ? CRYPTO_MARKETS : INDIAN_MARKETS;
  const filteredSymbols = marketSymbols.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Live P&L and Risk Calculations
  const numEntry = parseFloat(entryPrice) || 0;
  const numExit = parseFloat(exitPrice) || 0;
  const numQty = parseFloat(quantity) || 0;
  const numSl = parseFloat(sl) || 0;
  const numTp = parseFloat(tp) || 0;

  let livePnL = 0;
  let livePnLPercent = 0;
  let riskReward = 0;

  const isClosed = exitPrice.trim() !== '';

  if (numEntry > 0 && numQty > 0) {
    if (isClosed) {
      // P&L = (exit - entry) * qty for BUY, reversed for SELL
      livePnL = type === 'BUY' ? (numExit - numEntry) * numQty : (numEntry - numExit) * numQty;
      // % P&L = pnl / (entry * qty) * 100
      livePnLPercent = (livePnL / (numEntry * numQty)) * 100;
    }

    // Risk Reward ratio: (TP - Entry) / (Entry - SL) for BUY, (Entry - TP) / (SL - Entry) for SELL
    if (numSl > 0 && numTp > 0) {
      if (type === 'BUY') {
        const potentialRisk = numEntry - numSl;
        const potentialReward = numTp - numEntry;
        riskReward = potentialRisk > 0 ? potentialReward / potentialRisk : 0;
      } else {
        const potentialRisk = numSl - numEntry;
        const potentialReward = numEntry - numTp;
        riskReward = potentialRisk > 0 ? potentialReward / potentialRisk : 0;
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol.trim()) {
      alert('Please select or type a symbol.');
      return;
    }
    if (numEntry <= 0 || numQty <= 0 || numExit <= 0) {
      alert('Please enter valid Entry Price, Exit Price and Quantity.');
      return;
    }

    // Math values
    const calculatedPnL = type === 'BUY' ? (numExit - numEntry) * numQty : (numEntry - numExit) * numQty;
    const calculatedPnLPercent = (calculatedPnL / (numEntry * numQty)) * 100;

    const newTrade: Trade = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      symbol: symbol.toUpperCase(),
      type,
      market,
      entryPrice: numEntry,
      exitPrice: numExit,
      quantity: numQty,
      date: new Date(date).toISOString(),
      strategy,
      emotion,
      sl: numSl,
      tp: numTp,
      pnl: calculatedPnL,
      pnlPercentage: calculatedPnLPercent,
      notes: notes.trim(),
      status: 'CLOSED',
      recurring: 'NONE',
      strikePrice: market === 'INDEX' && strikePrice ? parseFloat(strikePrice) : undefined,
      optionType: market === 'INDEX' ? optionType : 'NONE'
    };

    onAddTrade(newTrade);
    setActiveTab('DASHBOARD');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-12 space-y-4 md:space-y-6">
      
      <div>
        <h2 className="text-xl font-bold font-display text-[#1C1C1E]">
          Log New Trade
        </h2>
        <p className="text-xs font-medium text-[#5C5C5E]">
          Record execution specifics, emotional anchors, and technical setups
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core details fields (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6 bg-white border border-[#D9D9D2] p-4 md:p-6 rounded-xl md:rounded-2xl premium-shadow">
          
          {/* Market & Direction Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Market Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Market Type
              </label>
              <div className="flex bg-[#EAEAE2] p-1 rounded-xl gap-1">
                {(['EQUITY', 'INDEX', 'CRYPTO'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMarket(m);
                      setSymbol('');
                      setSearchQuery('');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      market === m
                        ? 'bg-[#244230] text-white'
                        : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
                    }`}
                  >
                    {m === 'INDEX' ? 'OPTION' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Direction BUY/SELL */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Trade Direction
              </label>
              <div className="flex bg-[#EAEAE2] p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setType('BUY')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                    type === 'BUY'
                      ? 'bg-[#166534] text-white'
                      : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setType('SELL')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                    type === 'SELL'
                      ? 'bg-[#991B1B] text-white'
                      : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>
            </div>

          </div>

          {/* Symbol & Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* Searchable dropdown */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Symbol
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value);
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="e.g. NIFTY 50, BTC/USD, RELIANCE"
                  className="w-full px-4 py-2.5 pl-10 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
                />
                <Search size={14} className="absolute left-3.5 top-3.5 text-[#5C5C5E]" />
                {symbol && (
                  <button
                    type="button"
                    onClick={() => {
                      setSymbol('');
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-3 text-[#5C5C5E] hover:text-[#1C1C1E]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown panel */}
              {showDropdown && (
                <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white border border-[#D9D9D2] rounded-xl shadow-lg z-50 py-1.5 scrollbar-thin">
                  {filteredSymbols.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSymbol(s);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-[#1C1C1E] hover:bg-[#FAFAF7] flex items-center justify-between"
                    >
                      <span>{s}</span>
                      {symbol.toUpperCase() === s.toUpperCase() && (
                        <Check size={12} className="text-[#166534]" />
                      )}
                    </button>
                  ))}
                  {filteredSymbols.length === 0 && searchQuery && (
                    <div className="px-4 py-2 text-[10px] font-bold text-[#5C5C5E]">
                      Type custom asset symbol: "{searchQuery.toUpperCase()}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Trade Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
              />
            </div>

          </div>

          {/* Pricing Row 1: Entry, Exit, Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Entry Price (₹)
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-4 py-2.5 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Exit Price (₹)
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-4 py-2.5 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Quantity
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
                className="w-full px-4 py-2.5 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
              />
            </div>

          </div>

          {/* Index Option Specific Details */}
          {market === 'INDEX' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                  Strike Price (e.g. 22100)
                </label>
                <input
                  type="number"
                  step="any"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                  placeholder="Enter Strike Price"
                  className="w-full px-4 py-2.5 text-xs bg-white border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                  Option Type
                </label>
                <div className="flex bg-[#EAEAE2] p-1 rounded-xl gap-1">
                  {(['CE', 'PE', 'NONE'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setOptionType(opt)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        optionType === opt
                          ? 'bg-[#244230] text-white'
                          : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
                      }`}
                    >
                      {opt === 'NONE' ? 'Not Option' : opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stop Loss and Take Profit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Stop Loss (SL)
              </label>
              <input
                type="number"
                step="any"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Take Profit (TP)
              </label>
              <input
                type="number"
                step="any"
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
              />
            </div>

          </div>

          {/* Strategy Setup */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
              Strategy Setup
            </label>
            <select
              value={strategy}
              onChange={handleStrategyChange}
              className="w-full px-4 py-2.5 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E] appearance-none"
            >
              {strategiesList.map((strat) => (
                <option key={strat} value={strat}>
                  {strat}
                </option>
              ))}
              <option value="ADD_CUSTOM" className="text-[#166534] font-bold">
                + Add Custom Strategy Setup...
              </option>
            </select>
          </div>

          {/* Emotion Grid */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
              Trading Emotion
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {EMOTIONS.map((em) => (
                <button
                  key={em.label}
                  type="button"
                  onClick={() => setEmotion(em.emoji)}
                  className={`flex flex-col items-center p-2.5 border rounded-xl transition-all ${
                    emotion === em.emoji
                      ? 'border-[#244230] bg-[#EAEAE2] scale-105'
                      : 'border-[#D9D9D2] bg-white hover:bg-[#FAFAF7]'
                  }`}
                >
                  <span className="text-xl mb-1">{em.emoji}</span>
                  <span className="text-[9px] font-bold text-[#5C5C5E] uppercase tracking-tight">{em.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
              Trade Notes & Context
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail your execution process: why did you enter here? Did you experience psychological friction or slippage?"
              rows={4}
              className="w-full p-4 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-semibold text-[#1C1C1E] resize-none"
            />
          </div>

        </div>

        {/* Sidebar Calculator / Live Preview (Col 3) */}
        <div className="space-y-6">
          
          {/* Live Math / PNL preview */}
          <div className="bg-white border border-[#D9D9D2] p-4 md:p-5 rounded-xl md:rounded-2xl premium-shadow space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D9D9D2]/50 pb-3">
              <Calculator size={18} className="text-[#5C5C5E]" />
              <h3 className="text-sm font-extrabold text-[#1C1C1E]">
                Execution Calculator
              </h3>
            </div>

            {/* Calculations Card */}
            {numEntry > 0 && numQty > 0 ? (
              <div className="space-y-4">
                <div className="text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#5C5C5E] block">TOTAL RISK CAPITAL</span>
                    <span className="text-sm font-extrabold text-[#1C1C1E]">₹{(numEntry * numQty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {isClosed ? (
                  <div className={`p-4 rounded-xl text-center space-y-1 ${
                    livePnL >= 0 ? 'bg-[#D4E8DC]/40' : 'bg-[#FADCDC]/40'
                  }`}>
                    <span className="text-[10px] font-bold text-[#5C5C5E] block uppercase">Estimated Realized P&L</span>
                    <span className={`text-xl font-black font-display block ${
                      livePnL >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                    }`}>
                      {livePnL >= 0 ? '+' : ''}₹{livePnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs font-extrabold ${
                      livePnL >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                    }`}>
                      {livePnL >= 0 ? '+' : ''}{livePnLPercent.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl space-y-3">
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider">
                      <Eye size={12} strokeWidth={2.5} />
                      <span>Live Setup Diagnostics</span>
                    </div>
                    {numSl > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#5C5C5E]">Stop Loss Risk:</span>
                        <span className="font-extrabold text-[#991B1B]">
                          -₹{Math.abs(type === 'BUY' ? (numEntry - numSl) * numQty : (numSl - numEntry) * numQty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {numTp > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#5C5C5E]">Take Profit Reward:</span>
                        <span className="font-extrabold text-[#166534]">
                          +₹{Math.abs(type === 'BUY' ? (numTp - numEntry) * numQty : (numEntry - numTp) * numQty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {riskReward > 0 && (
                      <div className="pt-2 border-t border-[#D9D9D2]/50 flex justify-between items-center text-xs">
                        <span className="font-bold text-[#1C1C1E]">Risk:Reward Ratio:</span>
                        <span className="font-extrabold text-[#244230] bg-[#D4E8DC] px-2 py-0.5 rounded-full text-[10px]">
                          1 : {riskReward.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#5C5C5E] font-medium space-y-2">
                <HelpCircle size={32} className="mx-auto text-[#D9D9D2]" />
                <p>Fill Entry Price and Quantity to see real-time performance diagnostics and risk analysis.</p>
              </div>
            )}

          </div>


          {/* Submit Action */}
          <button
            type="submit"
            className="w-full bg-[#244230] hover:bg-[#1D3526] text-white py-3 rounded-xl md:rounded-2xl font-extrabold text-sm premium-shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>SAVE JOURNAL ENTRY</span>
          </button>

        </div>

      </form>

    </div>
  );
};
