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

export interface SourceReference {
  documentId: string;
  documentName: string;
  chunkSnippet: string;
  score: number;
  category: string;
  roleAccess: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: SourceReference[];
  userRole?: UserRole;
  isUngrounded?: boolean;
}

export interface VectorStats {
  totalDocuments: number;
  totalChunks: number;
}
