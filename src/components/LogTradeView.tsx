import React, { useState, useEffect, useRef } from 'react';
import type { Trade, Execution } from '../types';
import { STRATEGIES, PRESET_TAGS, EMOTIONS, STOCK_MARKETS, CRYPTO_MARKETS } from '../constants';
import { Plus, Search, X, Check, Calculator, Eye, HelpCircle, Trash2, Tag, Zap, Smile, Frown, Angry, Meh } from 'lucide-react';

const EMOTION_MAP: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  '😎': { icon: Zap, color: '#D4AF37' },
  '😊': { icon: Smile, color: '#166534' },
  '😟': { icon: Frown, color: '#D97706' },
  '😡': { icon: Angry, color: '#B91C1C' },
  '😴': { icon: Meh, color: '#6B7280' },
  '🤔': { icon: HelpCircle, color: '#2563EB' }
};

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
  const [strategy, setStrategy] = useState<string>('');
  const [isCustomStrategyModalOpen, setIsCustomStrategyModalOpen] = useState(false);
  const [newStrategyInput, setNewStrategyInput] = useState('');

  // Tags & Multiple Executions (Scale-In / Scale-Out) State
  const [tags, setTags] = useState<string[]>([]);
  const [useExecutions, setUseExecutions] = useState(false);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [execType, setExecType] = useState<'BUY' | 'SELL'>('BUY');
  const [execPrice, setExecPrice] = useState('');
  const [execQty, setExecQty] = useState('');

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const handleAddExecution = () => {
    const price = parseFloat(execPrice);
    const qty = parseFloat(execQty);
    if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
      alert('Please enter a valid price and quantity for the execution.');
      return;
    }

    const newExec: Execution = {
      id: Math.random().toString(36).substring(2, 11),
      type: execType,
      price,
      quantity: qty,
      date: new Date().toISOString()
    };

    const updated = [...executions, newExec];
    setExecutions(updated);
    setExecPrice('');
    setExecQty('');

    recalculateFromExecutions(updated);
  };

  const handleRemoveExecution = (id: string) => {
    const updated = executions.filter(e => e.id !== id);
    setExecutions(updated);
    recalculateFromExecutions(updated);
  };

  const recalculateFromExecutions = (execList: Execution[]) => {
    if (execList.length === 0) {
      setEntryPrice('');
      setExitPrice('');
      setQuantity('');
      return;
    }

    // First execution determines trade direction
    const firstType = execList[0].type;
    setType(firstType);

    const entrySide = firstType;
    const exitSide = firstType === 'BUY' ? 'SELL' : 'BUY';

    const entries = execList.filter(e => e.type === entrySide);
    const exits = execList.filter(e => e.type === exitSide);

    let totalEntryCost = 0;
    let totalEntryQty = 0;
    entries.forEach(e => {
      totalEntryCost += e.price * e.quantity;
      totalEntryQty += e.quantity;
    });

    let totalExitRevenue = 0;
    let totalExitQty = 0;
    exits.forEach(e => {
      totalExitRevenue += e.price * e.quantity;
      totalExitQty += e.quantity;
    });

    const avgEntry = totalEntryQty > 0 ? totalEntryCost / totalEntryQty : 0;
    const avgExit = totalExitQty > 0 ? totalExitRevenue / totalExitQty : avgEntry;
    const qty = totalEntryQty;

    setEntryPrice(avgEntry > 0 ? avgEntry.toFixed(2) : '');
    setExitPrice(avgExit > 0 ? avgExit.toFixed(2) : '');
    setQuantity(qty > 0 ? qty.toFixed(2) : '');
  };

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

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_CUSTOM') {
      setIsCustomStrategyModalOpen(true);
      setNewStrategyInput('');
    } else {
      setStrategy(val);
    }
  };

  const handleAddCustomStrategy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCustom = newStrategyInput.trim();
    if (!cleanCustom) {
      alert('Please enter a valid strategy setup name.');
      return;
    }
    
    if (strategiesList.includes(cleanCustom)) {
      setStrategy(cleanCustom);
      setIsCustomStrategyModalOpen(false);
      return;
    }
    
    const updatedList = [...strategiesList, cleanCustom];
    setStrategiesList(updatedList);
    setStrategy(cleanCustom);
    setIsCustomStrategyModalOpen(false);
    
    try {
      await fetch('/api/custom-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategies: updatedList })
      });
    } catch (err) {
      console.error('Failed to save strategy list', err);
    }
  };

  // Filter symbols based on market type and search query
  const marketSymbols = market === 'CRYPTO' ? CRYPTO_MARKETS : STOCK_MARKETS;
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
    if (!strategy) {
      alert('Please select or add a strategy setup.');
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
      optionType: market === 'INDEX' ? optionType : 'NONE',
      tags,
      executions: useExecutions ? executions : []
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

          {/* Scale-In / Scale-Out Execution Logger Toggle & Form */}
          <div className="p-4 bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-extrabold text-[#1C1C1E] block">
                  Scale-In / Scale-Out Execution Logs
                </label>
                <span className="text-[10px] text-[#5C5C5E] font-medium leading-none">
                  Enable to log multiple partial entries and exits
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseExecutions(!useExecutions);
                  if (!useExecutions) {
                    setExecutions([]);
                    setEntryPrice('');
                    setExitPrice('');
                    setQuantity('');
                  }
                }}
                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                  useExecutions ? 'bg-[#244230]' : 'bg-[#EAEAE2]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    useExecutions ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {useExecutions && (
              <div className="space-y-4 border-t border-[#D9D9D2]/50 pt-3">
                {/* Execution input form */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-[#5C5C5E] uppercase">Type</span>
                    <div className="flex bg-[#EAEAE2] p-0.5 rounded-lg gap-0.5">
                      <button
                        type="button"
                        onClick={() => setExecType('BUY')}
                        className={`flex-1 py-1 text-[10px] font-extrabold rounded ${
                          execType === 'BUY' ? 'bg-[#166534] text-white' : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setExecType('SELL')}
                        className={`flex-1 py-1 text-[10px] font-extrabold rounded ${
                          execType === 'SELL' ? 'bg-[#991B1B] text-white' : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-[#5C5C5E] uppercase">Price (₹)</span>
                    <input
                      type="number"
                      step="any"
                      value={execPrice}
                      onChange={(e) => setExecPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-1 text-xs bg-white border border-[#D9D9D2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-[#5C5C5E] uppercase">Quantity</span>
                    <input
                      type="number"
                      step="any"
                      value={execQty}
                      onChange={(e) => setExecQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs bg-white border border-[#D9D9D2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddExecution}
                    className="bg-[#244230] hover:bg-[#1D3526] text-white py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Add Tranche
                  </button>
                </div>

                {/* Execution List */}
                {executions.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-[#5C5C5E] uppercase block">Executions Logged</span>
                    <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin">
                      {executions.map((e, idx) => (
                        <div key={e.id} className="flex items-center justify-between bg-white border border-[#D9D9D2]/70 p-2 rounded-lg text-[10px] font-bold text-[#1C1C1E]">
                          <div className="flex items-center gap-2">
                            <span className="text-[#5C5C5E]">#{idx + 1}</span>
                            <span className={`px-1 rounded ${e.type === 'BUY' ? 'bg-[#D4E8DC] text-[#166534]' : 'bg-[#FADCDC] text-[#991B1B]'}`}>
                              {e.type}
                            </span>
                            <span>{e.quantity} shares @ ₹{e.price.toLocaleString('en-IN')}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExecution(e.id)}
                            className="text-[#5C5C5E] hover:text-[#991B1B] p-1 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-[10px] text-[#5C5C5E] font-medium border border-[#D9D9D2]/40 border-dashed rounded-lg bg-white">
                    No execution tranches added yet. Add a BUY or SELL tranche above.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Row 1: Entry, Exit, Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                {useExecutions ? 'Avg Entry Price (₹) [Auto]' : 'Entry Price (₹)'}
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                required
                readOnly={useExecutions}
                className={`w-full px-4 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E] ${
                  useExecutions ? 'bg-gray-100/80 border-[#D9D9D2]/50 cursor-not-allowed opacity-75' : 'bg-[#FAFAF7] border-[#D9D9D2]'
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                {useExecutions ? 'Avg Exit Price (₹) [Auto]' : 'Exit Price (₹)'}
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
                required
                readOnly={useExecutions}
                className={`w-full px-4 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E] ${
                  useExecutions ? 'bg-gray-100/80 border-[#D9D9D2]/50 cursor-not-allowed opacity-75' : 'bg-[#FAFAF7] border-[#D9D9D2]'
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                {useExecutions ? 'Total Quantity [Auto]' : 'Quantity'}
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
                readOnly={useExecutions}
                className={`w-full px-4 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E] ${
                  useExecutions ? 'bg-gray-100/80 border-[#D9D9D2]/50 cursor-not-allowed opacity-75' : 'bg-[#FAFAF7] border-[#D9D9D2]'
                }`}
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
              <option value="" disabled>-- Select or Add Strategy Setup --</option>
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

          {/* Tags Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block flex items-center gap-1">
              <Tag size={10} /> Trade Tags
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_TAGS.map((t) => {
                const isAdded = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (isAdded) {
                        handleRemoveTag(t);
                      } else {
                        setTags([...tags, t]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-[#244230] text-white border-[#244230] shadow-sm'
                        : 'bg-[#FAFAF7] text-[#5C5C5E] border-[#D9D9D2] hover:bg-[#EAEAE2] hover:text-[#1C1C1E]'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emotion Grid */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
              Trading Emotion
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {EMOTIONS.map((em) => {
                const isSelected = emotion === em.emoji;
                const mapping = EMOTION_MAP[em.emoji];
                const IconComponent = mapping ? mapping.icon : HelpCircle;
                const iconColor = mapping ? mapping.color : '#5C5C5E';
                
                return (
                  <button
                    key={em.label}
                    type="button"
                    onClick={() => setEmotion(em.emoji)}
                    className={`flex flex-col items-center p-2.5 border rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#244230] bg-[#EAEAE2] scale-105 shadow-sm'
                        : 'border-[#D9D9D2] bg-white hover:bg-[#FAFAF7]'
                    }`}
                  >
                    <IconComponent 
                      size={20} 
                      className={`mb-1.5 transition-transform ${isSelected ? 'scale-110' : ''}`}
                      style={{ color: iconColor }} 
                    />
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-150 ${
                      isSelected ? 'text-[#1C1C1E]' : 'text-[#5C5C5E]'
                    }`}>
                      {em.label}
                    </span>
                  </button>
                );
              })}
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

      {/* Custom Strategy Modal Dialog */}
      {isCustomStrategyModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#D9D9D2] rounded-2xl premium-shadow max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 border-b border-[#D9D9D2]/50 pb-3">
              <span className="p-1.5 rounded-lg bg-[#D4E8DC] text-[#244230]">
                <Plus size={16} />
              </span>
              <h3 className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider">
                Add Custom Strategy
              </h3>
            </div>
            
            <form onSubmit={handleAddCustomStrategy} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                  Strategy Setup Name
                </label>
                <input
                  type="text"
                  value={newStrategyInput}
                  onChange={(e) => setNewStrategyInput(e.target.value)}
                  placeholder="e.g. Breakout Retest, 5EMA Pullback"
                  className="w-full px-4 py-2.5 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomStrategyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#5C5C5E] hover:text-[#1C1C1E] bg-[#FAFAF7] border border-[#D9D9D2] hover:bg-[#EAEAE2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#244230] hover:bg-[#1D3526] transition-colors cursor-pointer"
                >
                  Save Strategy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
