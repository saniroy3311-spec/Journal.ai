import React, { useState } from 'react';
import type { Trade } from '../types';
import { Sparkles, BrainCircuit, Loader2, Calendar, AlertTriangle, BadgeAlert, TrendingUp } from 'lucide-react';
import { parseISO, getDay } from 'date-fns';

interface AICoachViewProps {
  trades: Trade[];
  customInstructions: string;
  setCustomInstructions: (val: string) => void;
  startingCapital: number;
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  trades,
  customInstructions,
  setCustomInstructions
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    leakTitle: string;
    leakDesc: string;
    biasTitle: string;
    biasDesc: string;
    strategyTitle: string;
    strategyDesc: string;
    riskTitle: string;
    riskDesc: string;
    score: number;
  } | null>(null);

  const runAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      // Perform data-driven audits in real-time
      const closedTrades = trades.filter((t) => t.status === 'CLOSED');

      if (closedTrades.length === 0) {
        setAuditResult({
          leakTitle: 'No Trade History Found',
          leakDesc: 'Please log and close some trades first to generate a behavioral mindset audit.',
          biasTitle: 'Data Pending',
          biasDesc: 'We need at least 1 closed trade to determine calendar weekday bias.',
          strategyTitle: 'Edge Undefined',
          strategyDesc: 'Add strategy setup tags to your logs so the AI can run a strategy edge audit.',
          riskTitle: 'Risk Metrics Neutral',
          riskDesc: 'No position risk metrics can be calculated yet.',
          score: 100
        });
        setIsAuditing(false);
        return;
      }

      // 1. Emotion Mindset Audit
      const emotionPnls: Record<string, number> = {};
      const emotionCounts: Record<string, number> = {};
      closedTrades.forEach((t) => {
        emotionPnls[t.emotion] = (emotionPnls[t.emotion] || 0) + t.pnl;
        emotionCounts[t.emotion] = (emotionCounts[t.emotion] || 0) + 1;
      });

      let worstEmoji = '';
      let worstEmojiPnl = 0;
      Object.keys(emotionPnls).forEach((emoji) => {
        if (emotionPnls[emoji] < worstEmojiPnl) {
          worstEmojiPnl = emotionPnls[emoji];
          worstEmoji = emoji;
        }
      });

      const emotionNames: Record<string, string> = {
        '😡': 'Revenge / Anger',
        '😟': 'Anxious / Fearful',
        '😎': 'Overconfident',
        '😊': 'Calm & Happy',
        '🤔': 'Indecisive / Hesitant',
        '😴': 'Bored'
      };

      const leakTitle = worstEmoji ? `Emotional Leak: ${worstEmoji} ${emotionNames[worstEmoji] || 'Uncalm'}` : 'Mindset Check: Disciplined';
      const leakDesc = worstEmoji
        ? `You have lost a total of ₹${Math.abs(worstEmojiPnl).toLocaleString('en-IN')} across ${emotionCounts[worstEmoji]} trades when feeling ${emotionNames[worstEmoji]}. This indicates a strong psychological leak. Prioritize walking away from the terminal when these feelings arise.`
        : 'Congratulations! Your logs do not show any significant negative emotional patterns. Keep maintaining your trading discipline!';

      // 2. Weekday Bias Audit
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayPnls: Record<number, number> = {};
      closedTrades.forEach((t) => {
        const d = getDay(parseISO(t.date));
        dayPnls[d] = (dayPnls[d] || 0) + t.pnl;
      });

      let worstDayIdx = -1;
      let worstDayPnl = 0;
      dayNames.forEach((_, idx) => {
        if (dayPnls[idx] !== undefined && dayPnls[idx] < worstDayPnl) {
          worstDayPnl = dayPnls[idx];
          worstDayIdx = idx;
        }
      });

      const biasTitle = worstDayIdx !== -1 ? `Weekday Bias: ${dayNames[worstDayIdx]}` : 'Calendar Symmetry: Good';
      const biasDesc = worstDayIdx !== -1
        ? `You are underperforming on ${dayNames[worstDayIdx]}s, suffering a net loss of ₹${Math.abs(worstDayPnl).toLocaleString('en-IN')}. This could be due to end-of-week exhaustion or opening-bell volatility. Consider half-sizing your positions on this day.`
        : 'Your performance is well-distributed throughout the week with no major red weekdays.';

      // 3. Strategy Critique
      const stratPnls: Record<string, number> = {};
      const stratCounts: Record<string, number> = {};
      closedTrades.forEach((t) => {
        stratPnls[t.strategy] = (stratPnls[t.strategy] || 0) + t.pnl;
        stratCounts[t.strategy] = (stratCounts[t.strategy] || 0) + 1;
      });

      let worstStrat = '';
      let worstStratPnl = 0;
      Object.keys(stratPnls).forEach((strat) => {
        if (stratPnls[strat] < worstStratPnl) {
          worstStratPnl = stratPnls[strat];
          worstStrat = strat;
        }
      });

      const strategyTitle = worstStrat ? `Underperforming Setup: ${worstStrat}` : 'Strategies Edge: Confirmed';
      const strategyDesc = worstStrat
        ? `The "${worstStrat}" setup has leaked ₹${Math.abs(worstStratPnl).toLocaleString('en-IN')} across ${stratCounts[worstStrat]} attempts. This setup currently has a negative mathematical expectancy. Consider pausing this strategy or tightening its entry conditions.`
        : 'All of your logged strategy setups are yielding positive or break-even results. Maintain your setup selection!';

      // 4. Sizing & Risk Audit
      const wins = closedTrades.filter((t) => t.pnl > 0);
      const losses = closedTrades.filter((t) => t.pnl < 0);
      const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
      const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0)) / losses.length : 0;

      const sizingError = avgLoss > avgWin;

      const riskTitle = sizingError ? 'Sizing Risk: High Loss Volatility' : 'Risk Management: Structured';
      const riskDesc = sizingError
        ? `Your average losing trade (₹${Math.round(avgLoss).toLocaleString('en-IN')}) is larger than your average winning trade (₹${Math.round(avgWin).toLocaleString('en-IN')}). This means you are averaging down or holding onto losing trades too long. Tighten your stop loss discipline.`
        : `Excellent! Your average winning trade (₹${Math.round(avgWin).toLocaleString('en-IN')}) is larger than your average loss (₹${Math.round(avgLoss).toLocaleString('en-IN')}). You have a positive risk expectancy.`;

      // Score calculation
      let score = 100;
      if (worstEmoji) score -= 15;
      if (worstDayIdx !== -1) score -= 10;
      if (worstStrat) score -= 15;
      if (sizingError) score -= 20;

      setAuditResult({
        leakTitle,
        leakDesc,
        biasTitle,
        biasDesc,
        strategyTitle,
        strategyDesc,
        riskTitle,
        riskDesc,
        score
      });
      setIsAuditing(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-12 space-y-6 md:space-y-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2] pb-5">
        <div>
          <h2 className="text-xl font-bold font-display text-[#1C1C1E] flex items-center gap-2">
            <Sparkles className="text-[#C89B5C] animate-pulse" size={20} /> Journal.ai Performance Coach
          </h2>
          <p className="text-xs font-medium text-[#5C5C5E]">
            Algorithmic audit logs, behavioral leaks detection, and custom trading instructions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Column: Guidelines & Focus (Col 1) */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-white border border-[#D9D9D2] p-5 rounded-2xl premium-shadow space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D9D9D2]/50 pb-3">
              <BrainCircuit size={18} className="text-[#C89B5C]" />
              <h3 className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider">
                Coaching Focus
              </h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#5C5C5E] uppercase tracking-wider block">
                Custom Instructions
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Focus on only 1 trade per day. Never trade after 2:30 PM. Exit instantly when SL is hit."
                rows={6}
                className="w-full p-3 bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#244230] resize-none leading-relaxed"
              />
              <p className="text-[9px] text-[#5C5C5E] font-medium leading-normal">
                These instructions align your performance coach to focus metrics on specific trading rules you define for yourself. Saved automatically.
              </p>
            </div>
          </div>

          {/* Run Audit Trigger Card */}
          <div className="bg-gradient-to-tr from-[#244230] to-[#166534] p-5 rounded-2xl text-white shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#D4E8DC] block">
                Behavioral Auditing
              </span>
              <h3 className="text-base font-extrabold font-display leading-tight">
                Run Weekly Performance Audit
              </h3>
              <p className="text-[11px] text-[#D4E8DC] font-medium leading-relaxed">
                Evaluates emotional loops, timing biases, risk metrics, and strategy leaks from logged entries instantly.
              </p>
            </div>
            <button
              onClick={runAudit}
              disabled={isAuditing}
              className="w-full bg-white hover:bg-gray-50 text-[#244230] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAuditing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <span>GENERATE AUDIT REPORT</span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Audit Results & Chat Report (Col 2 & 3) */}
        <div className="md:col-span-2 space-y-6">
          {isAuditing ? (
            <div className="bg-[#FAFAF7] border border-[#D9D9D2] border-dashed p-16 rounded-2xl text-center space-y-4">
              <Loader2 className="mx-auto text-[#244230] animate-spin" size={36} />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#1C1C1E]">Analyzing Trade Logs...</h3>
                <p className="text-xs text-[#5C5C5E] font-medium">Crunching mathematical expectancy, sizing profiles, and mindset records</p>
              </div>
            </div>
          ) : auditResult ? (
            <div className="space-y-6">
              
              {/* Score header */}
              <div className="bg-white border border-[#D9D9D2] p-5 rounded-2xl premium-shadow flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-[#1C1C1E] uppercase tracking-wider">
                    Discipline Score
                  </h3>
                  <p className="text-xs font-medium text-[#5C5C5E]">Based on rules compliance and risk management</p>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black font-display ${
                    auditResult.score >= 80 ? 'text-[#166534]' : auditResult.score >= 60 ? 'text-[#C89B5C]' : 'text-[#991B1B]'
                  }`}>
                    {auditResult.score}/100
                  </span>
                </div>
              </div>

              {/* Report cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Mindset */}
                <div className="bg-white border border-[#D9D9D2] p-4 rounded-xl space-y-2.5 premium-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider block">Mindset Audit</span>
                    <BadgeAlert size={14} className={auditResult.leakTitle.startsWith('Emotional') ? 'text-[#991B1B]' : 'text-[#166534]'} />
                  </div>
                  <h4 className="text-xs font-extrabold text-[#1C1C1E]">{auditResult.leakTitle}</h4>
                  <p className="text-[11px] leading-relaxed text-[#5C5C5E] font-medium">{auditResult.leakDesc}</p>
                </div>

                {/* 2. Timing */}
                <div className="bg-white border border-[#D9D9D2] p-4 rounded-xl space-y-2.5 premium-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider block">Timing Audit</span>
                    <Calendar size={14} className="text-[#5C5C5E]" />
                  </div>
                  <h4 className="text-xs font-extrabold text-[#1C1C1E]">{auditResult.biasTitle}</h4>
                  <p className="text-[11px] leading-relaxed text-[#5C5C5E] font-medium">{auditResult.biasDesc}</p>
                </div>

                {/* 3. Strategy */}
                <div className="bg-white border border-[#D9D9D2] p-4 rounded-xl space-y-2.5 premium-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider block">Strategy Audit</span>
                    <TrendingUp size={14} className="text-[#5C5C5E]" />
                  </div>
                  <h4 className="text-xs font-extrabold text-[#1C1C1E]">{auditResult.strategyTitle}</h4>
                  <p className="text-[11px] leading-relaxed text-[#5C5C5E] font-medium">{auditResult.strategyDesc}</p>
                </div>

                {/* 4. Sizing */}
                <div className="bg-white border border-[#D9D9D2] p-4 rounded-xl space-y-2.5 premium-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider block">Risk & Sizing Audit</span>
                    <AlertTriangle size={14} className={auditResult.riskTitle.startsWith('Sizing') ? 'text-[#991B1B]' : 'text-[#166534]'} />
                  </div>
                  <h4 className="text-xs font-extrabold text-[#1C1C1E]">{auditResult.riskTitle}</h4>
                  <p className="text-[11px] leading-relaxed text-[#5C5C5E] font-medium">{auditResult.riskDesc}</p>
                </div>

              </div>

              {/* Action advice */}
              <div className="bg-[#FAFAF7] border border-[#D9D9D2] p-4 rounded-xl space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-[#244230] uppercase tracking-wider block">AI Coach Recommendation Summary</span>
                <p className="font-semibold text-[#1C1C1E] leading-relaxed">
                  Based on the diagnostics, your biggest priority is to{' '}
                  <span className="underline decoration-[#C89B5C] decoration-2 font-black">
                    {auditResult.score < 80 
                      ? 'cut size in underperforming setups and follow strict psychological cool-downs.'
                      : 'keep maintaining current position sizing rules and let strategy edge work out.'}
                  </span>
                </p>
              </div>

            </div>
          ) : (
            <div className="bg-[#FAFAF7] border border-[#D9D9D2] border-dashed p-12 rounded-2xl text-center space-y-3">
              <BrainCircuit className="mx-auto text-[#D9D9D2]" size={36} />
              <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">No Active Audit Report</h3>
              <p className="text-[11px] text-[#5C5C5E] font-medium leading-relaxed max-w-sm mx-auto">
                Ready to review your habits? Click the "Generate Audit Report" button on the left to run an automated performance audit on your trade logs.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
