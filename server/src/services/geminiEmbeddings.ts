/**
 * Gemini Embeddings Service using Google AI `gemini-embedding-2` (768 dimensions)
 * NOTE: text-embedding-004 was shut down on 14 Jan 2026 — gemini-embedding-2 is
 * the official replacement. outputDimensionality: 768 matches the Pinecone index.
 */

export async function getGeminiEmbedding(text: string, apiKey: string): Promise<number[]> {
  if (!text || !text.trim()) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-2',
        outputDimensionality: 768,
        content: {
          parts: [{ text: text.trim() }]
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Embedding API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const values = data.embedding?.values;

  if (!values || !Array.isArray(values)) {
    throw new Error('Invalid embedding response format from Gemini API');
  }

  return values;
}

export async function getBatchGeminiEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const embeddings: number[][] = [];

  // Embed texts in parallel batches of 5 to respect API rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map((t) => getGeminiEmbedding(t, apiKey));
    const batchResults = await Promise.all(batchPromises);
    embeddings.push(...batchResults);
  }

  return embeddings;
}
