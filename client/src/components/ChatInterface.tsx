import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserRole } from '../types';
import { SourceCard } from './SourceCard';
import { Bot, User, Send, AlertTriangle, Shield, Sparkles, FileText } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeRole: UserRole;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  activeRole
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-[78vh] glass-panel glass-rim rounded-3xl overflow-hidden shadow-[0_0_0_1px_rgba(99,102,241,0.30),0_0_40px_-8px_rgba(99,102,241,0.55),0_40px_90px_-50px_rgba(0,0,0,1)]">

      {/* Chat Sub-Header */}
      <div className="relative px-6 py-4 bg-[#151a30] border-b border-white/10 flex items-center justify-between">
        {/* Solid cyan divider — high contrast against the indigo rim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#22d3ee]" />

        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-xl flex items-center justify-center bg-[#312e81] border border-[#6366f1]/50 text-indigo-100">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              Enterprise Policy Assistant
              <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
            </h3>
            <p className="text-[10px] text-slate-400">
              Answers grounded strictly in indexed company policy documents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeRole === 'hr_admin' ? (
            <span className="px-2.5 py-1 text-[10px] bg-[#4c1d95] text-violet-100 border border-[#8b5cf6]/50 rounded-full font-semibold flex items-center gap-1">
              <Shield className="h-3 w-3" /> HR Admin Access Enabled
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[10px] bg-[#065f46] text-emerald-100 border border-[#10b981]/50 rounded-full font-semibold flex items-center gap-1">
              <User className="h-3 w-3" /> Standard Employee View
            </span>
          )}
        </div>
      </div>

      {/* Message History View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-5 max-w-md mx-auto py-12">
            {/* Soft 3D accent: floating glass cube */}
            <div className="cube-scene fade-up">
              <div className="cube-float">
                <div className="cube">
                  <div className="cube__face cube__face--front"><Sparkles className="h-6 w-6 text-indigo-100" /></div>
                  <div className="cube__face cube__face--back"><Bot className="h-6 w-6 text-cyan-100" /></div>
                  <div className="cube__face cube__face--right" />
                  <div className="cube__face cube__face--left" />
                  <div className="cube__face cube__face--top" />
                  <div className="cube__face cube__face--bottom" />
                </div>
              </div>
            </div>

            <h4 className="text-base font-bold text-white fade-up delay-1">
              Ask your HR Assistant anything
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed fade-up delay-2">
              Ask about leave allocations, attendance rules, health benefits, remote work
              guidelines, or company procedures.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-3xl fade-up ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                style={{ animationDelay: `${Math.min(idx, 6) * 0.04}s` }}
              >
                {/* Avatar */}
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                    isUser
                      ? 'bg-[#059669] text-white shadow-emerald-950/80'
                      : 'bg-[#4f46e5] text-white shadow-indigo-950/80'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#059669] text-white rounded-tr-none shadow-lg shadow-emerald-950/70'
                        : 'bg-[#151a30] border border-white/10 text-slate-200 rounded-tl-none shadow-lg shadow-black/50'
                    }`}
                  >
                    {/* User Role Tag if User Message */}
                    {isUser && msg.userRole && (
                      <div className="text-[10px] text-emerald-50 font-semibold mb-1 opacity-90 uppercase tracking-wider">
                        Asked as {msg.userRole === 'hr_admin' ? 'HR Admin' : 'Employee'}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Ungrounded Fallback Warning */}
                    {msg.isUngrounded && (
                      <div className="mt-3 p-2.5 bg-[#78350f] border border-[#f59e0b]/50 text-amber-50 rounded-xl text-[11px] flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-200 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Policy Information Not Found</strong>
                          No relevant document chunks met the minimum similarity threshold. The
                          assistant refrained from hallucinating.
                        </div>
                      </div>
                    )}

                    {/* LLM Fallback Notice — primary model unavailable */}
                    {!isUser && msg.fallbackNote && (
                      <div className="mt-3 p-2.5 bg-[#1e1b4b] border border-[#6366f1] text-indigo-50 rounded-xl text-[11px] flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-indigo-300 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Reduced AI Mode</strong>
                          {msg.fallbackNote}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sources Cards Section */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 px-1">
                        <FileText className="h-3.5 w-3.5 text-cyan-300" />
                        Grounded Source Documents ({msg.sources.length}):
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.sources.map((source, sIdx) => (
                          <SourceCard key={sIdx} source={source} index={sIdx} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`text-[10px] text-slate-500 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator — liquid dots */}
        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto fade-up">
            <div className="h-9 w-9 rounded-xl bg-[#312e81] border border-[#6366f1]/50 flex items-center justify-center text-indigo-100 shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-[#151a30] border border-white/10 p-4 rounded-2xl rounded-tl-none text-xs text-slate-300 flex items-center gap-3 shadow-lg shadow-black/50">
              <span className="flex items-end gap-1 h-4">
                <span className="liquid-dot" />
                <span className="liquid-dot" />
                <span className="liquid-dot" />
              </span>
              <span>Scanning vector database &amp; retrieving role-filtered policy chunks...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-4 bg-[#151a30] border-t border-white/10">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#090c1a] border border-white/10 focus-within:border-[#6366f1] focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.25)] transition-all duration-300">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask a policy question as ${activeRole === 'hr_admin' ? 'HR Admin' : 'Employee'} (e.g., "How many sick leaves do I get?")...`}
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 px-3 py-2 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-liquid px-4 py-2 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            Ask
          </button>
        </div>
      </form>

    </div>
  );
};
