import type { Trade } from '../types';
import { parseISO, getDay } from 'date-fns';

export interface CalculatedStats {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  avgPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  rrRatio: number;
  expectancy: number;
  maxDrawdown: number;
  sharpeRatio: number;
  avgHoldStr: string;
}

export interface InsightCard {
  id: string;
  title: string;
  description: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning';
  metric?: string;
  iconName: string;
}

// Map strategies to estimated hold times in hours
const STRATEGY_HOLD_TIMES: Record<string, number> = {
  'Scalp': 0.2, // 12 mins
  'ORB 15 min': 0.75, // 45 mins
  'VWAP Rejection': 1.5,
  'Trendline Breakout': 3.5,
  'Support/Resistance': 6.5,
  'Moving Average Crossover': 18.0,
  'Naked Price Action': 2.5
};

export function calculateStats(trades: Trade[], startingCapital: number = 0): CalculatedStats {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const totalTrades = closedTrades.length;

  if (totalTrades === 0) {
    return {
      totalPnL: 0,
      winRate: 0,
      totalTrades: 0,
      avgPnL: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 1,
      rrRatio: 0,
      expectancy: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      avgHoldStr: '0.0h'
    };
  }

  // P&L and Win Rate
  const totalPnL = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
  const winTrades = closedTrades.filter(t => t.pnl > 0);
  const lossTrades = closedTrades.filter(t => t.pnl < 0);
  const winRate = (winTrades.length / totalTrades) * 100;
  const avgPnL = totalPnL / totalTrades;

  // Average Win and Loss
  const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + t.pnl, 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0) / lossTrades.length) : 0;

  // Profit Factor
  const totalWins = winTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? Infinity : 1);

  // R:R Ratio
  const rrRatio = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? Infinity : 1);

  // Expectancy
  const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);

  // Average Hold calculation based on strategy hold times
  const totalHoldHours = closedTrades.reduce((sum, t) => {
    return sum + (STRATEGY_HOLD_TIMES[t.strategy] || 2.0);
  }, 0);
  const avgHoldHours = totalHoldHours / totalTrades;
  const avgHoldStr = avgHoldHours < 1
    ? `${Math.round(avgHoldHours * 60)}m`
    : `${avgHoldHours.toFixed(1)}h`;

  // Chronological sorting for Max Drawdown and Sharpe Ratio
  const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Max Drawdown (percentage peak-to-trough on sorted-by-date equity curve)
  const initialCapital = startingCapital;
  let runningEquity = initialCapital;
  let peak = initialCapital;
  let maxDdPct = 0;

  for (const t of sortedTrades) {
    runningEquity += t.pnl;
    if (runningEquity > peak) {
      peak = runningEquity;
    }
    const currentDdPct = ((peak - runningEquity) / peak) * 100;
    if (currentDdPct > maxDdPct) {
      maxDdPct = currentDdPct;
    }
  }
  const maxDrawdown = maxDdPct;

  // Sharpe Ratio = (meanPnlPct / stdDevPnlPct) * sqrt(252)
  const pnlPctList = closedTrades.map(t => t.pnlPercentage);
  const meanPnlPct = pnlPctList.reduce((sum, p) => sum + p, 0) / pnlPctList.length;
  
  let stdDevPnlPct = 0;
  if (pnlPctList.length > 1) {
    const variance = pnlPctList.reduce((sum, p) => sum + Math.pow(p - meanPnlPct, 2), 0) / (pnlPctList.length - 1);
    stdDevPnlPct = Math.sqrt(variance);
  }

  const sharpeRatio = stdDevPnlPct > 0 ? (meanPnlPct / stdDevPnlPct) * Math.sqrt(252) : 0;

  return {
    totalPnL,
    winRate,
    totalTrades,
    avgPnL,
    avgWin,
    avgLoss,
    profitFactor,
    rrRatio,
    expectancy,
    maxDrawdown,
    sharpeRatio,
    avgHoldStr
  };
}

export function generateCoachInsights(trades: Trade[], customInstructions: string = '', startingCapital: number = 0): InsightCard[] {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const insights: InsightCard[] = [];

  if (closedTrades.length === 0) {
    insights.push({
      id: 'no-data',
      title: 'Welcome to Journal.ai',
      description: 'Start logging your trades. Once you close your first trade, the AI Trading Coach will analyze your performance, habits, and emotional leaks here.',
      tone: 'neutral',
      iconName: 'Compass'
    });
    return insights;
  }

  const stats = calculateStats(trades, startingCapital);

  // 1. Best / Worst Day of Week (min 1 trade per day to qualify)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPnls: Record<number, number> = {};
  const dayCounts: Record<number, number> = {};

  closedTrades.forEach(t => {
    const d = getDay(parseISO(t.date));
    dayPnls[d] = (dayPnls[d] || 0) + t.pnl;
    dayCounts[d] = (dayCounts[d] || 0) + 1;
  });

  let bestDayIndex = -1;
  let worstDayIndex = -1;
  let maxDayPnL = -Infinity;
  let minDayPnL = Infinity;

  dayNames.forEach((_, idx) => {
    if (dayCounts[idx] >= 1) {
      const pnl = dayPnls[idx];
      if (pnl > maxDayPnL) {
        maxDayPnL = pnl;
        bestDayIndex = idx;
      }
      if (pnl < minDayPnL) {
        minDayPnL = pnl;
        worstDayIndex = idx;
      }
    }
  });

  if (bestDayIndex !== -1 && maxDayPnL > 0) {
    insights.push({
      id: 'best-day',
      title: `Top Trading Day: ${dayNames[bestDayIndex]}`,
      description: `Your execution is highly profitable on ${dayNames[bestDayIndex]}s, yielding a total P&L of ₹${maxDayPnL.toLocaleString('en-IN')}. Focus on replicating this mindset.`,
      tone: 'positive',
      metric: `+₹${maxDayPnL.toLocaleString('en-IN')}`,
      iconName: 'CalendarCheck'
    });
  }

  if (worstDayIndex !== -1 && minDayPnL < 0) {
    insights.push({
      id: 'worst-day',
      title: `Red Flag Day: ${dayNames[worstDayIndex]}`,
      description: `Your performance dips on ${dayNames[worstDayIndex]}s with a net loss of ₹${Math.abs(minDayPnL).toLocaleString('en-IN')}. Consider reducing position sizes or raising your entry criteria on this day.`,
      tone: 'negative',
      metric: `-₹${Math.abs(minDayPnL).toLocaleString('en-IN')}`,
      iconName: 'CalendarX'
    });
  }

  // 2. Best / Worst Strategy (min 2 trades to qualify)
  const stratPnls: Record<string, number> = {};
  const stratCounts: Record<string, number> = {};

  closedTrades.forEach(t => {
    stratPnls[t.strategy] = (stratPnls[t.strategy] || 0) + t.pnl;
    stratCounts[t.strategy] = (stratCounts[t.strategy] || 0) + 1;
  });

  let bestStrat = '';
  let worstStrat = '';
  let maxStratPnL = -Infinity;
  let minStratPnL = Infinity;

  Object.keys(stratPnls).forEach(strat => {
    if (stratCounts[strat] >= 2) {
      const pnl = stratPnls[strat];
      if (pnl > maxStratPnL) {
        maxStratPnL = pnl;
        bestStrat = strat;
      }
      if (pnl < minStratPnL) {
        minStratPnL = pnl;
        worstStrat = strat;
      }
    }
  });

  if (bestStrat && maxStratPnL > 0) {
    insights.push({
      id: 'best-strategy',
      title: `Edge Confirmed: ${bestStrat}`,
      description: `The "${bestStrat}" strategy is your strongest edge right now, with a win rate driven profit of ₹${maxStratPnL.toLocaleString('en-IN')} across ${stratCounts[bestStrat]} setups.`,
      tone: 'positive',
      metric: `+₹${maxStratPnL.toLocaleString('en-IN')}`,
      iconName: 'TrendingUp'
    });
  }

  if (worstStrat && minStratPnL < 0) {
    insights.push({
      id: 'worst-strategy',
      title: `Strategy Leak: ${worstStrat}`,
      description: `The "${worstStrat}" strategy has cost you ₹${Math.abs(minStratPnL).toLocaleString('en-IN')}. Review your criteria for this setup or temporarily pause trading it until backtested.`,
      tone: 'negative',
      metric: `-₹${Math.abs(minStratPnL).toLocaleString('en-IN')}`,
      iconName: 'AlertTriangle'
    });
  }

  // 3. Avg Win : Avg Loss (R:R card, tone based on value ≥1.5/≥1/<1)
  const rr = stats.rrRatio;
  let rrTone: 'positive' | 'neutral' | 'warning' | 'negative';
  let rrDesc: string;

  if (rr >= 1.5) {
    rrTone = 'positive';
    rrDesc = `Excellent Risk to Reward profile. Your average winning trade (₹${Math.round(stats.avgWin).toLocaleString('en-IN')}) is ${rr.toFixed(2)}x larger than your average losing trade (₹${Math.round(stats.avgLoss).toLocaleString('en-IN')}). This makes your system extremely robust even at lower win rates.`;
  } else if (rr >= 1.0) {
    rrTone = 'warning';
    rrDesc = `Your Risk to Reward is currently hovering at ${rr.toFixed(2)}x. While profitable, you are heavily relying on a high win rate to stay green. Aim to cut losses quicker or let your winners run to the full target.`;
  } else {
    rrTone = 'negative';
    rrDesc = `Negative Risk to Reward profile (${rr.toFixed(2)}x). Your average loss is larger than your average win. This is a highly vulnerable system that will bleed capital over time. Stop shifting stop losses!`;
  }

  insights.push({
    id: 'rr-profile',
    title: 'Risk to Reward Profile',
    description: rrDesc,
    tone: rrTone,
    metric: `${rr.toFixed(2)} R:R`,
    iconName: 'ShieldAlert'
  });

  // 4. Mental leak — worst-performing emotion (min 2 trades, only if negative)
  const emotionPnls: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};

  closedTrades.forEach(t => {
    emotionPnls[t.emotion] = (emotionPnls[t.emotion] || 0) + t.pnl;
    emotionCounts[t.emotion] = (emotionCounts[t.emotion] || 0) + 1;
  });

  let worstEmotion = '';
  let worstEmotionPnL = 0;

  Object.keys(emotionPnls).forEach(emoji => {
    if (emotionCounts[emoji] >= 2 && emotionPnls[emoji] < worstEmotionPnL) {
      worstEmotionPnL = emotionPnls[emoji];
      worstEmotion = emoji;
    }
  });

  if (worstEmotion && worstEmotionPnL < 0) {
    const emotionName = worstEmotion === '😡' ? 'Revenge' : worstEmotion === '😟' ? 'Anxious' : worstEmotion === '🤔' ? 'Indecisive' : worstEmotion === '😴' ? 'Bored' : 'Uncalm';
    insights.push({
      id: 'mental-leak',
      title: `Mental Leak: ${worstEmotion} ${emotionName}`,
      description: `Trading while feeling "${emotionName}" has resulted in a cumulative loss of ₹${Math.abs(worstEmotionPnL).toLocaleString('en-IN')} over ${emotionCounts[worstEmotion]} trades. Prioritize mindfulness and walk away when this feeling arises.`,
      tone: 'negative',
      metric: `-₹${Math.abs(worstEmotionPnL).toLocaleString('en-IN')}`,
      iconName: 'Activity'
    });
  }

  // 5. Streak detection — current win/loss streak ≥3
  const sortedByDate = [...closedTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (sortedByDate.length >= 3) {
    let streakType: 'win' | 'loss' | null = null;
    let streakCount = 0;

    // Start at the end and walk backwards
    const lastPnl = sortedByDate[sortedByDate.length - 1].pnl;
    if (lastPnl > 0) {
      streakType = 'win';
      streakCount = 1;
      for (let i = sortedByDate.length - 2; i >= 0; i--) {
        if (sortedByDate[i].pnl > 0) {
          streakCount++;
        } else {
          break;
        }
      }
    } else if (lastPnl < 0) {
      streakType = 'loss';
      streakCount = 1;
      for (let i = sortedByDate.length - 2; i >= 0; i--) {
        if (sortedByDate[i].pnl < 0) {
          streakCount++;
        } else {
          break;
        }
      }
    }

    if (streakCount >= 3) {
      if (streakType === 'win') {
        insights.push({
          id: 'streak',
          title: `On Fire: ${streakCount}-Win Streak!`,
          description: `Excellent focus! You are on a ${streakCount} consecutive winning streak. Stay humble, avoid size inflation, and continue trading only high-quality setups.`,
          tone: 'positive',
          metric: `${streakCount} Wins`,
          iconName: 'Flame'
        });
      } else {
        insights.push({
          id: 'streak',
          title: `Caution: ${streakCount}-Loss Streak`,
          description: `You have stopped out of ${streakCount} consecutive trades. Drawdowns are normal, but revenge trading is lethal. Consider taking a 24-hour break to reset your mind.`,
          tone: 'warning',
          metric: `${streakCount} Losses`,
          iconName: 'AlertTriangle'
        });
      }
    }
  }

  // 6. Custom Instructions text card (custom active context)
  if (customInstructions.trim()) {
    insights.unshift({
      id: 'custom-coaching',
      title: 'Coaching Focus Enabled',
      description: `Active focus: "${customInstructions}". The coach is monitoring your logs for compliance. Always remember: patience creates edge, discipline preserves capital.`,
      tone: 'warning',
      iconName: 'BrainCircuit'
    });
  }

  return insights;
}
