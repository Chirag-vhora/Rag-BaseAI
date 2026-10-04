import { vectorStore } from './vectorStore';
import { pineconeStore } from './pineconeStore';
import { getGeminiEmbedding } from './geminiEmbeddings';
import { UserRole, ChatMessage, SourceReference, SearchResult } from '../types';

export interface RAGQueryOptions {
  query: string;
  userRole: UserRole;
  history?: ChatMessage[];
}

export interface RAGQueryResponse {
  answer: string;
  sources: SourceReference[];
  isUngrounded: boolean;
  /** Present when the primary LLM could not answer — tells the UI which fallback was used. */
  fallbackNote?: string;
}

/**
 * Main RAG Execution Engine
 */
export async function processRAGQuery(options: RAGQueryOptions): Promise<RAGQueryResponse> {
  const { query, userRole } = options;
  const geminiKey = process.env.GEMINI_API_KEY;

  let searchResults: SearchResult[] = [];

  // 1. Check if Pinecone + Gemini Embeddings are configured
  if (pineconeStore.isConfigured() && geminiKey) {
    try {
      console.log('🌲 Using Pinecone Real Vector Database + Gemini Embeddings...');
      const queryEmbedding = await getGeminiEmbedding(query, geminiKey);
      searchResults = await pineconeStore.query(queryEmbedding, userRole, 4);
    } catch (err) {
      console.warn('Pinecone vector search failed, falling back to local TF-IDF store:', err);
      searchResults = vectorStore.similaritySearch(query, userRole, 4);
    }
  } else {
    // Fallback to local store
    searchResults = vectorStore.similaritySearch(query, userRole, 4);
  }

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

  // 4. Check API Keys in environment (Mistral, OpenAI — Gemini key already declared above)
  const mistralKey = process.env.MISTRAL_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // Providers that were attempted and failed — surfaced to the UI as a fallback note
  const failedLlm: string[] = [];
  const buildNote = (used?: string): string =>
    `${failedLlm.length > 0 ? failedLlm.join(', ') : 'No LLM configured'}${
      used ? ` — answered by ${used}` : ' — answer assembled from retrieved policy chunks only'
    }`;

  const contextTexts = searchResults.map((s) => s.chunk.content);

  // A. Google Gemini Integration (gemini-3.5-flash-lite)
  if (geminiKey) {
    try {
      const geminiAnswer = await generateGeminiResponse(query, contextTexts, geminiKey);
      if (geminiAnswer) {
        return { answer: geminiAnswer, sources, isUngrounded: false };
      }
      failedLlm.push('Gemini returned no answer');
    } catch (err) {
      console.warn('Gemini API call failed, trying next provider:', err);
      failedLlm.push('Gemini unreachable');
    }
  }

  // B. Mistral AI Integration (ministral-14b-latest — free-tier accessible, 30 req/min)
  if (mistralKey) {
    try {
      const mistralAnswer = await generateMistralResponse(query, contextTexts, mistralKey);
      if (mistralAnswer) {
        return { answer: mistralAnswer, sources, isUngrounded: false, fallbackNote: buildNote('Mistral') };
      }
      failedLlm.push('Mistral returned no answer');
    } catch (err) {
      console.warn('Mistral API call failed, trying next provider:', err);
      failedLlm.push('Mistral unreachable');
    }
  }

  // C. OpenAI Integration (gpt-4o-mini)
  if (openAiKey) {
    try {
      const llmAnswer = await generateOpenAIResponse(query, contextTexts, openAiKey);
      if (llmAnswer) {
        return { answer: llmAnswer, sources, isUngrounded: false, fallbackNote: buildNote('OpenAI') };
      }
      failedLlm.push('OpenAI returned no answer');
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to local grounded synthesis engine:', err);
      failedLlm.push('OpenAI unreachable');
    }
  }

  // 5. Intelligent Grounded Context Synthesizer (Fallback zero-config engine)
  const syntheticAnswer = synthesizeGroundedAnswer(query, searchResults);

  return {
    answer: syntheticAnswer,
    sources,
    isUngrounded: false,
    fallbackNote: buildNote()
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
 * Google Gemini API Caller (gemini-3.5-flash-lite)
 */
async function generateGeminiResponse(query: string, contextChunks: string[], apiKey: string): Promise<string | null> {
  const promptText = `You are an AI HR Assistant for an enterprise company. Answer employee questions using ONLY the provided document context below. If the answer cannot be found in the context, explicitly say "I could not find information regarding this in the company documents." Do NOT hallucinate.

DOCUMENT CONTEXT:
${contextChunks.join('\n\n---\n\n')}

QUESTION:
${query}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
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
 * Mistral AI API Caller (ministral-14b-latest)
 * NOTE: mistral-small-2603 (Small 4) is a paid model — the Free plan returns
 * x-ratelimit-limit-req-minute: 0 for it (429 code 1300). Ministral 14B is
 * free-tier accessible and strong enough for grounded HR answers.
 */
async function generateMistralResponse(query: string, contextChunks: string[], apiKey: string): Promise<string | null> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'ministral-14b-latest',
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
