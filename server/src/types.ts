export type UserRole = 'employee' | 'hr_admin';

export interface DocumentMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  chunkCount: number;
  status: 'processing' | 'indexed' | 'error';
  targetRole: UserRole | 'all';
  category: 'leave' | 'attendance' | 'benefits' | 'handbook' | 'compensation' | 'general';
  errorMessage?: string;
}

export interface VectorChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  roleAccess: 'employee' | 'hr_admin' | 'all';
  category: string;
  embedding?: number[];
}

export interface SearchResult {
  chunk: VectorChunk;
  score: number; // Similarity score between 0 and 1
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: SourceReference[];
  userRole?: UserRole;
  isUngrounded?: boolean;
  /** Set when the primary LLM was unavailable and a fallback answered (surfaced in UI). */
  fallbackNote?: string;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  chunkSnippet: string;
  score: number;
  category: string;
  roleAccess: string;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
