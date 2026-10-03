import React, { useState } from 'react';
import { SourceReference } from '../types';
import { FileText, Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface SourceCardProps {
  source: SourceReference;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const [expanded, setExpanded] = useState(false);

  const relevanceColor =
    source.score >= 0.5
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : source.score >= 0.25
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 text-xs transition-all hover:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate" title={source.documentName}>
            [{index + 1}] {source.documentName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {source.roleAccess === 'hr_admin' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
              <Shield className="h-3 w-3" /> HR Restricted
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${relevanceColor}`}>
            {Math.round(source.score * 100)}% match
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className={`mt-2 text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-[11px] whitespace-pre-wrap ${!expanded ? 'line-clamp-2' : ''}`}>
        {source.chunkSnippet}
      </div>
    </div>
  );
};
