import React, { useState, useEffect } from 'react';
import { UserRole, DocumentMetadata, ChatMessage, VectorStats } from './types';
import { fetchDocuments, sendQuestion, fetchChatHistory, resetChatHistory } from './api';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { DocumentManager } from './components/DocumentManager';
import { HistorySidebar } from './components/HistorySidebar';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
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
            <div className="flex-1 w-full min-w-0">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                activeRole={activeRole}
              />
            </div>

            <HistorySidebar
              activeRole={activeRole}
              onSelectPrompt={handleSelectPrompt}
              onClearHistory={handleClearHistory}
              messageCount={messages.length}
            />
          </div>
        ) : (
          <DocumentManager
            documents={documents}
            onRefresh={loadDocuments}
            activeRole={activeRole}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        NexusHR Assistant • AI HR Assistant Technical Assessment • RAG Pipeline + Role-Based Access Control
      </footer>

    </div>
  );
};

export default App;
