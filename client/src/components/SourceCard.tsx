import React, { useState } from 'react';
import { SourceReference } from '../types';
import { FileText, Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface SourceCardProps {
  source: SourceReference;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const [expanded, setExpanded] = useState(false);

  const scorePercent = Math.round(source.score * 100);

  const relevanceTone =
    source.score >= 0.5
      ? { chip: 'bg-[#064e3b] text-emerald-50 border-[#10b981]/50', bar: '#10b981' }
      : source.score >= 0.25
      ? { chip: 'bg-[#155e75] text-cyan-50 border-[#22d3ee]/50', bar: '#22d3ee' }
      : { chip: 'bg-[#78350f] text-amber-50 border-[#f59e0b]/50', bar: '#f59e0b' };

  return (
    <div className="glass-card rounded-xl p-3 text-xs transition-all duration-300 hover:border-indigo-400/40 hover:shadow-[0_16px_34px_-24px_rgba(99,102,241,0.9)]">
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="h-6 w-6 shrink-0 rounded-lg flex items-center justify-center bg-[#312e81] border border-[#6366f1]/50 text-indigo-100">
            <FileText className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-slate-200 truncate" title={source.documentName}>
            [{index + 1}] {source.documentName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {source.roleAccess === 'hr_admin' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-[#4c1d95] text-violet-50 border border-[#8b5cf6]/50 font-medium">
              <Shield className="h-3 w-3" /> HR Restricted
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tabular-nums ${relevanceTone.chip}`}>
            {scorePercent}% match
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-[#1b2140] rounded text-slate-400 hover:text-white transition-colors"
            aria-label={expanded ? 'Collapse source excerpt' : 'Expand source excerpt'}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Relevance meter */}
      <div className="relative z-10 mt-2.5 h-1 rounded-full bg-[#090c1a] overflow-hidden">
        <div
          className="meter-fill h-full rounded-full"
          style={{ width: `${Math.max(scorePercent, 3)}%`, backgroundColor: relevanceTone.bar }}
        />
      </div>

      <div
        className={`relative z-10 mt-2.5 text-slate-300 leading-relaxed font-mono bg-[#090c1a] p-2.5 rounded-lg border border-white/10 text-[11px] whitespace-pre-wrap ${
          !expanded ? 'line-clamp-2' : ''
        }`}
      >
        {source.chunkSnippet}
      </div>
    </div>
  );
};
