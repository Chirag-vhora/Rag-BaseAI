import { VectorChunk, SearchResult, UserRole, DocumentMetadata } from '../types';

class VectorStore {
  private chunks: VectorChunk[] = [];
  private documents: Map<string, DocumentMetadata> = new Map();

  /**
   * Helper to tokenize text for vector indexing and search
   */
  private tokenize(text: string): string[] {
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'what', 'how', 'who', 'which', 'where', 'when',
      'that', 'this', 'with', 'from', 'have', 'has', 'had', 'they', 'you', 'your',
      'our', 'their', 'can', 'will', 'is', 'was', 'were', 'been', 'being', 'get',
      'got', 'getting', 'about', 'into', 'through', 'after', 'before', 'above',
      'below', 'under', 'further', 'then', 'once', 'here', 'there', 'all', 'any'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Generates a Term-Frequency vector map for a given string
   */
  private getTermFreq(text: string): Map<string, number> {
    const tokens = this.tokenize(text);
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }
    return tf;
  }

  /**
   * Add chunks to vector store
   */
  public addChunks(newChunks: VectorChunk[]): void {
    this.chunks.push(...newChunks);
  }

  /**
   * Register or update document metadata
   */
  public saveDocumentMetadata(doc: DocumentMetadata): void {
    this.documents.set(doc.id, doc);
  }

  /**
   * Retrieve all document metadata list
   */
  public getAllDocuments(): DocumentMetadata[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  /**
   * Get single document metadata
   */
  public getDocumentById(id: string): DocumentMetadata | undefined {
    return this.documents.get(id);
  }

  /**
   * Delete document and remove all associated chunks
   */
  public deleteDocument(documentId: string): boolean {
    const initialCount = this.chunks.length;
    this.chunks = this.chunks.filter((chunk) => chunk.documentId !== documentId);
    const deletedCount = initialCount - this.chunks.length;
    this.documents.delete(documentId);
    return deletedCount > 0;
  }

  /**
   * Execute Role-Based Similarity Search over indexed vector chunks
   */
  public similaritySearch(query: string, userRole: UserRole, topK = 4): SearchResult[] {
    if (this.chunks.length === 0 || !query.trim()) {
      return [];
    }

    const queryTokens = this.tokenize(query);
    const queryTf = this.getTermFreq(query);

    if (queryTokens.length === 0) {
      return [];
    }

    // Role-based filtering:
    // If user is 'employee', exclude chunks restricted to 'hr_admin'
    const eligibleChunks = this.chunks.filter((chunk) => {
      if (userRole === 'employee' && chunk.roleAccess === 'hr_admin') {
        return false;
      }
      return true;
    });

    const results: SearchResult[] = [];

    for (const chunk of eligibleChunks) {
      const lowerContent = chunk.content.toLowerCase();
      const chunkTf = this.getTermFreq(chunk.content);
      
      let dotProduct = 0;
      let queryNorm = 0;
      let chunkNorm = 0;

      for (const [term, freq] of queryTf.entries()) {
        queryNorm += freq * freq;
        if (chunkTf.has(term)) {
          // Weight rarer keywords slightly higher
          const chunkTermFreq = chunkTf.get(term)!;
          dotProduct += freq * chunkTermFreq;
        }
      }

      for (const freq of chunkTf.values()) {
        chunkNorm += freq * freq;
      }

      queryNorm = Math.sqrt(queryNorm);
      chunkNorm = Math.sqrt(chunkNorm);

      let score = 0;
      if (queryNorm > 0 && chunkNorm > 0) {
        score = dotProduct / (queryNorm * chunkNorm);
      }

      // Keyword density boost: count how many query tokens appear in chunk OR document name
      const chunkTokensList = this.tokenize(chunk.content);
      const docNameTokensList = this.tokenize(chunk.documentName);
      const combinedTokenSet = new Set([...chunkTokensList, ...docNameTokensList]);
      
      let matchedTokensCount = 0;

      for (const token of queryTokens) {
        if (combinedTokenSet.has(token)) {
          matchedTokensCount++;
        }
      }

      // If zero query tokens match this chunk or doc name, relevance is zero
      if (matchedTokensCount === 0) {
        score = 0;
      } else {
        // Use normalized coverage based on top relevant terms (up to 3 key tokens)
        const effectiveQueryLen = Math.min(queryTokens.length, 3);
        const tokenCoverage = Math.min(1.0, matchedTokensCount / effectiveQueryLen);
        
        score = score * 0.35 + tokenCoverage * 0.65;

        // Direct phrase boost or filename match boost
        const lowerQuery = query.toLowerCase();
        if (lowerContent.includes(lowerQuery) || chunk.documentName.toLowerCase().includes(lowerQuery)) {
          score += 0.35;
        }
      }

      if (score > 0.05) {
        results.push({
          chunk,
          score: Math.round(score * 100) / 100
        });
      }
    }

    // Sort by relevance score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  /**
   * Get store stats
   */
  public getStats() {
    return {
      totalDocuments: this.documents.size,
      totalChunks: this.chunks.length
    };
  }
}

export const vectorStore = new VectorStore();
