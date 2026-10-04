import React from 'react';
import { UserRole } from '../types';
import { Bot, Shield, User, Database, MessageSquare } from 'lucide-react';
import { useTilt } from '../hooks/useTilt';

interface HeaderProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: 'chat' | 'documents';
  setActiveTab: (tab: 'chat' | 'documents') => void;
  totalDocs: number;
  totalChunks: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
  totalDocs,
  totalChunks
}) => {
  const brandRef = useTilt<HTMLDivElement>(5);

  const tabBase =
    'relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap';

  return (
    <header className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 border-b border-white/10 px-4 lg:px-8 py-3.5 backdrop-blur-2xl">
      {/* Solid top accent rail (indigo) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#6366f1]" />

      <div className="max-w-7xl mx-auto flex flex-wrap md:flex-row items-center justify-between gap-3 lg:gap-4">

        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          <div
            ref={brandRef}
            className="tilt tilt-glare relative h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden bg-[#4f46e5] shadow-lg shadow-indigo-700/50"
          >
            <span className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.35),transparent_45%)] opacity-70" />
            <Bot className="relative h-6 w-6 text-white drop-shadow" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-shimmer whitespace-nowrap">
                NexusHR Assistant
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-100 bg-[#312e81] border border-[#6366f1]/50 rounded-full uppercase whitespace-nowrap">
                RAG Grounded v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 whitespace-nowrap">
              Enterprise HR Policy Engine &amp; Vector Search •{' '}
              <span className="text-emerald-300 font-medium">{totalDocs} Docs</span>{' '}
              <span className="text-slate-500">({totalChunks} vector chunks)</span>
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-[#0e1225] border border-white/10 shadow-inner">
          <button
            onClick={() => setActiveTab('chat')}
            className={`${tabBase} ${
              activeTab === 'chat'
                ? 'text-white bg-[#4f46e5] shadow-md shadow-indigo-900/70'
                : 'text-slate-400 hover:text-white hover:bg-[#1b2140]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Employee AI Chat
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`${tabBase} ${
              activeTab === 'documents'
                ? 'text-white bg-[#4f46e5] shadow-md shadow-indigo-900/70'
                : 'text-slate-400 hover:text-white hover:bg-[#1b2140]'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Knowledge Base
            {totalDocs > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#164e63] text-cyan-100 rounded-full font-bold tabular-nums">
                {totalDocs}
              </span>
            )}
          </button>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0e1225] border border-white/10">
          <span className="text-[11px] text-slate-400 font-medium px-2 hidden sm:inline whitespace-nowrap">
            Active View:
          </span>

          <button
            onClick={() => setActiveRole('employee')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
              activeRole === 'employee'
                ? 'bg-[#059669] text-white shadow-md shadow-emerald-950/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2140]'
            }`}
            title="Standard employee mode (Can access General Company Policies)"
          >
            <User className="h-3.5 w-3.5" />
            Employee
          </button>

          <button
            onClick={() => setActiveRole('hr_admin')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
              activeRole === 'hr_admin'
                ? 'bg-[#7c3aed] text-white shadow-md shadow-violet-950/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b2140]'
            }`}
            title="HR & Admin mode (Can access All Policies including Executive HR Restricted Files)"
          >
            <Shield className="h-3.5 w-3.5" />
            HR / Admin
          </button>
        </div>

      </div>
    </header>
  );
};
