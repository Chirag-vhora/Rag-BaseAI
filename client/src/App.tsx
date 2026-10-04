import React, { useState, useEffect } from 'react';
import { UserRole, DocumentMetadata, ChatMessage, VectorStats } from './types';
import { fetchDocuments, sendQuestion, fetchChatHistory, resetChatHistory } from './api';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { DocumentManager } from './components/DocumentManager';
import { HistorySidebar } from './components/HistorySidebar';
import { AmbientBackground } from './components/AmbientBackground';

export const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>('employee');
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [stats, setStats] = useState<VectorStats>({ totalDocuments: 0, totalChunks: 0 });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load documents and chat history on initial mount
  const loadDocuments = async () => {
    try {
      const data = await fetchDocuments();
      setDocuments(data.documents);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await fetchChatHistory();
      setMessages(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadHistory();
  }, []);

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    try {
      const result = await sendQuestion(text, activeRole);
      setMessages(result.history);
      // Refresh documents/stats in case any auto-index occurred
      loadDocuments();
    } catch (err) {
      console.error('Failed to query assistant:', err);
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear the conversation history?')) return;
    try {
      const updated = await resetChatHistory();
      setMessages(updated);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    setActiveTab('chat');
    handleSendMessage(promptText);
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans overflow-x-hidden">

      {/* Liquid aurora backdrop (presentational only) */}
      <AmbientBackground />

      {/* Top Navbar Header */}
      <Header
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalDocs={stats.totalDocuments}
        totalChunks={stats.totalChunks}
      />

      {/* Main Workspace Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">

        {activeTab === 'chat' ? (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 w-full min-w-0 fade-up">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                activeRole={activeRole}
              />
            </div>

            <div className="w-full lg:w-80 shrink-0 fade-up delay-2">
              <HistorySidebar
                activeRole={activeRole}
                onSelectPrompt={handleSelectPrompt}
                onClearHistory={handleClearHistory}
                messageCount={messages.length}
              />
            </div>
          </div>
        ) : (
          <div className="fade-up">
            <DocumentManager
              documents={documents}
              onRefresh={loadDocuments}
              activeRole={activeRole}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative py-5 mt-4 border-t border-white/10 text-center text-xs">
        <p className="text-slate-400">
          <span className="text-aurora font-semibold">NexusHR Assistant</span>
          <span className="mx-2 text-slate-600">•</span>
          AI HR Assistant Technical Assessment
          <span className="mx-2 text-slate-600">•</span>
          RAG Pipeline + Role-Based Access Control
        </p>
      </footer>

    </div>
  );
};

export default App;
