import React, { useState } from 'react';
import type { Trade } from '../types';
import { Search, Trash2, Calendar, FileText, Compass, ShieldAlert, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HistoryViewProps {
  trades: Trade[];
  onDeleteTrade: (id: string) => void;
}

type FilterType = 'ALL' | 'BUY' | 'SELL';

export const HistoryView: React.FC<HistoryViewProps> = ({
  trades,
  onDeleteTrade
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  // Filter logic
  const filteredTrades = trades.filter((trade) => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      trade.symbol.toLowerCase().includes(query) ||
      trade.strategy.toLowerCase().includes(query) ||
      (trade.notes && trade.notes.toLowerCase().includes(query)) ||
      (trade.setupName && trade.setupName.toLowerCase().includes(query));

    // 2. Active Filter Chip
    let matchesFilter = true;
    if (activeFilter === 'BUY') matchesFilter = trade.type === 'BUY';
    else if (activeFilter === 'SELL') matchesFilter = trade.type === 'SELL';

    return matchesSearch && matchesFilter;
  });

  // Sort trades: chronological descending (newest trades first)
  const sortedTrades = [...filteredTrades].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filters: { id: FilterType; label: string }[] = [
    { id: 'ALL', label: 'All Trades' },
    { id: 'BUY', label: 'Buy / Longs' },
    { id: 'SELL', label: 'Sell / Shorts' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-12 space-y-4 md:space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold font-display text-[#1C1C1E]">
          Trading Log History
        </h2>
        <p className="text-xs font-medium text-[#5C5C5E]">
          Search, filter, and inspect past performance journals
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#D9D9D2] p-3 md:p-4 rounded-xl md:rounded-2xl premium-shadow">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol, strategy, notes..."
            className="w-full px-4 py-2 pl-10 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-[#5C5C5E]" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === f.id
                  ? 'bg-[#244230] text-white'
                  : 'bg-[#EAEAE2] text-[#5C5C5E] hover:text-[#1C1C1E]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* Trades List */}
      <div className="space-y-6">
        {sortedTrades.length === 0 ? (
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] border-dashed p-12 rounded-2xl text-center space-y-2">
            <Compass size={40} className="mx-auto text-[#D9D9D2]" />
            <h3 className="text-sm font-bold text-[#1C1C1E]">No trades found</h3>
            <p className="text-xs text-[#5C5C5E] font-medium">Try resetting your search query or filters.</p>
          </div>
        ) : (
          sortedTrades.map((trade) => {
            const isProfit = trade.pnl >= 0;
            const tradeDate = parseISO(trade.date);

            return (
              <div
                key={trade.id}
                className="bg-white border border-[#D9D9D2] rounded-xl md:rounded-2xl overflow-hidden premium-shadow hover:border-[#244230]/50 transition-all duration-200"
              >
                
                {/* Header row */}
                <div className="px-4 md:px-6 py-3.5 md:py-4 border-b border-[#D9D9D2]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  
                  {/* Left: Info */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{trade.emotion}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-[#1C1C1E] font-display tracking-tight">
                          {trade.symbol}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase ${
                          trade.type === 'BUY'
                            ? 'bg-[#D4E8DC] text-[#166534]'
                            : 'bg-[#FADCDC] text-[#991B1B]'
                        }`}>
                          {trade.type} / {trade.market}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5C5C5E] mt-1">
                        <Calendar size={13} />
                        <span>{format(tradeDate, 'dd MMM yyyy, hh:mm a')}</span>
                        <span>•</span>
                        <span className="bg-[#EAEAE2] px-2 py-0.5 rounded text-[#1C1C1E] font-bold">
                          {trade.strategy}
                        </span>
                        {trade.setupName && (
                          <>
                            <span>•</span>
                            <span className="text-[#1C1C1E]">{trade.setupName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & PNL */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#D9D9D2]/30">
                    
                    {/* P&L Block */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#5C5C5E]/80 uppercase tracking-wider block">
                        Net Trade P&L
                      </span>
                      <span className={`text-lg font-black font-display ${
                        isProfit ? 'text-[#166534]' : 'text-[#991B1B]'
                      }`}>
                        {isProfit ? '+' : ''}₹{trade.pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-xs font-bold block ${
                        isProfit ? 'text-[#166534]' : 'text-[#991B1B]'
                      }`}>
                        {isProfit ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete this ${trade.symbol} trade entry?`)) {
                          onDeleteTrade(trade.id);
                        }
                      }}
                      className="p-2 text-[#5C5C5E] hover:text-[#991B1B] hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </div>

                {/* Details row */}
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-[#FAFAF7]/40">
                  
                  {/* Prices & Execution details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C5C5E] uppercase tracking-wider">
                      <FileText size={13} strokeWidth={2.5} />
                      <span>Execution Pricing</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-[#7C7C7E] tracking-wider block">ENTRY PRICE</span>
                        <span className="text-base font-extrabold text-[#1C1C1E] font-display">
                          ₹{trade.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-[#7C7C7E] tracking-wider block">EXIT PRICE</span>
                        <span className="text-base font-extrabold text-[#1C1C1E] font-display">
                          ₹{trade.exitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-[#7C7C7E] tracking-wider block">QUANTITY</span>
                        <span className="text-base font-extrabold text-[#1C1C1E]">
                          {trade.quantity}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-[#7C7C7E] tracking-wider block">POSITION RISK</span>
                        <span className="text-base font-extrabold text-[#1C1C1E]">
                          ₹{(trade.entryPrice * trade.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* SL / TP bounds */}
                    <div className="pt-3 border-t border-[#D9D9D2]/40 grid grid-cols-2 gap-4 text-xs font-semibold text-[#5C5C5E]">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-[#991B1B]" />
                        <div>
                          <span className="text-[10px] text-[#5C5C5E] block font-bold tracking-wider">STOP LOSS</span>
                          <span className="text-sm font-bold text-[#1C1C1E]">₹{trade.sl ? trade.sl.toLocaleString('en-IN') : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award size={14} className="text-[#166534]" />
                        <div>
                          <span className="text-[10px] text-[#5C5C5E] block font-bold tracking-wider">TAKE PROFIT</span>
                          <span className="text-sm font-bold text-[#1C1C1E]">₹{trade.tp ? trade.tp.toLocaleString('en-IN') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Column */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#5C5C5E] uppercase tracking-wider block">
                      Trade Notes
                    </span>
                    {trade.notes ? (
                      <blockquote className="border-l-3 border-[#244230] pl-4 py-2 text-sm leading-relaxed text-[#3C3C3E] font-medium bg-[#FAFAF7] rounded-r-xl pr-3">
                        "{trade.notes}"
                      </blockquote>
                    ) : (
                      <span className="text-sm text-[#5C5C5E] font-medium italic block py-4">No notes recorded for this execution.</span>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
