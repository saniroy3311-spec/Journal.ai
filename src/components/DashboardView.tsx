import React from 'react';
import type { Trade } from '../types';
import { calculateStats } from '../utils/stats';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Wallet,
  Edit2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DashboardViewProps {
  trades: Trade[];
  startingCapital: number;
  onEditCapital: () => void;
  customInstructions: string;
  onSelectTradeImage: (url: string) => void;
  username: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  trades,
  startingCapital,
  onEditCapital,
  onSelectTradeImage,
  username
}) => {
  const stats = calculateStats(trades, startingCapital);

  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  // Equity Curve Chart Data preparation
  const initialCapital = startingCapital;
  const sortedClosed = [...closedTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let runningEquity = initialCapital;
  const chartData = [
    {
      name: 'Start',
      equity: initialCapital,
      pnl: 0,
      symbol: 'Baseline',
      dateStr: ''
    },
    ...sortedClosed.map(t => {
      runningEquity += t.pnl;
      return {
        name: format(parseISO(t.date), 'dd MMM'),
        equity: runningEquity,
        pnl: t.pnl,
        symbol: t.symbol,
        dateStr: format(parseISO(t.date), 'dd MMM yyyy HH:mm')
      };
    })
  ];

  const recentClosed = [...closedTrades]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      
      {/* Personalized Greeting Header */}
      <div className="bg-gradient-to-r from-[#244230]/5 via-transparent to-[#5C8A6E]/5 border border-[#D9D9D2]/40 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-inner-sm">
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl md:text-2xl font-black font-display text-[#1C1C1E] tracking-tight">
            {getGreeting()}, <span className="text-[#244230] font-black">{username.charAt(0).toUpperCase() + username.slice(1)}</span>!
          </h2>
          <p className="text-xs text-[#5C5C5E] font-semibold">
            {trades.length === 0 
              ? "Welcome to your trading command center. Let's start by logging your first trade!" 
              : `You have logged ${trades.length} trades. Let's analyze your performance today.`}
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="text-xs font-bold text-[#5C5C5E] bg-[#FAFAF7] border border-[#D9D9D2] px-3.5 py-2 rounded-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Market Feed Live</span>
          </div>
        </div>
        
        {/* Subtle decorative glow in background */}
        <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-[#5C8A6E]/10 blur-2xl pointer-events-none" />
      </div>
      
      {/* Row 1: 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Net Equity Card */}
        <div className="bg-white border border-[#D9D9D2] p-4 md:p-5 rounded-xl md:rounded-2xl premium-shadow flex items-start justify-between">
          <div className="space-y-1 w-full">
            <span className="text-xs font-bold text-[#5C5C5E] uppercase tracking-wider block">
              Net Portfolio Equity
            </span>
            <span className="text-2xl font-extrabold font-display text-[#1C1C1E] block">
              ₹{(initialCapital + stats.totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold mt-1.5 text-[#5C5C5E]">
              <span>Base capital:</span>
              <button 
                onClick={onEditCapital}
                className="bg-[#FAFAF7] hover:bg-[#EAEAE2] border border-[#D9D9D2]/70 px-2 py-0.5 rounded transition-colors font-extrabold text-[#1C1C1E] text-[10px] flex items-center gap-1 cursor-pointer select-none"
                title="Click to edit starting capital"
              >
                ₹{startingCapital.toLocaleString('en-IN')} <Edit2 size={9} className="opacity-60" />
              </button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-[#166534] flex-shrink-0">
            <Wallet size={22} />
          </div>
        </div>

        {/* Total P&L Card */}
        <div className="bg-white border border-[#D9D9D2] p-4 md:p-5 rounded-xl md:rounded-2xl premium-shadow flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#5C5C5E] uppercase tracking-wider block">
              Total Realized P&L
            </span>
            <span className={`text-2xl font-extrabold font-display block ${
              stats.totalPnL >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
            }`}>
              {stats.totalPnL >= 0 ? '+' : ''}
              ₹{stats.totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold mt-1 text-[#5C5C5E]">
              <span>Across {stats.totalTrades} closed trades</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${stats.totalPnL >= 0 ? 'bg-[#D4E8DC] text-[#166534]' : 'bg-[#FADCDC] text-[#991B1B]'}`}>
            {stats.totalPnL >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-white border border-[#D9D9D2] p-4 md:p-5 rounded-xl md:rounded-2xl premium-shadow flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#5C5C5E] uppercase tracking-wider block">
              Win Rate
            </span>
            <span className="text-2xl font-extrabold font-display text-[#1C1C1E] block">
              {stats.winRate.toFixed(1)}%
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold mt-1 text-[#5C5C5E]">
              <span>{closedTrades.filter(t => t.pnl > 0).length} W / {closedTrades.filter(t => t.pnl < 0).length} L</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Percent size={22} />
          </div>
        </div>

      </div>

      {/* Row 2: Equity Curve Chart */}
      <div className="bg-white border border-[#D9D9D2] p-4 md:p-6 rounded-xl md:rounded-2xl premium-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-[#1C1C1E]">
              Equity Curve
            </h2>
            <p className="text-xs font-medium text-[#5C5C5E]">
              Cumulative account balance timeline based on closed trades
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider block">
              Peak Balance
            </span>
            <span className="text-sm font-extrabold text-[#166534] font-display">
              ₹{Math.max(...chartData.map(d => d.equity)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {sortedClosed.length === 0 ? (
          <div className="h-56 md:h-72 w-full flex flex-col items-center justify-center border border-[#D9D9D2] border-dashed rounded-xl bg-[#FAFAF7]/50 text-center p-6 space-y-2">
            <div className="p-3 rounded-full bg-[#EAEAE2]/50 text-[#5C5C5E]">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">No closed trades logged yet</h3>
            <p className="text-[11px] text-[#5C5C5E] font-medium max-w-xs leading-relaxed">
              Your equity curve will compile here once you close and log your first trade setup.
            </p>
          </div>
        ) : (
          <div className="h-56 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#166534" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#166534" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEAE2" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#5C5C5E" 
                  tick={{ fill: '#1C1C1E', fontSize: 13, fontWeight: 700 }}
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                  minTickGap={15}
                />
                <YAxis 
                  stroke="#5C5C5E" 
                  tick={{ fill: '#1C1C1E', fontSize: 13, fontWeight: 700 }}
                  tickLine={false} 
                  axisLine={false}
                  domain={['dataMin - 10000', 'dataMax + 10000']}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  dx={-10}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#D9D9D2] p-4 rounded-xl shadow-lg max-w-xs space-y-2">
                          <p className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider">
                            {data.dateStr || 'Baseline'}
                          </p>
                          <div className="flex justify-between items-baseline gap-4">
                            <span className="text-xs font-bold text-[#1C1C1E]">Equity:</span>
                            <span className="text-sm font-extrabold text-[#1C1C1E] font-display">
                              ₹{data.equity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          {data.pnl !== 0 && (
                            <div className="pt-1.5 border-t border-[#D9D9D2]/50 flex justify-between items-center text-xs">
                              <span className="font-semibold text-[#5C5C5E]">{data.symbol} P&L:</span>
                              <span className={`font-extrabold ${data.pnl > 0 ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                                {data.pnl > 0 ? '+' : ''}₹{data.pnl.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={initialCapital} stroke="#5C5C5E" strokeDasharray="5 5" opacity={0.3} />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#166534" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEquity)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Row 3: 8-cell metric grid (MetricChip components) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold font-display text-[#1C1C1E]">
            Advanced Performance Metrics
          </h2>
          <p className="text-xs font-medium text-[#5C5C5E]">
            Calculated key statistics derived from trading efficiency
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Profit Factor */}
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] p-4 rounded-xl flex flex-col justify-between space-y-1">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider">
              Profit Factor
            </span>
            <span className={`text-lg font-extrabold font-display ${stats.profitFactor === Infinity ? 'text-[#166534]' : 'text-[#1C1C1E]'}`}>
              {stats.profitFactor === Infinity ? 'Perfect' : stats.profitFactor.toFixed(2)}
            </span>
            <span className="text-[10px] font-semibold text-[#5C5C5E]">Gross Wins / Gross Losses</span>
          </div>

          {/* R:R Ratio */}
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] p-4 rounded-xl flex flex-col justify-between space-y-1">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider">
              Avg R:R Ratio
            </span>
            <span className={`text-lg font-extrabold font-display ${stats.rrRatio === Infinity ? 'text-[#166534]' : 'text-[#1C1C1E]'}`}>
              {stats.rrRatio === Infinity ? 'Perfect' : `${stats.rrRatio.toFixed(2)}x`}
            </span>
            <span className="text-[10px] font-semibold text-[#5C5C5E]">Avg Win / Avg Loss</span>
          </div>

          {/* Expectancy */}
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] p-4 rounded-xl flex flex-col justify-between space-y-1 md:col-span-2">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider">
              Expectancy
            </span>
            <span className={`text-lg font-extrabold font-display ${stats.expectancy >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
              {stats.expectancy >= 0 ? '+' : ''}₹{Math.round(stats.expectancy).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-semibold text-[#5C5C5E]">Expected net P&L per trade</span>
          </div>

          {/* Max Drawdown */}
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] p-4 rounded-xl flex flex-col justify-between space-y-1">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider">
              Max Drawdown
            </span>
            <span className="text-lg font-extrabold font-display text-[#991B1B]">
              {stats.maxDrawdown.toFixed(2)}%
            </span>
            <span className="text-[10px] font-semibold text-[#5C5C5E]">Peak-to-trough account dip</span>
          </div>

          {/* Sharpe Ratio */}
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] p-4 rounded-xl flex flex-col justify-between space-y-1">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider">
              Sharpe Ratio
            </span>
            <span className="text-lg font-extrabold font-display text-[#1C1C1E]">
              {stats.sharpeRatio.toFixed(2)}
            </span>
            <span className="text-[10px] font-semibold text-[#5C5C5E]">Risk-adjusted performance</span>
          </div>

          {/* Avg Win */}
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] p-4 rounded-xl flex flex-col justify-between space-y-1">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider">
              Avg Win
            </span>
            <span className="text-lg font-extrabold font-display text-[#166534]">
              +₹{Math.round(stats.avgWin).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-semibold text-[#5C5C5E]">Mean of profitable trades</span>
          </div>

          {/* Avg Loss */}
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] p-4 rounded-xl flex flex-col justify-between space-y-1">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider">
              Avg Loss
            </span>
            <span className={`text-lg font-extrabold font-display ${stats.avgLoss === 0 ? 'text-[#1C1C1E]' : 'text-[#991B1B]'}`}>
              {stats.avgLoss === 0 ? '₹0' : `-₹${Math.round(stats.avgLoss).toLocaleString('en-IN')}`}
            </span>
            <span className="text-[10px] font-semibold text-[#5C5C5E]">Mean of losing trades</span>
          </div>
        </div>
      </div>

      {/* Row 5: Recent Trades */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-[#1C1C1E]">
              Recent Closed Trades
            </h2>
            <p className="text-xs font-medium text-[#5C5C5E]">
              Latest journaled trades that have reached exit targets
            </p>
          </div>
        </div>

        {recentClosed.length === 0 ? (
          <div className="bg-[#FAFAF7] border border-[#D9D9D2] border-dashed p-8 rounded-2xl text-center">
            <span className="text-sm font-semibold text-[#5C5C5E]">No closed trades logged yet.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentClosed.map((trade) => {
              const isProfit = trade.pnl >= 0;
              return (
                <div key={trade.id} className="bg-white border border-[#D9D9D2] rounded-2xl overflow-hidden flex flex-col justify-between premium-shadow premium-shadow-hover transition-all duration-200">
                  <div className="p-5 space-y-4">
                    {/* Symbol Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#1C1C1E] font-display">
                            {trade.symbol}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            trade.market === 'CRYPTO' 
                              ? 'bg-indigo-50 text-indigo-700' 
                              : trade.market === 'INDEX'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-orange-50 text-orange-700'
                          }`}>
                            {trade.market === 'INDEX' ? 'OPTION' : trade.market}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wide">
                          {trade.strategy}
                        </span>
                      </div>
                      <span className="text-lg">{trade.emotion}</span>
                    </div>

                    {/* Screenshot preview if available */}
                    {trade.screenshot && (
                      <div 
                        onClick={() => onSelectTradeImage(trade.screenshot!)}
                        className="relative h-28 rounded-xl overflow-hidden border border-[#D9D9D2]/60 cursor-zoom-in group"
                      >
                        <img 
                          src={trade.screenshot} 
                          alt={trade.symbol} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      </div>
                    )}

                    {/* Trade Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[#5C5C5E] pt-2 border-t border-[#D9D9D2]/30">
                      <div>
                        <span className="text-[10px] text-[#5C5C5E] block font-bold">ENTRY</span>
                        <span className="text-sm font-extrabold text-[#1C1C1E]">₹{trade.entryPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#5C5C5E] block font-bold">EXIT</span>
                        <span className="text-sm font-extrabold text-[#1C1C1E]">₹{trade.exitPrice?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* PNL footer */}
                  <div className={`px-5 py-3.5 border-t border-[#D9D9D2]/40 flex justify-between items-center ${
                    isProfit ? 'bg-[#D4E8DC]/20' : 'bg-[#FADCDC]/20'
                  }`}>
                    <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider">
                      Net P&L
                    </span>
                    <span className={`text-sm font-black font-display ${
                      isProfit ? 'text-[#166534]' : 'text-[#991B1B]'
                    }`}>
                      {isProfit ? '+' : ''}₹{trade.pnl.toLocaleString('en-IN')} ({isProfit ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
