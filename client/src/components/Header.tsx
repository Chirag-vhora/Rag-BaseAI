import React from 'react';
import { UserRole } from '../types';
import { Bot, Shield, User, Database, MessageSquare } from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-700/60 px-4 lg:px-8 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                NexusHR Assistant
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full uppercase">
                RAG Grounded v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Enterprise HR Policy Engine & Vector Search • <span className="text-emerald-400 font-medium">{totalDocs} Docs</span> ({totalChunks} vector chunks)
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Employee AI Chat
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'documents'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Knowledge Base
            {totalDocs > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-slate-800 text-blue-400 rounded-full font-bold">
                {totalDocs}
              </span>
            )}
          </button>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium px-2 hidden sm:inline">Active View:</span>
          
          <button
            onClick={() => setActiveRole('employee')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeRole === 'employee'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Standard employee mode (Can access General Company Policies)"
          >
            <User className="h-3.5 w-3.5" />
            Employee
          </button>

          <button
            onClick={() => setActiveRole('hr_admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeRole === 'hr_admin'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
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
