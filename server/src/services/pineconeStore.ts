import { Pinecone } from '@pinecone-database/pinecone';
import { VectorChunk, SearchResult, UserRole, DocumentMetadata } from '../types';

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
   * Upsert chunks and 768-dim Gemini embeddings to Pinecone.
   *
   * `ownerDocs` (optional) lets us persist each document's file metadata so a
   * cold start (e.g. Render free tier, whose disk is wiped on every restart)
   * can rebuild the full document list straight from Pinecone.
   */
  public async upsertChunks(
    chunks: VectorChunk[],
    embeddings: number[][],
    ownerDocs: DocumentMetadata[] = []
  ): Promise<void> {
    if (chunks.length === 0 || embeddings.length === 0) return;

    const index = this.getIndex();
    const docById = new Map(ownerDocs.map((d) => [d.id, d]));

    const vectors = chunks.map((chunk, i) => {
      const doc = docById.get(chunk.documentId);
      return {
        id: chunk.id,
        values: embeddings[i],
        metadata: {
          documentId: chunk.documentId,
          documentName: chunk.documentName,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          roleAccess: chunk.roleAccess,
          category: chunk.category,
          // file metadata (absent for vectors written by older builds)
          uploadDate: doc?.uploadDate || '',
          mimeType: doc?.mimeType || '',
          size: doc?.size || 0
        }
      };
    });

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

  /**
   * Read the ENTIRE index back (ids via listPaginated, payloads via fetch).
   *
   * This is what makes Pinecone the source of truth: after a restart wiped the
   * in-memory/disk store, the document list and TF-IDF fallback chunks are
   * rebuilt from here instead of silently disappearing.
   */
  public async fetchAll(): Promise<{ chunks: VectorChunk[]; documents: DocumentMetadata[] }> {
    const index = this.getIndex();

    // 1) Page through every record id in the (default) namespace.
    //    NOTE: Pinecone caps `limit` at 100 per page — larger values 400.
    const ids: string[] = [];
    let paginationToken: string | undefined;
    do {
      const page = await index.listPaginated(
        paginationToken ? { limit: 100, paginationToken } : { limit: 100 }
      );
      for (const vector of page.vectors || []) {
        ids.push(String(vector.id));
      }
      paginationToken = page.pagination?.next || undefined;
    } while (paginationToken);

    // 2) Fetch payloads in batches of 100 (single pass: chunks + file metadata)
    const chunks: VectorChunk[] = [];
    const rawMetaById = new Map<string, Record<string, any>>();
    const BATCH = 100;
    for (let i = 0; i < ids.length; i += BATCH) {
      const response = await index.fetch({ ids: ids.slice(i, i + BATCH) });
      const records = response.records || {};
      for (const record of Object.values(records)) {
        const meta = (record.metadata || {}) as Record<string, any>;
        if (!meta.documentId) continue;
        chunks.push({
          id: String(record.id),
          documentId: String(meta.documentId),
          documentName: meta.documentName || 'Unknown Document',
          content: meta.content || '',
          chunkIndex: Number(meta.chunkIndex) || 1,
          totalChunks: Number(meta.totalChunks) || 1,
          roleAccess: (meta.roleAccess as VectorChunk['roleAccess']) || 'all',
          category: meta.category || 'general'
        });
        if (!rawMetaById.has(String(meta.documentId))) {
          rawMetaById.set(String(meta.documentId), meta);
        }
      }
    }

    // 3) Rebuild one DocumentMetadata per documentId from its chunk payloads
    const grouped = new Map<string, VectorChunk[]>();
    for (const chunk of chunks) {
      const list = grouped.get(chunk.documentId);
      if (list) list.push(chunk);
      else grouped.set(chunk.documentId, [chunk]);
    }

    const allowedCategories: DocumentMetadata['category'][] = [
      'leave', 'attendance', 'benefits', 'compensation', 'handbook', 'general'
    ];
    const documents: DocumentMetadata[] = [];
    for (const [documentId, docChunks] of grouped) {
      const raw = rawMetaById.get(documentId) || {};
      const name: string = docChunks[0]?.documentName || raw.documentName || 'Unknown Document';
      const category = allowedCategories.includes(raw.category)
        ? (raw.category as DocumentMetadata['category'])
        : 'general';
      documents.push({
        id: documentId,
        name,
        mimeType: raw.mimeType || guessMimeType(name),
        size: Number(raw.size) || docChunks.reduce((sum, c) => sum + c.content.length, 0),
        // older vectors carry no uploadDate — fall back to restore time
        uploadDate: raw.uploadDate || new Date().toISOString(),
        chunkCount: docChunks.length,
        status: 'indexed',
        targetRole: (raw.roleAccess as DocumentMetadata['targetRole']) || 'all',
        category
      });
    }

    return { chunks, documents };
  }
}

/**
 * Best-effort mime type for vectors written before we started storing it
 */
function guessMimeType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.md')) return 'text/markdown';
  return 'application/octet-stream';
}

export const pineconeStore = new PineconeVectorService();
