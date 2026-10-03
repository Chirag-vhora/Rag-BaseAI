import React from 'react';
import { UserRole } from '../types';
import { MessageSquare, Trash2, HelpCircle, Shield, Sparkles, CheckCircle } from 'lucide-react';

interface HistorySidebarProps {
  activeRole: UserRole;
  onSelectPrompt: (prompt: string) => void;
  onClearHistory: () => void;
  messageCount: number;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  activeRole,
  onSelectPrompt,
  onClearHistory,
  messageCount
}) => {
  const samplePrompts = [
    {
      title: 'Leave Entitlements',
      prompt: 'How many annual sick leaves and casual leaves am I entitled to in 2026?'
    },
    {
      title: 'Remote Work Policy',
      prompt: 'What are the rules and core working hours for Work-From-Home (WFH)?'
    },
    {
      title: 'Health Benefits',
      prompt: 'What medical insurance and wellness stipends does the company offer?'
    },
    {
      title: 'Salary & Ratings (HR)',
      prompt: 'What are the performance review salary revision bands for Rating 5?',
      hrOnly: true
    },
    {
      title: 'Ungrounded Test',
      prompt: 'What is the policy on company-sponsored space travel and interplanetary relocation?'
    }
  ];

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4">
      
      {/* Session Management */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            Session History
          </span>
          <button
            onClick={onClearHistory}
            className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 p-1 hover:bg-slate-800 rounded transition-all"
            title="Reset conversation"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          Current active session contains <span className="text-blue-400 font-bold">{messageCount}</span> messages.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-400" />
          Suggested Questions
        </h4>
        <p className="text-[11px] text-slate-400">
          Click any sample question to evaluate RAG retrieval and role access filtering live:
        </p>

        <div className="space-y-2 pt-1">
          {samplePrompts.map((item, idx) => {
            const isLocked = item.hrOnly && activeRole !== 'hr_admin';
            return (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                  isLocked
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-500 hover:border-purple-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1">
                    {item.title}
                  </span>
                  {item.hrOnly && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-0.5">
                      <Shield className="h-2.5 w-2.5" /> HR Restricted
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-2">{item.prompt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grounding & Anti-Hallucination Indicator */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <CheckCircle className="h-4 w-4" />
          Anti-Hallucination Active
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          The AI strictly verifies vector match scores before generating answers. If the policy information is missing, it will explicitly inform you instead of generating false facts.
        </p>
      </div>

    </aside>
  );
};
