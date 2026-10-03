import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserRole } from '../types';
import { SourceCard } from './SourceCard';
import { Bot, User, Send, Loader2, AlertTriangle, Shield, Sparkles, FileText } from 'lucide-react';

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
    <div className="flex flex-col h-[78vh] glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      
      {/* Chat Sub-Header */}
      <div className="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              Enterprise Policy Assistant
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400">
              Answers grounded strictly in indexed company policy documents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeRole === 'hr_admin' ? (
            <span className="px-2.5 py-1 text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full font-semibold flex items-center gap-1">
              <Shield className="h-3 w-3" /> HR Admin Access Enabled
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full font-semibold flex items-center gap-1">
              <User className="h-3 w-3" /> Standard Employee View
            </span>
          )}
        </div>
      </div>

      {/* Message History View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto py-12">
            <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 glow-blue">
              <Sparkles className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-white">Ask your HR Assistant anything!</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask about leave allocations, attendance rules, health benefits, remote work guidelines, or company procedures.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    isUser
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-900/20'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                    }`}
                  >
                    {/* User Role Tag if User Message */}
                    {isUser && msg.userRole && (
                      <div className="text-[10px] text-emerald-200 font-semibold mb-1 opacity-80 uppercase tracking-wider">
                        Asked as {msg.userRole === 'hr_admin' ? 'HR Admin' : 'Employee'}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Ungrounded Fallback Warning */}
                    {msg.isUngrounded && (
                      <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-[11px] flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Policy Information Not Found</strong>
                          No relevant document chunks met the minimum similarity threshold. The assistant refrained from hallucinating.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sources Cards Section */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 px-1">
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
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

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-3">
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              <span>Scanning vector database & retrieving role-filtered policy chunks...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-900/95 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 focus-within:border-blue-500/50 transition-all">
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 shrink-0"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Ask
          </button>
        </div>
      </form>

    </div>
  );
};
