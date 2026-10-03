import { DocumentMetadata, ChatMessage, VectorStats, UserRole } from './types';

const API_BASE = '/api';

export async function fetchDocuments(): Promise<{ documents: DocumentMetadata[]; stats: VectorStats }> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch document list');
  const data = await res.json();
  return { documents: data.documents, stats: data.stats };
}

export async function uploadDocument(
  file: File,
  targetRole: UserRole | 'all' = 'all',
  category: string = 'general'
): Promise<DocumentMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetRole', targetRole);
  formData.append('category', category);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to upload document');
  }
  return data.document;
}

export async function seedSamplePolicies(): Promise<{ documents: DocumentMetadata[]; stats: VectorStats; seededCount: number }> {
  const res = await fetch(`${API_BASE}/documents/seed`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to seed sample documents');
  return { documents: data.documents, stats: data.stats, seededCount: data.seededCount };
}

export async function deleteDocument(id: string): Promise<VectorStats> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete document');
  return data.stats;
}

export async function sendQuestion(
  question: string,
  userRole: UserRole,
  sessionId: string = 'default_session'
): Promise<{ message: ChatMessage; history: ChatMessage[] }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, userRole, sessionId })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to get answer from AI Assistant');
  }
  return { message: data.message, history: data.history };
}

export async function fetchChatHistory(sessionId: string = 'default_session'): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/chat/history?sessionId=${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch chat history');
  const data = await res.json();
  return data.messages;
}

export async function resetChatHistory(sessionId: string = 'default_session'): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/chat/history?sessionId=${sessionId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to reset chat history');
  const data = await res.json();
  return data.messages;
}
