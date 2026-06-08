import React, { useState, useEffect, useRef } from 'react';
import type { Trade } from '../types';
import { 
  Sparkles, 
  BrainCircuit, 
  Loader2, 
  Calendar,
  AlertTriangle, 
  BadgeAlert, 
  TrendingUp, 
  Send, 
  User, 
  MessageSquare, 
  ShieldAlert,
  ListTodo
} from 'lucide-react';
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
  setCustomInstructions,
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



  // Chatbox state
  const [chatInput, setChatInput] = useState<string>('');
  const [isCoachTyping, setIsCoachTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ sender: 'coach' | 'user'; text: string; time: string }>>([
    {
      sender: 'coach',
      text: 'Hello! I am your Journal.ai Coach. I analyze your logged trades, emotions, and compliance tags to help you trade better. Ask me about your "worst emotion", "worst day", "worst strategy", or "discipline score" for custom, data-driven feedback!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCoachTyping]);

  const closedTrades = trades.filter((t) => t.status === 'CLOSED');

  // 1. Emotion Mindset Audit calculation
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

  const worstEmotionName = worstEmoji ? (emotionNames[worstEmoji] || 'Uncalm') : 'None';

  // 2. Weekday Bias Audit calculation
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

  const worstDayName = worstDayIdx !== -1 ? dayNames[worstDayIdx] : 'None';

  // 3. Strategy Critique calculation
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

  // 4. Sizing & Risk Audit calculation
  const wins = closedTrades.filter((t) => t.pnl > 0);
  const losses = closedTrades.filter((t) => t.pnl < 0);
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0)) / losses.length : 0;
  const sizingError = avgLoss > avgWin;

  // Discipline Score calculation based on compliance tags
  let complianceRuleCount = 0;
  let infractionsCount = 0;
  closedTrades.forEach((t) => {
    const tradeTags = t.tags || [];
    tradeTags.forEach((tag) => {
      if (tag === '#FollowedRules') {
        complianceRuleCount++;
      } else if (['#NoStopLoss', '#RevengeTrade', '#Overtrading', '#ChasingPrice', '#FOMO'].includes(tag)) {
        infractionsCount++;
      }
    });
  });

  let calculatedScore = 100;
  calculatedScore -= infractionsCount * 12;
  calculatedScore += complianceRuleCount * 4;
  if (sizingError) calculatedScore -= 15;
  if (worstEmoji) calculatedScore -= 10;
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  const runAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
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

      const leakTitle = worstEmoji ? `Emotional Leak: ${worstEmoji} ${worstEmotionName}` : 'Mindset Check: Disciplined';
      const leakDesc = worstEmoji
        ? `You have lost a total of ₹${Math.abs(worstEmojiPnl).toLocaleString('en-IN')} across ${emotionCounts[worstEmoji]} trades when feeling ${worstEmotionName}. This indicates a strong psychological leak. Prioritize walking away from the terminal when these feelings arise.`
        : 'Congratulations! Your logs do not show any significant negative emotional patterns. Keep maintaining your trading discipline!';

      const biasTitle = worstDayIdx !== -1 ? `Weekday Bias: ${worstDayName}` : 'Calendar Symmetry: Good';
      const biasDesc = worstDayIdx !== -1
        ? `You are underperforming on ${worstDayName}s, suffering a net loss of ₹${Math.abs(worstDayPnl).toLocaleString('en-IN')}. This could be due to end-of-week exhaustion or opening-bell volatility. Consider half-sizing your positions on this day.`
        : 'Your performance is well-distributed throughout the week with no major red weekdays.';

      const strategyTitle = worstStrat ? `Underperforming Setup: ${worstStrat}` : 'Strategies Edge: Confirmed';
      const strategyDesc = worstStrat
        ? `The "${worstStrat}" setup has leaked ₹${Math.abs(worstStratPnl).toLocaleString('en-IN')} across ${stratCounts[worstStrat]} attempts. This setup currently has a negative mathematical expectancy. Consider pausing this strategy or tightening its entry conditions.`
        : 'All of your logged strategy setups are yielding positive or break-even results. Maintain your setup selection!';

      const riskTitle = sizingError ? 'Sizing Risk: High Loss Volatility' : 'Risk Management: Structured';
      const riskDesc = sizingError
        ? `Your average losing trade (₹${Math.round(avgLoss).toLocaleString('en-IN')}) is larger than your average winning trade (₹${Math.round(avgWin).toLocaleString('en-IN')}). This means you are averaging down or holding onto losing trades too long. Tighten your stop loss discipline.`
        : `Excellent! Your average winning trade (₹${Math.round(avgWin).toLocaleString('en-IN')}) is larger than your average loss (₹${Math.round(avgLoss).toLocaleString('en-IN')}). You have a positive risk expectancy.`;

      setAuditResult({
        leakTitle,
        leakDesc,
        biasTitle,
        biasDesc,
        strategyTitle,
        strategyDesc,
        riskTitle,
        riskDesc,
        score: calculatedScore
      });
      setIsAuditing(false);
    }, 1500);
  };



  // AI Chat reply simulator
  const handleSendChatMessage = (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    // Add user message
    const userMsg = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    // Trigger coach thinking
    setIsCoachTyping(true);

    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      let replyText = '';

      if (lowerQuery.includes('emotion') || lowerQuery.includes('feeling') || lowerQuery.includes('psychology')) {
        replyText = worstEmoji
          ? `Your logs show that you have an emotional leak when feeling **${worstEmotionName}** (${worstEmoji}). You lost a total of ₹${Math.abs(worstEmojiPnl).toLocaleString('en-IN')} when trading in this state. My advice: place your mouse away from the desk and shut the terminal when you experience this feeling.`
          : `Excellent mindset discipline! Your logs do not show any significant negative emotional leaks. Your calm and centered approach is preserving your capital.`;
      } else if (lowerQuery.includes('day') || lowerQuery.includes('calendar') || lowerQuery.includes('weekday') || lowerQuery.includes('monday') || lowerQuery.includes('friday')) {
        replyText = worstDayIdx !== -1
          ? `Your calendar bias analysis points to **${worstDayName}**s as your weakest day, leaking ₹${Math.abs(worstDayPnl).toLocaleString('en-IN')} in total. Consider ending your trading week early or half-sizing on this specific day.`
          : `Your trading performance is evenly distributed across all days of the week, showing excellent timing symmetry.`;
      } else if (lowerQuery.includes('strategy') || lowerQuery.includes('setup')) {
        replyText = worstStrat
          ? `The strategy setup **${worstStrat}** is currently underperforming, leaking a total of ₹${Math.abs(worstStratPnl).toLocaleString('en-IN')} across your closed trades. I recommend reviewing your logs to ensure you are not chasing entries or ignoring stop-losses inside this setup.`
          : `Excellent! All of your logged strategy setups are yielding positive or break-even results. Maintain your setup selection!`;
      } else if (lowerQuery.includes('score') || lowerQuery.includes('discipline') || lowerQuery.includes('rules')) {
        replyText = `Your current discipline score is **${calculatedScore}/100**, calculated from ${complianceRuleCount} followed rules and ${infractionsCount} logged infractions. ${calculatedScore < 80 ? 'You should prioritize entering only A+ setups and tagging trades with #FollowedRules.' : 'Great job maintaining rules compliance!'}`;
      } else if (lowerQuery.includes('expectancy') || lowerQuery.includes('win') || lowerQuery.includes('loss') || lowerQuery.includes('sizing')) {
        replyText = `Your average win is ₹${Math.round(avgWin).toLocaleString('en-IN')} and your average loss is ₹${Math.round(avgLoss).toLocaleString('en-IN')}. ${sizingError ? 'Your average loss is larger than your average win, showing a Sizing Risk. Prioritize setting hard stop losses.' : 'You have a healthy, positive sizing expectancy!'}`;
      } else {
        replyText = `I can help you audit your habits. Try asking about your "worst emotion", "worst day", "worst strategy", or "discipline score" to get tailored, data-driven feedback from your trade logs.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'coach',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsCoachTyping(false);
    }, 800);
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
        
        {/* Left Column: Guidelines & Audit (Col 1) */}
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

        {/* Right Column: Audit Results & Cognitive Checklist & Chatbox (Col 2 & 3) */}
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

              {/* Cognitive Bias Checklist */}
              <div className="bg-white border border-[#D9D9D2] rounded-2xl overflow-hidden premium-shadow p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#D9D9D2]/50 pb-3">
                  <ListTodo size={16} className="text-[#244230]" />
                  <h3 className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider">
                    Cognitive Bias Diagnostics
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {/* Loss Aversion Check */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAF7]">
                    <ShieldAlert className={sizingError ? 'text-[#991B1B] shrink-0 mt-0.5' : 'text-[#166534] shrink-0 mt-0.5'} size={16} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#1C1C1E]">Loss Aversion Bias</span>
                        <span className={`px-2 py-0.2 rounded-full text-[8px] font-extrabold uppercase tracking-wide ${
                          sizingError ? 'bg-[#FADCDC] text-[#991B1B]' : 'bg-[#D4E8DC] text-[#166534]'
                        }`}>
                          {sizingError ? 'High Risk' : 'Healthy'}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-[#5C5C5E] leading-relaxed">
                        {sizingError 
                          ? 'Your average loss exceeds your average win. You are holding losers too long. Implement a hard exit rule.' 
                          : 'You cut losers quickly and allow your winners to play out. Excellent risk control.'}
                      </p>
                    </div>
                  </div>

                  {/* Overtrading / Revenge Bias Check */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAF7]">
                    <ShieldAlert className={infractionsCount > 0 ? 'text-[#C89B5C] shrink-0 mt-0.5' : 'text-[#166534] shrink-0 mt-0.5'} size={16} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#1C1C1E]">Revenge Trading Trap</span>
                        <span className={`px-2 py-0.2 rounded-full text-[8px] font-extrabold uppercase tracking-wide ${
                          infractionsCount > 0 ? 'bg-[#FDF4E7] text-[#C89B5C]' : 'bg-[#D4E8DC] text-[#166534]'
                        }`}>
                          {infractionsCount > 0 ? 'Active Loop' : 'Controlled'}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-[#5C5C5E] leading-relaxed">
                        {infractionsCount > 0 
                          ? `You have logged ${infractionsCount} rules infractions recently. Emotional fatigue is triggering revenge impulses.` 
                          : 'Your trading logs indicate a disciplined execution routine without emotional chase.'}
                      </p>
                    </div>
                  </div>

                  {/* Day-of-Week Fatigue Check */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAF7]">
                    <ShieldAlert className={worstDayIdx !== -1 ? 'text-[#C89B5C] shrink-0 mt-0.5' : 'text-[#166534] shrink-0 mt-0.5'} size={16} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#1C1C1E]">Weekday Fatigue Bias</span>
                        <span className={`px-2 py-0.2 rounded-full text-[8px] font-extrabold uppercase tracking-wide ${
                          worstDayIdx !== -1 ? 'bg-[#FDF4E7] text-[#C89B5C]' : 'bg-[#D4E8DC] text-[#166534]'
                        }`}>
                          {worstDayIdx !== -1 ? 'Bias Detected' : 'Healthy'}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-[#5C5C5E] leading-relaxed">
                        {worstDayIdx !== -1 
                          ? `Significant losses clustered on ${worstDayName}s indicate localized underperformance. Consider reducing size on this day.` 
                          : 'Your trading performance is evenly distributed across the week with no fatigue leaks.'}
                      </p>
                    </div>
                  </div>
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

          {/* Interactive AI Coach Chatbox */}
          <div className="bg-white border border-[#D9D9D2] rounded-2xl overflow-hidden premium-shadow flex flex-col h-[400px]">
            <div className="p-4 bg-[#FAFAF7] border-b border-[#D9D9D2]/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-[#244230]" />
                <h3 className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider">AI Coach Chat</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-[#5C5C5E]">COACH ONLINE</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAF7]/30 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.sender === 'user' ? 'bg-[#244230] text-white' : 'bg-white border border-[#D9D9D2] text-[#C89B5C]'
                  }`}>
                    {msg.sender === 'user' ? <User size={12} /> : <Sparkles size={12} />}
                  </div>
                  <div className="space-y-1">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm/5 ${
                      msg.sender === 'user'
                        ? 'bg-[#244230] text-white rounded-tr-none'
                        : 'bg-white border border-[#D9D9D2]/60 text-[#1C1C1E] rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] font-bold text-[#5C5C5E] block px-1 text-right">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isCoachTyping && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-7 h-7 rounded-full bg-white border border-[#D9D9D2] text-[#C89B5C] flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles size={12} />
                  </div>
                  <div className="bg-white border border-[#D9D9D2]/60 p-3 rounded-2xl rounded-tl-none shadow-sm/5 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce duration-300" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce duration-300" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce duration-300" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action prompts */}
            <div className="p-2 border-t border-[#D9D9D2]/30 flex gap-1 overflow-x-auto scrollbar-none bg-white">
              <button
                onClick={() => handleSendChatMessage('What is my worst emotion?')}
                className="px-2.5 py-1 text-[9px] font-bold text-[#244230] bg-[#D4E8DC] hover:bg-[#c2decb] rounded-lg cursor-pointer shrink-0 transition-colors"
              >
                Worst Emotion?
              </button>
              <button
                onClick={() => handleSendChatMessage('Which weekday has my worst bias?')}
                className="px-2.5 py-1 text-[9px] font-bold text-[#244230] bg-[#D4E8DC] hover:bg-[#c2decb] rounded-lg cursor-pointer shrink-0 transition-colors"
              >
                Worst Weekday?
              </button>
              <button
                onClick={() => handleSendChatMessage('What strategysetup edge is failing?')}
                className="px-2.5 py-1 text-[9px] font-bold text-[#244230] bg-[#D4E8DC] hover:bg-[#c2decb] rounded-lg cursor-pointer shrink-0 transition-colors"
              >
                Worst Setup?
              </button>
              <button
                onClick={() => handleSendChatMessage('Check my discipline score')}
                className="px-2.5 py-1 text-[9px] font-bold text-[#244230] bg-[#D4E8DC] hover:bg-[#c2decb] rounded-lg cursor-pointer shrink-0 transition-colors"
              >
                Discipline Score?
              </button>
            </div>

            {/* Message input */}
            <div className="p-3 bg-white border-t border-[#D9D9D2]/70 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChatMessage();
                }}
                placeholder="Ask your AI Coach (e.g. 'What is my worst day?')"
                className="flex-1 px-3.5 py-2 text-xs bg-[#FAFAF7] border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#244230] font-bold text-[#1C1C1E]"
              />
              <button
                type="button"
                onClick={() => handleSendChatMessage()}
                className="p-2 bg-[#244230] hover:bg-[#1D3526] text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
