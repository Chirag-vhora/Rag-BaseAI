import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { processRAGQuery } from '../services/ragEngine';
import { ChatMessage, ChatSession, UserRole } from '../types';

const router = Router();

// In-memory conversation history store keyed by sessionId
const sessions: Map<string, ChatSession> = new Map();

/**
 * Get or create session helper
 */
function getOrCreateSession(sessionId?: string): ChatSession {
  const id = sessionId || 'default_session';
  if (!sessions.has(id)) {
    sessions.set(id, {
      sessionId: id,
      messages: [
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Hello! I am your AI HR Assistant. You can ask me questions about company policies, leave rules, attendance, health benefits, and HR procedures.',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return sessions.get(id)!;
}

/**
 * POST /api/chat - Query RAG Assistant
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { question, userRole = 'employee', sessionId } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question parameter is required' });
    }

    const session = getOrCreateSession(sessionId);

    // Record user message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toISOString(),
      userRole: userRole as UserRole
    };
    session.messages.push(userMsg);

    // Process through RAG Pipeline
    const ragResult = await processRAGQuery({
      query: question.trim(),
      userRole: userRole as UserRole,
      history: session.messages.slice(-6)
    });

    // Record assistant message
    const assistantMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: ragResult.answer,
      timestamp: new Date().toISOString(),
      sources: ragResult.sources,
      isUngrounded: ragResult.isUngrounded
    };
    session.messages.push(assistantMsg);
    session.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: assistantMsg,
      sessionId: session.sessionId,
      history: session.messages
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to process question: ${(error as Error).message}`
    });
  }
});

/**
 * GET /api/chat/history - Retrieve session chat history
 */
router.get('/history', (req: Request, res: Response) => {
  try {
    const sessionId = (req.query.sessionId as string) || 'default_session';
    const session = getOrCreateSession(sessionId);
    res.json({
      success: true,
      sessionId: session.sessionId,
      messages: session.messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

/**
 * DELETE /api/chat/history - Clear chat history
 */
router.delete('/history', (req: Request, res: Response) => {
  try {
    const sessionId = (req.query.sessionId as string) || 'default_session';
    sessions.delete(sessionId);
    const newSession = getOrCreateSession(sessionId);
    res.json({
      success: true,
      message: 'Chat history reset successfully',
      messages: newSession.messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
