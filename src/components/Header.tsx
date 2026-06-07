import React from 'react';
import { LayoutDashboard, PlusCircle, BookOpen, BarChart3, Radio } from 'lucide-react';
import type { TabType } from '../types';
import { motion } from 'framer-motion';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  netEquity: number;
  totalPnL: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  netEquity,
  totalPnL
}) => {
  const tabs = [
    { id: 'DASHBOARD' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'LOG' as TabType, label: 'Log Trade', icon: PlusCircle },
    { id: 'HISTORY' as TabType, label: 'History', icon: BookOpen },
    { id: 'ANALYTICS' as TabType, label: 'Analytics', icon: BarChart3 }
  ];

  const pnlIsPositive = totalPnL >= 0;

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-[#D9D9D2]/70 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#244230] flex items-center justify-center text-white font-semibold text-lg font-display">
            J
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-[#1C1C1E] tracking-tight leading-none">
              Journal.ai
            </h1>
            <span className="text-xs text-[#5C5C5E] font-medium tracking-wide">
              NSE/BSE & CRYPTO PORTFOLIO
            </span>
          </div>
        </div>

        {/* Center: Navigation Pill */}
        <nav className="flex bg-[#EAEAE2] p-1 rounded-full relative premium-shadow border border-[#D9D9D2]/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 z-10 flex items-center gap-2 ${
                  isActive ? 'text-white' : 'text-[#5C5C5E] hover:text-[#1C1C1E]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-[#244230] rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side: Live Badge + Equity */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAEAE2] border border-[#D9D9D2]/50 text-xs font-semibold text-[#1C1C1E]">
            <Radio size={14} className="text-[#166534] animate-pulse" />
            <span>LIVE NSE/BSE</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#5C5C5E] uppercase tracking-wider block">
              Net Portfolio Equity
            </span>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-lg font-extrabold text-[#1C1C1E] font-display">
                ₹{netEquity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  pnlIsPositive
                    ? 'bg-[#D4E8DC] text-[#166534]'
                    : 'bg-[#FADCDC] text-[#991B1B]'
                }`}
              >
                {pnlIsPositive ? '+' : ''}
                {totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="flex md:hidden items-center justify-between px-5 py-4 border-b border-[#D9D9D2]/70 bg-white/80 backdrop-blur-md sticky top-0 z-40 safe-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#244230] flex items-center justify-center text-white font-semibold font-display">
            J
          </div>
          <h1 className="text-lg font-bold font-display text-[#1C1C1E] tracking-tight">
            Journal.ai
          </h1>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold text-[#5C5C5E] uppercase tracking-wider block">
            Equity
          </span>
          <span className="text-sm font-extrabold text-[#1C1C1E] font-display">
            ₹{netEquity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </header>

      {/* Mobile Bottom Navigation Fixed Bar */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-md border-t border-[#D9D9D2]/70 justify-around py-2 px-3 z-40 premium-shadow safe-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold tracking-tight transition-colors ${
                isActive ? 'text-[#244230]' : 'text-[#5C5C5E]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl mb-0.5 transition-all ${
                  isActive ? 'bg-[#244230]/10 scale-110' : 'bg-transparent'
                }`}
              >
                <Icon size={20} />
              </div>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </>
  );
};
