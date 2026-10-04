import { Pinecone } from '@pinecone-database/pinecone';
import { VectorChunk, SearchResult, UserRole } from '../types';

class PineconeVectorService {
  private client: Pinecone | null = null;
  private indexName: string = '';

  /**
   * Check if Pinecone is configured in environment
   */
  public isConfigured(): boolean {
    const apiKey = process.env.PINECONE_API_KEY;
    const index = process.env.PINECONE_INDEX;
    return Boolean(apiKey && index);
  }

  /**
   * Initialize Pinecone Client & Target Index
   */
  private getIndex() {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX || 'nexus-hr-index';

    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is missing in environment variables');
    }

    if (!this.client) {
      this.client = new Pinecone({ apiKey });
      this.indexName = indexName;
    }

    return this.client.index(this.indexName);
  }

  /**
   * Upsert chunks and 768-dim Gemini embeddings to Pinecone
   */
  public async upsertChunks(chunks: VectorChunk[], embeddings: number[][]): Promise<void> {
    if (chunks.length === 0 || embeddings.length === 0) return;

    const index = this.getIndex();

    const vectors = chunks.map((chunk, i) => ({
      id: chunk.id,
      values: embeddings[i],
      metadata: {
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
        roleAccess: chunk.roleAccess,
        category: chunk.category
      }
    }));

    // Upsert in batches of 100 (Pinecone SDK v9 expects { records: [...] })
    const BATCH_SIZE = 100;
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE);
      await index.upsert({ records: batch });
    }
  }

  /**
   * Query Pinecone using 768-dim Query Vector and Role Access Metadata filter
   */
  public async query(queryVector: number[], userRole: UserRole, topK = 4): Promise<SearchResult[]> {
    const index = this.getIndex();

    // Role-based metadata filter:
    // If user is 'employee', restrict query to roleAccess != 'hr_admin'
    let filter: any = undefined;
    if (userRole === 'employee') {
      filter = {
        roleAccess: { $ne: 'hr_admin' }
      };
    }

    const queryResponse = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter
    });

    if (!queryResponse.matches) {
      return [];
    }

    return queryResponse.matches.map((match) => {
      const meta = match.metadata as any;
      return {
        chunk: {
          id: match.id,
          documentId: meta.documentId || '',
          documentName: meta.documentName || 'Unknown Document',
          content: meta.content || '',
          chunkIndex: meta.chunkIndex || 1,
          totalChunks: meta.totalChunks || 1,
          roleAccess: meta.roleAccess || 'all',
          category: meta.category || 'general'
        },
        score: Math.round((match.score || 0) * 100) / 100
      };
    });
  }

  /**
   * Delete all vectors belonging to a document ID
   */
  public async deleteDocument(documentId: string): Promise<void> {
    const index = this.getIndex();
    // SDK v9 requires ids OR filter — delete every vector carrying this documentId
    await index.deleteMany({ filter: { documentId: { $eq: documentId } } });
  }
}

export const pineconeStore = new PineconeVectorService();
