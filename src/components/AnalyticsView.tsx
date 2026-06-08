import React, { useState } from 'react';
import type { Trade } from '../types';
import { EMOTIONS } from '../constants';
import {
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getDay,
  subMonths,
  addMonths
} from 'date-fns';
import {
  TrendingUp,
  Brain,
  Calendar,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarCheck,
  CircleDot,
  Tag
} from 'lucide-react';

interface AnalyticsViewProps {
  trades: Trade[];
  onSelectTradeImage: (url: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades, onSelectTradeImage }) => {
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2026, 4, 1)); // Initialize to May 2026 to align with mock data
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(new Date(2026, 4, 20)); // Pre-select a day

  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  // ----------------------------------------------------
  // OVERVIEW DATA PREPARATION
  // ----------------------------------------------------
  
  // Group P&L by Month
  const monthlyDataMap: Record<string, number> = {};
  closedTrades.forEach(t => {
    const monthStr = format(parseISO(t.date), 'MMM yyyy');
    monthlyDataMap[monthStr] = (monthlyDataMap[monthStr] || 0) + t.pnl;
  });

  const monthlyChartData = Object.keys(monthlyDataMap).map(month => ({
    month,
    pnl: monthlyDataMap[month]
  }));

  // Win/Loss Pie Data
  const winCount = closedTrades.filter(t => t.pnl > 0).length;
  const lossCount = closedTrades.filter(t => t.pnl < 0).length;
  const winLossPieData = [
    { name: 'Wins', value: winCount, color: '#5C8A6E' },
    { name: 'Losses', value: lossCount, color: '#B56B6B' }
  ];

  // Position Size vs PnL Scatter Plot
  const scatterData = closedTrades.map(t => ({
    size: t.entryPrice * t.quantity,
    pnl: t.pnl,
    symbol: t.symbol,
    strategy: t.strategy
  }));

  // ----------------------------------------------------
  // STRATEGY DATA PREPARATION
  // ----------------------------------------------------
  // Dynamically extract unique strategies from the closed trades
  const uniqueStrategies = Array.from(new Set(closedTrades.map((t) => t.strategy)));

  const strategyStats = uniqueStrategies.map(strat => {
    const stratTrades = closedTrades.filter(t => t.strategy === strat);
    const count = stratTrades.length;
    const wins = stratTrades.filter(t => t.pnl > 0).length;
    const netPnL = stratTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    const avgPnL = count > 0 ? netPnL / count : 0;

    return {
      name: strat,
      count,
      wins,
      losses: count - wins,
      winRate,
      netPnL,
      avgPnL
    };
  }).filter(s => s.count > 0); // Only show strategies that have trades

  // ----------------------------------------------------
  // PSYCHOLOGY DATA PREPARATION
  // ----------------------------------------------------
  const psychologyStats = EMOTIONS.map(em => {
    const emTrades = closedTrades.filter(t => t.emotion === em.emoji);
    const count = emTrades.length;
    const wins = emTrades.filter(t => t.pnl > 0).length;
    const netPnL = emTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    const avgPnL = count > 0 ? netPnL / count : 0;

    return {
      emoji: em.emoji,
      label: em.label,
      count,
      wins,
      winRate,
      netPnL,
      avgPnL
    };
  }).filter(e => e.count > 0);

  // ----------------------------------------------------
  // TAGS DATA PREPARATION
  // ----------------------------------------------------
  const tagStatsMap: Record<string, { count: number; wins: number; netPnL: number }> = {};
  closedTrades.forEach(t => {
    const tradeTags = t.tags || [];
    tradeTags.forEach(tag => {
      if (!tagStatsMap[tag]) {
        tagStatsMap[tag] = { count: 0, wins: 0, netPnL: 0 };
      }
      tagStatsMap[tag].count += 1;
      if (t.pnl > 0) tagStatsMap[tag].wins += 1;
      tagStatsMap[tag].netPnL += t.pnl;
    });
  });

  const tagStats = Object.keys(tagStatsMap).map(name => {
    const { count, wins, netPnL } = tagStatsMap[name];
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    const avgPnL = count > 0 ? netPnL / count : 0;
    return {
      name,
      count,
      wins,
      winRate,
      netPnL,
      avgPnL
    };
  }).sort((a, b) => b.netPnL - a.netPnL);

  // ----------------------------------------------------
  // CALENDAR DATA PREPARATION
  // ----------------------------------------------------
  
  // Setup standard calendar grid dates
  const startMonth = startOfMonth(calendarMonth);
  const endMonth = endOfMonth(calendarMonth);
  
  // Starting day of week: Monday is index 1, Sunday is 0. Let's make Monday the first column (1), adjust startDayOfWeek
  // standard index: 0 = Sun, 1 = Mon ... 6 = Sat
  const startDayOfWeek = getDay(startMonth); 
  
  // Blank padding cells at start of month grid (Monday start calendar)
  // standard: Sun=0. If Monday start: Monday=1... Sun=0. We'll adjust Sun to 6.
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const paddingCells = Array.from({ length: adjustedStartDay });
  
  const monthDays = eachDayOfInterval({ start: startMonth, end: endMonth });

  // Get trades for a specific calendar day
  const getDayTrades = (day: Date) => {
    return trades.filter(t => isSameDay(parseISO(t.date), day));
  };

  // Get P&L for a specific calendar day
  const getDayPnL = (day: Date) => {
    const dayTrades = getDayTrades(day).filter(t => t.status === 'CLOSED');
    return dayTrades.reduce((sum, t) => sum + t.pnl, 0);
  };

  const selectedDayTrades = selectedCalendarDay ? getDayTrades(selectedCalendarDay) : [];

  if (closedTrades.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 text-center space-y-4">
        <div className="border-b border-[#D9D9D2] pb-5 text-left">
          <h2 className="text-xl font-bold font-display text-[#1C1C1E]">
            Performance Analytics
          </h2>
          <p className="text-xs font-medium text-[#5C5C5E]">
            Algorithmic insights, strategy validation, calendar heatmaps, and psychological correlation
          </p>
        </div>
        <div className="bg-white border border-[#D9D9D2] border-dashed p-12 rounded-2xl space-y-2">
          <Info size={40} className="mx-auto text-[#D9D9D2]" />
          <h3 className="text-sm font-bold text-[#1C1C1E]">No analytics available</h3>
          <p className="text-xs text-[#5C5C5E] font-medium">Please close at least one trade to activate analytics dashboards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-12 space-y-12">
      
      {/* Tab Header Title */}
      <div className="border-b border-[#D9D9D2] pb-5">
        <h2 className="text-xl font-bold font-display text-[#1C1C1E]">
          Performance Analytics
        </h2>
        <p className="text-xs font-medium text-[#5C5C5E]">
          Algorithmic insights, strategy validation, calendar heatmaps, and psychological correlation
        </p>
      </div>

      <div className="space-y-16">
        
        {/* ----------------------------------------------------
            OVERVIEW SECTION
            ---------------------------------------------------- */}
        <section className="space-y-6">
          <div className="border-b border-[#D9D9D2]/60 pb-3">
            <h3 className="text-base font-bold font-display text-[#1C1C1E] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#244230]" />
              Performance Overview
            </h3>
            <p className="text-[11px] text-[#5C5C5E] font-semibold">Net profit, win rate ratio, and position size distribution</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Monthly Realized P&L */}
            <div className="bg-white border border-[#D9D9D2] p-6 rounded-2xl premium-shadow space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                  Monthly Realized P&L
                </h3>
                <p className="text-[11px] text-[#5C5C5E] font-semibold">Net profit or loss grouped by month</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAEAE2" vertical={false} />
                    <XAxis dataKey="month" stroke="#5C5C5E" fontSize={11} fontWeight={600} tickLine={false} />
                    <YAxis stroke="#5C5C5E" fontSize={11} fontWeight={600} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [
                        `₹${(val || 0).toLocaleString('en-IN')}`,
                        'Monthly P&L'
                      ]}
                      contentStyle={{ borderRadius: '12px', borderColor: '#D9D9D2' }}
                    />
                    <Bar dataKey="pnl">
                      {monthlyChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? '#5C8A6E' : '#B56B6B'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Wins / Losses Ratio */}
            <div className="bg-white border border-[#D9D9D2] p-6 rounded-2xl premium-shadow flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                  Win / Loss Ratio
                </h3>
                <p className="text-[11px] text-[#5C5C5E] font-semibold">Proportion of profitable vs losing closed trades</p>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                {/* Pie chart */}
                <div className="h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossPieData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {winLossPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} trades`, 'Count']}
                        contentStyle={{ borderRadius: '12px', borderColor: '#D9D9D2' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend list */}
                <div className="space-y-4 text-xs font-bold text-[#1C1C1E]">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-md bg-[#5C8A6E]" />
                    <div>
                      <span className="text-[#5C5C5E] block text-[10px] uppercase">WINS</span>
                      <span>{winCount} Trades ({((winCount / closedTrades.length) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-md bg-[#B56B6B]" />
                    <div>
                      <span className="text-[#5C5C5E] block text-[10px] uppercase">LOSSES</span>
                      <span>{lossCount} Trades ({((lossCount / closedTrades.length) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Size vs PNL Scatter Plot */}
            <div className="bg-white border border-[#D9D9D2] p-6 rounded-2xl premium-shadow space-y-4 lg:col-span-2">
              <div>
                <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                  Trade Size vs Realized P&L
                </h3>
                <p className="text-[11px] text-[#5C5C5E] font-semibold">
                  Scatter distribution of total position risk capital vs net trade outcome
                </p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAEAE2" />
                    <XAxis
                      type="number"
                      dataKey="size"
                      name="Position Size"
                      unit="₹"
                      stroke="#5C5C5E"
                      fontSize={11}
                      fontWeight={600}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="number"
                      dataKey="pnl"
                      name="Net P&L"
                      unit="₹"
                      stroke="#5C5C5E"
                      fontSize={11}
                      fontWeight={600}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-[#D9D9D2] p-4 rounded-xl shadow-lg space-y-1 text-xs">
                              <p className="font-extrabold text-[#1C1C1E]">{data.symbol}</p>
                              <p className="font-semibold text-[#5C5C5E]">{data.strategy}</p>
                              <div className="flex justify-between gap-4 pt-1.5 border-t border-[#D9D9D2]/50 font-bold">
                                <span>Position Size:</span>
                                <span>₹{data.size.toLocaleString('en-IN')}</span>
                              </div>
                              <div className={`flex justify-between gap-4 font-black ${
                                data.pnl >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                              }`}>
                                <span>Outcome P&L:</span>
                                <span>{data.pnl >= 0 ? '+' : ''}₹{data.pnl.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? '#5C8A6E' : '#B56B6B'}
                          className="cursor-pointer"
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </section>

        {/* ----------------------------------------------------
            STRATEGY SECTION
            ---------------------------------------------------- */}
        <section className="space-y-6">
          <div className="border-b border-[#D9D9D2]/60 pb-3">
            <h3 className="text-base font-bold font-display text-[#1C1C1E] flex items-center gap-2">
              <Briefcase size={18} className="text-[#244230]" />
              Strategy Breakdowns
            </h3>
            <p className="text-[11px] text-[#5C5C5E] font-semibold">Win rates and cumulative profitability per strategy setup</p>
          </div>
          
          {strategyStats.length === 0 ? (
            <div className="bg-white border border-[#D9D9D2] border-dashed p-8 text-center text-[#5C5C5E] text-xs rounded-2xl">
              No strategy data logged on your closed trades yet.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Strategy Chart */}
              <div className="bg-white border border-[#D9D9D2] p-6 rounded-2xl premium-shadow space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                    Net P&L Per Strategy
                  </h3>
                  <p className="text-[11px] text-[#5C5C5E] font-semibold">Cumulative profitability of each trade setup</p>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={strategyStats} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAEAE2" horizontal={false} />
                      <XAxis type="number" stroke="#5C5C5E" fontSize={11} fontWeight={600} />
                      <YAxis dataKey="name" type="category" stroke="#5C5C5E" fontSize={11} fontWeight={600} width={120} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [`₹${(val || 0).toLocaleString('en-IN')}`, 'Net P&L']}
                        contentStyle={{ borderRadius: '12px', borderColor: '#D9D9D2' }}
                      />
                      <Bar dataKey="netPnL">
                        {strategyStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.netPnL >= 0 ? '#5C8A6E' : '#B56B6B'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strategy Details Table */}
              <div className="bg-white border border-[#D9D9D2] rounded-2xl overflow-hidden premium-shadow">
                <div className="p-6 border-b border-[#D9D9D2]/40">
                  <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                    Strategy Statistics Engine
                  </h3>
                  <p className="text-[11px] text-[#5C5C5E] font-semibold">Data table breaking down metrics per strategy setup</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-xs font-bold text-[#1C1C1E]">
                    <thead>
                      <tr className="bg-[#FAFAF7] border-b border-[#D9D9D2] text-[#5C5C5E] uppercase text-[10px] tracking-wider">
                        <th className="px-6 py-3.5 text-left">Strategy Setup</th>
                        <th className="px-6 py-3.5 text-center">Trades</th>
                        <th className="px-6 py-3.5 text-center">Wins</th>
                        <th className="px-6 py-3.5 text-center">Win Rate</th>
                        <th className="px-6 py-3.5 text-right">Net P&L</th>
                        <th className="px-6 py-3.5 text-right">Avg P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D9D2]/40">
                      {strategyStats.map((strat) => (
                        <tr key={strat.name} className="hover:bg-[#FAFAF7]/50">
                          <td className="px-6 py-4 font-black">{strat.name}</td>
                          <td className="px-6 py-4 text-center text-[#5C5C5E]">{strat.count}</td>
                          <td className="px-6 py-4 text-center text-[#5C5C5E]">{strat.wins}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full ${
                              strat.winRate >= 50 ? 'bg-[#D4E8DC] text-[#166534]' : 'bg-orange-50 text-orange-700'
                            }`}>
                              {strat.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-black ${
                            strat.netPnL >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                          }`}>
                            {strat.netPnL >= 0 ? '+' : ''}₹{strat.netPnL.toLocaleString('en-IN')}
                          </td>
                          <td className={`px-6 py-4 text-right ${
                            strat.avgPnL >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                          }`}>
                            {strat.avgPnL >= 0 ? '+' : ''}₹{Math.round(strat.avgPnL).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ----------------------------------------------------
            CALENDAR SECTION
            ---------------------------------------------------- */}
        <section className="space-y-6">
          <div className="border-b border-[#D9D9D2]/60 pb-3">
            <h3 className="text-base font-bold font-display text-[#1C1C1E] flex items-center gap-2">
              <Calendar size={18} className="text-[#244230]" />
              Trading Calendar
            </h3>
            <p className="text-[11px] text-[#5C5C5E] font-semibold">Daily realized P&L heatmap and day inspector</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Calendar Grid Container (Col 1 & 2) */}
            <div className="lg:col-span-2 bg-white border border-[#D9D9D2] p-3 sm:p-6 rounded-2xl premium-shadow space-y-4 sm:space-y-6">
              
              {/* Header: navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="text-[#244230]" size={20} />
                  <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                    {format(calendarMonth, 'MMMM yyyy')}
                  </h3>
                </div>
                <div className="flex bg-[#EAEAE2] p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}
                    className="p-1.5 hover:bg-white rounded-lg transition-all text-[#5C5C5E] hover:text-[#1C1C1E] cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
                    className="p-1.5 hover:bg-white rounded-lg transition-all text-[#5C5C5E] hover:text-[#1C1C1E] cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Week Day Header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2.5 text-center text-[9px] sm:text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
                {/* Padding cells */}
                {paddingCells.map((_, idx) => (
                  <div key={`pad-${idx}`} className="aspect-square bg-transparent border border-transparent" />
                ))}

                {/* Day cells */}
                {monthDays.map((day) => {
                  const dayTrades = getDayTrades(day);
                  const netPnL = getDayPnL(day);
                  const isSelected = selectedCalendarDay ? isSameDay(day, selectedCalendarDay) : false;
                  const hasTrades = dayTrades.length > 0;

                  let bgStyle = 'bg-white border-[#D9D9D2] text-[#1C1C1E]';

                  if (hasTrades) {
                    if (netPnL > 0) {
                      bgStyle = 'bg-[#D4E8DC] text-[#166534] border-[#166534]/30 font-extrabold';
                    } else if (netPnL < 0) {
                      bgStyle = 'bg-[#FADCDC] text-[#991B1B] border-[#991B1B]/30 font-extrabold';
                    } else {
                      bgStyle = 'bg-[#FAFAF7] text-[#1C1C1E] border-[#D9D9D2] font-bold';
                    }
                  }

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedCalendarDay(day)}
                      className={`aspect-square p-0.5 sm:p-1.5 rounded-lg sm:rounded-xl border flex flex-col justify-between items-start transition-all cursor-pointer ${bgStyle} ${
                        isSelected ? 'ring-2 ring-[#244230] scale-105 shadow-md' : 'hover:scale-102 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-[9px] sm:text-[10px]">{format(day, 'd')}</span>
                      {hasTrades && (
                        <span className="text-[7px] sm:text-[8px] font-black block w-full text-right truncate">
                          {netPnL !== 0
                            ? `${netPnL > 0 ? '+' : ''}${Math.round(netPnL / 1000)}k`
                            : '0'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Day Trades inspector sidebar (Col 3) */}
            <div className="bg-white border border-[#D9D9D2] p-5 rounded-2xl premium-shadow space-y-4">
              <div className="border-b border-[#D9D9D2]/50 pb-3">
                <h4 className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider block">
                  Day Inspector
                </h4>
                <span className="text-[10px] font-bold text-[#5C5C5E]">
                  {selectedCalendarDay ? format(selectedCalendarDay, 'eeee, dd MMMM yyyy') : 'Select a date'}
                </span>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[350px] scrollbar-thin pr-1">
                {selectedDayTrades.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#5C5C5E] font-medium space-y-2">
                    <CircleDot size={28} className="mx-auto text-[#D9D9D2] animate-pulse" />
                    <p>No trades logged on this calendar day.</p>
                  </div>
                ) : (
                  selectedDayTrades.map((t) => {
                    const pnlIsPositive = t.pnl >= 0;
                    return (
                      <div key={t.id} className="border border-[#D9D9D2] p-3.5 rounded-xl space-y-2 text-xs bg-[#FAFAF7]">
                        <div className="flex items-center justify-between font-bold">
                          <span className="font-extrabold text-[#1C1C1E]">{t.symbol} ({t.type})</span>
                          <span className="text-base">{t.emotion}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#5C5C5E]">
                          <span>{t.strategy}</span>
                          <span>Qty: {t.quantity}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-[#D9D9D2]/40 font-bold">
                          <span className="text-[#5C5C5E] text-[9px] uppercase tracking-wide">P&L:</span>
                          <span className={pnlIsPositive ? 'text-[#166534]' : 'text-[#991B1B]'}>
                            {pnlIsPositive ? '+' : ''}₹{t.pnl.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {t.screenshot && (
                          <div
                            onClick={() => onSelectTradeImage(t.screenshot!)}
                            className="relative h-16 rounded-lg overflow-hidden border border-[#D9D9D2]/50 cursor-zoom-in"
                          >
                            <img src={t.screenshot} alt="Trade chart" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ----------------------------------------------------
            PSYCHOLOGY SECTION
            ---------------------------------------------------- */}
        <section className="space-y-6">
          <div className="border-b border-[#D9D9D2]/60 pb-3">
            <h3 className="text-base font-bold font-display text-[#1C1C1E] flex items-center gap-2">
              <Brain size={18} className="text-[#244230]" />
              Psychology & Emotions
            </h3>
            <p className="text-[11px] text-[#5C5C5E] font-semibold">Correlation between execution mindset and net outcome</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Emotion Average PNL Bar Chart (Col 1 & 2) */}
            <div className="lg:col-span-2 bg-white border border-[#D9D9D2] p-6 rounded-2xl premium-shadow space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                  Average P&L By Mindset Emotion
                </h3>
                <p className="text-[11px] text-[#5C5C5E] font-semibold">Correlation between your execution mindset and net outcome</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={psychologyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAEAE2" vertical={false} />
                    <XAxis dataKey="emoji" stroke="#5C5C5E" fontSize={16} tickLine={false} />
                    <YAxis stroke="#5C5C5E" fontSize={11} fontWeight={600} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Math.round(val || 0).toLocaleString('en-IN')}`, 'Avg P&L']}
                      contentStyle={{ borderRadius: '12px', borderColor: '#D9D9D2' }}
                    />
                    <Bar dataKey="avgPnL">
                      {psychologyStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.avgPnL >= 0 ? '#5C8A6E' : '#B56B6B'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Emotion Correlation Stats Table (Col 3) */}
            <div className="bg-white border border-[#D9D9D2] rounded-2xl overflow-hidden premium-shadow h-fit">
              <div className="p-5 border-b border-[#D9D9D2]/40">
                <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                  Mindset Diagnostics
                </h3>
                <p className="text-[11px] text-[#5C5C5E] font-semibold">Breakdown of metrics classified by emotional tag</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[300px] text-xs font-bold text-[#1C1C1E]">
                  <thead>
                    <tr className="bg-[#FAFAF7] border-b border-[#D9D9D2] text-[#5C5C5E] uppercase text-[10px] tracking-wider">
                      <th className="px-4 py-2.5 text-left">Emotion</th>
                      <th className="px-4 py-2.5 text-center">Trades</th>
                      <th className="px-4 py-2.5 text-center">Win %</th>
                      <th className="px-4 py-2.5 text-right">Avg P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9D9D2]/40">
                    {psychologyStats.map((stat) => (
                      <tr key={stat.emoji} className="hover:bg-[#FAFAF7]/50">
                        <td className="px-4 py-3 flex items-center gap-2">
                          <span className="text-lg">{stat.emoji}</span>
                          <span className="font-extrabold">{stat.label}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-[#5C5C5E]">{stat.count}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded-full ${
                            stat.winRate >= 50 ? 'bg-[#D4E8DC] text-[#166534]' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {stat.winRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-black ${
                          stat.avgPnL >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                        }`}>
                          {stat.avgPnL >= 0 ? '+' : ''}₹{Math.round(stat.avgPnL).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

        {/* ----------------------------------------------------
            TAGS SECTION
            ---------------------------------------------------- */}
        <section className="space-y-6">
          <div className="border-b border-[#D9D9D2]/60 pb-3">
            <h3 className="text-base font-bold font-display text-[#1C1C1E] flex items-center gap-2">
              <Tag size={18} className="text-[#244230]" />
              Tag Analysis
            </h3>
            <p className="text-[11px] text-[#5C5C5E] font-semibold">Cost and profit attribution per tag setups (like #FOMO vs #RulesFollowed)</p>
          </div>
          
          <div className="space-y-6">
            {/* Net P&L per Tag Bar Chart */}
            <div className="bg-white border border-[#D9D9D2] p-6 rounded-2xl premium-shadow space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                  Net P&L Per Tag
                </h3>
                <p className="text-[11px] text-[#5C5C5E] font-semibold">Cost and profit attribution per tag setups (like #FOMO vs #RulesFollowed)</p>
              </div>
              {tagStats.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5C5C5E] font-medium border border-[#D9D9D2]/40 border-dashed rounded-xl bg-[#FAFAF7]">
                  No tags found. Add tags to your trades to see advanced tagging statistics.
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tagStats} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAEAE2" horizontal={false} />
                      <XAxis type="number" stroke="#5C5C5E" fontSize={11} fontWeight={600} />
                      <YAxis dataKey="name" type="category" stroke="#5C5C5E" fontSize={11} fontWeight={600} width={120} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [`₹${(val || 0).toLocaleString('en-IN')}`, 'Net P&L']}
                        contentStyle={{ borderRadius: '12px', borderColor: '#D9D9D2' }}
                      />
                      <Bar dataKey="netPnL">
                        {tagStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.netPnL >= 0 ? '#5C8A6E' : '#B56B6B'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Tag Details Table */}
            {tagStats.length > 0 && (
              <div className="bg-white border border-[#D9D9D2] rounded-2xl overflow-hidden premium-shadow">
                <div className="p-6 border-b border-[#D9D9D2]/40">
                  <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wide">
                    Tag Statistics Engine
                  </h3>
                  <p className="text-[11px] text-[#5C5C5E] font-semibold">Table showing net outcomes of trades categorized by custom tags</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-xs font-bold text-[#1C1C1E]">
                    <thead>
                      <tr className="bg-[#FAFAF7] border-b border-[#D9D9D2] text-[#5C5C5E] uppercase text-[10px] tracking-wider">
                        <th className="px-6 py-3.5 text-left">Tag Label</th>
                        <th className="px-6 py-3.5 text-center">Trades</th>
                        <th className="px-6 py-3.5 text-center">Wins</th>
                        <th className="px-6 py-3.5 text-center">Win Rate</th>
                        <th className="px-6 py-3.5 text-right">Net P&L</th>
                        <th className="px-6 py-3.5 text-right">Avg P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D9D2]/40">
                      {tagStats.map((t) => (
                        <tr key={t.name} className="hover:bg-[#FAFAF7]/50">
                          <td className="px-6 py-4 font-black text-[#244230]">{t.name}</td>
                          <td className="px-6 py-4 text-center text-[#5C5C5E]">{t.count}</td>
                          <td className="px-6 py-4 text-center text-[#5C5C5E]">{t.wins}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full ${
                              t.winRate >= 50 ? 'bg-[#D4E8DC] text-[#166534]' : 'bg-orange-50 text-orange-700'
                            }`}>
                              {t.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-black ${
                            t.netPnL >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                          }`}>
                            {t.netPnL >= 0 ? '+' : ''}₹{t.netPnL.toLocaleString('en-IN')}
                          </td>
                          <td className={`px-6 py-4 text-right ${
                            t.avgPnL >= 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                          }`}>
                            {t.avgPnL >= 0 ? '+' : ''}₹{Math.round(t.avgPnL).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </section>

      </div>

    </div>
  );
};
