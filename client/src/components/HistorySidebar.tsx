import React from 'react';
import { UserRole } from '../types';
import { MessageSquare, Trash2, Shield, Sparkles, CheckCircle } from 'lucide-react';
import { useTilt } from '../hooks/useTilt';

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
  const sessionRef = useTilt<HTMLDivElement>(3);
  const guardRef = useTilt<HTMLDivElement>(3);

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
      <div
        ref={sessionRef}
        className="tilt tilt-glare glass-panel p-4 rounded-2xl space-y-3"
      >
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-indigo-300" />
            Session History
          </span>
          <button
            onClick={onClearHistory}
            className="btn-ghost text-[11px] text-slate-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded-lg"
            title="Reset conversation"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
        <p className="relative z-10 text-[11px] text-slate-400">
          Current active session contains{' '}
          <span className="text-cyan-300 font-bold">{messageCount}</span> messages.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <h4 className="relative z-10 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-300" />
          Suggested Questions
        </h4>
        <p className="relative z-10 text-[11px] text-slate-400">
          Click any sample question to evaluate RAG retrieval and role access filtering live:
        </p>

        <div className="relative z-10 space-y-2 pt-1">
          {samplePrompts.map((item, idx) => {
            const isLocked = item.hrOnly && activeRole !== 'hr_admin';
            return (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt)}
                className={`group w-full text-left p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all duration-300 ${
                  isLocked
                    ? 'bg-[#0b0f1f] border border-white/10 text-slate-500 hover:border-[#8b5cf6]'
                    : 'bg-[#151a30] border border-white/10 text-slate-300 hover:text-white hover:border-[#6366f1] hover:translate-x-1 hover:shadow-[0_10px_26px_-18px_rgba(99,102,241,1)]'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1">{item.title}</span>
                  {item.hrOnly && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4c1d95] text-violet-50 border border-[#8b5cf6]/50 font-semibold flex items-center gap-0.5">
                      <Shield className="h-2.5 w-2.5" /> HR Restricted
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-2 group-hover:text-slate-300">
                  {item.prompt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grounding & Anti-Hallucination Indicator */}
      <div
        ref={guardRef}
        className="tilt tilt-glare glass-panel p-4 rounded-2xl space-y-2 text-xs"
      >
        <div className="relative z-10 flex items-center gap-2 text-emerald-300 font-semibold">
          <CheckCircle className="h-4 w-4" />
          Anti-Hallucination Active
        </div>
        <p className="relative z-10 text-[11px] text-slate-400 leading-relaxed">
          The AI strictly verifies vector match scores before generating answers. If the policy
          information is missing, it will explicitly inform you instead of generating false facts.
        </p>
      </div>

    </aside>
  );
};
