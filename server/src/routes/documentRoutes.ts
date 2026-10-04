import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromBuffer } from '../services/documentParser';
import { chunkText } from '../services/chunker';
import { vectorStore } from '../services/vectorStore';
import { pineconeStore } from '../services/pineconeStore';
import { getBatchGeminiEmbeddings } from '../services/geminiEmbeddings';
import { seedSampleDocuments } from '../services/sampleDocs';
import { DocumentMetadata, UserRole } from '../types';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Helper — upsert chunks to Pinecone if configured.
 * `ownerDocs` carries the document file metadata so it round-trips back into
 * the store if the local process state is ever lost.
 */
async function tryUpsertToPinecone(
  chunks: any[],
  ownerDocs: DocumentMetadata[] = []
): Promise<void> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!pineconeStore.isConfigured() || !geminiKey) {
    return; // Silently skip — Pinecone not configured
  }

  if (chunks.length === 0) return;

  const texts = chunks.map((c) => c.content);
  const embeddings = await getBatchGeminiEmbeddings(texts, geminiKey);
  await pineconeStore.upsertChunks(chunks, embeddings, ownerDocs);
  console.log(`🌲 Upserted ${chunks.length} chunks to Pinecone`);
}

/**
 * GET /api/documents - List all uploaded documents
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const docs = vectorStore.getAllDocuments();
    const stats = vectorStore.getStats();
    res.json({
      success: true,
      documents: docs,
      stats,
      vectorEngine: pineconeStore.isConfigured() ? 'pinecone' : 'local-tfidf'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

/**
 * POST /api/documents/upload - Upload and index document
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer, size } = req.file;
    const targetRole: UserRole | 'all' = (req.body.targetRole as UserRole) || 'all';
    const category = req.body.category || 'general';

    const docId = uuidv4();

    // Create initial processing status metadata
    const docMeta: DocumentMetadata = {
      id: docId,
      name: originalname,
      mimeType: mimetype,
      size,
      uploadDate: new Date().toISOString(),
      chunkCount: 0,
      status: 'processing',
      targetRole,
      category
    };

    vectorStore.saveDocumentMetadata(docMeta);

    // Extract text
    const text = await extractTextFromBuffer(buffer, mimetype, originalname);

    if (!text || text.trim().length === 0) {
      docMeta.status = 'error';
      docMeta.errorMessage = 'File contained no extractable text';
      vectorStore.saveDocumentMetadata(docMeta);
      return res.status(400).json({ success: false, message: 'File contains no text' });
    }

    // Chunk text
    const chunks = chunkText(docId, originalname, text, {
      roleAccess: targetRole,
      category
    });

    // Always store in local store (serves as fallback + metadata registry)
    vectorStore.addChunks(chunks);

    // If Pinecone is configured, generate Gemini embeddings and upsert
    try {
      await tryUpsertToPinecone(chunks, [docMeta]);
    } catch (embeddingErr) {
      console.warn('Pinecone upsert failed (will serve from local TF-IDF store):', embeddingErr);
    }

    // Update metadata to ready
    docMeta.status = 'indexed';
    docMeta.chunkCount = chunks.length;
    vectorStore.saveDocumentMetadata(docMeta);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded and indexed ${originalname}`,
      document: docMeta,
      vectorEngine: pineconeStore.isConfigured() ? 'pinecone' : 'local-tfidf'
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to process document: ${(error as Error).message}`
    });
  }
});

/**
 * POST /api/documents/seed - Seed sample company policy suite
 */
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const { seeded, chunks } = await seedSampleDocuments();
    const docs = vectorStore.getAllDocuments();
    const stats = vectorStore.getStats();

    // Upsert seeded chunks to Pinecone if configured
    if (chunks.length > 0) {
      try {
        await tryUpsertToPinecone(chunks, seeded);
      } catch (err) {
        console.warn('Pinecone upsert for seed docs failed:', err);
      }
    }

    res.json({
      success: true,
      message: `Seeded ${seeded.length} sample policy documents`,
      seededCount: seeded.length,
      documents: docs,
      stats,
      vectorEngine: pineconeStore.isConfigured() ? 'pinecone' : 'local-tfidf'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

/**
 * DELETE /api/documents/:id - Delete document and purge vectors
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id); // Express 5 typings allow string[]
    const deleted = vectorStore.deleteDocument(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Also purge from Pinecone if configured
    if (pineconeStore.isConfigured()) {
      try {
        await pineconeStore.deleteDocument(id);
        console.log(`🌲 Deleted document ${id} from Pinecone`);
      } catch (err) {
        console.warn('Pinecone deletion failed:', err);
      }
    }

    res.json({
      success: true,
      message: 'Document and vectors deleted successfully',
      stats: vectorStore.getStats()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
