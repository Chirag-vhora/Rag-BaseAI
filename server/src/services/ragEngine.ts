import { vectorStore } from './vectorStore';
import { UserRole, ChatMessage, SourceReference } from '../types';

export interface RAGQueryOptions {
  query: string;
  userRole: UserRole;
  history?: ChatMessage[];
}

export interface RAGQueryResponse {
  answer: string;
  sources: SourceReference[];
  isUngrounded: boolean;
}

/**
 * Main RAG Execution Engine
 */
export async function processRAGQuery(options: RAGQueryOptions): Promise<RAGQueryResponse> {
  const { query, userRole } = options;

  // 1. Vector similarity search filtered by userRole
  const searchResults = vectorStore.similaritySearch(query, userRole, 4);

  // 2. Strict grounding check:
  // If no chunks match or top score is too low, state clearly that info is not available.
  if (searchResults.length === 0 || searchResults[0].score < 0.15) {
    return {
      answer: "I could not find information regarding your request in the available company documents. Please reach out to HR or your manager for further assistance.",
      sources: [],
      isUngrounded: true
    };
  }

  // 3. Format sources
  const sources: SourceReference[] = searchResults.map((res) => ({
    documentId: res.chunk.documentId,
    documentName: res.chunk.documentName,
    chunkSnippet: res.chunk.content,
    score: res.score,
    category: res.chunk.category,
    roleAccess: res.chunk.roleAccess
  }));

  // 4. Check API Keys in environment (Gemini, Mistral, OpenAI)
  const geminiKey = process.env.GEMINI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const contextTexts = searchResults.map((s) => s.chunk.content);

  // A. Google Gemini Integration (gemini-1.5-flash)
  if (geminiKey) {
    try {
      const geminiAnswer = await generateGeminiResponse(query, contextTexts, geminiKey);
      if (geminiAnswer) {
        return { answer: geminiAnswer, sources, isUngrounded: false };
      }
    } catch (err) {
      console.warn('Gemini API call failed, trying next provider:', err);
    }
  }

  // B. Mistral AI Integration (mistral-small-latest)
  if (mistralKey) {
    try {
      const mistralAnswer = await generateMistralResponse(query, contextTexts, mistralKey);
      if (mistralAnswer) {
        return { answer: mistralAnswer, sources, isUngrounded: false };
      }
    } catch (err) {
      console.warn('Mistral API call failed, trying next provider:', err);
    }
  }

  // C. OpenAI Integration (gpt-4o-mini)
  if (openAiKey) {
    try {
      const llmAnswer = await generateOpenAIResponse(query, contextTexts, openAiKey);
      if (llmAnswer) {
        return { answer: llmAnswer, sources, isUngrounded: false };
      }
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to local grounded synthesis engine:', err);
    }
  }

  // 5. Intelligent Grounded Context Synthesizer (Fallback zero-config engine)
  const syntheticAnswer = synthesizeGroundedAnswer(query, searchResults);

  return {
    answer: syntheticAnswer,
    sources,
    isUngrounded: false
  };
}

/**
 * Helper to generate grounded answer from vector search results
 */
function synthesizeGroundedAnswer(query: string, searchResults: Array<{ chunk: any; score: number }>): string {
  const topResult = searchResults[0];

  const formattedPassages = searchResults
    .map((r, i) => `### Reference Excerpt ${i + 1} (${r.chunk.documentName} • ${Math.round(r.score * 100)}% match)\n${r.chunk.content}`)
    .join('\n\n---\n\n');

  return `Based on official company documentation (**${topResult.chunk.documentName}**):

${topResult.chunk.content}

---

**Additional Grounded References:**
${formattedPassages}`;
}

/**
 * Google Gemini API Caller (gemini-1.5-flash)
 */
async function generateGeminiResponse(query: string, contextChunks: string[], apiKey: string): Promise<string | null> {
  const promptText = `You are an AI HR Assistant for an enterprise company. Answer employee questions using ONLY the provided document context below. If the answer cannot be found in the context, explicitly say "I could not find information regarding this in the company documents." Do NOT hallucinate.

DOCUMENT CONTEXT:
${contextChunks.join('\n\n---\n\n')}

QUESTION:
${query}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

/**
 * Mistral AI API Caller (mistral-small-latest)
 */
async function generateMistralResponse(query: string, contextChunks: string[], apiKey: string): Promise<string | null> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'system',
          content: `You are an AI HR Assistant for an enterprise company. Answer employee questions using ONLY the provided document context below. If the answer cannot be found in the context, explicitly say "I could not find information regarding this in the company documents." Do NOT hallucinate.\n\nDOCUMENT CONTEXT:\n${contextChunks.join('\n\n---\n\n')}`
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral API error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

/**
 * OpenAI API Caller
 */
async function generateOpenAIResponse(query: string, contextChunks: string[], apiKey: string): Promise<string | null> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI HR Assistant for an enterprise company. Answer employee questions using ONLY the provided document context below. If the answer cannot be found in the context, explicitly say "I could not find information regarding this in the company documents." Do NOT hallucinate.\n\nDOCUMENT CONTEXT:\n${contextChunks.join('\n\n---\n\n')}`
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}
