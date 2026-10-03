import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromBuffer } from '../services/documentParser';
import { chunkText } from '../services/chunker';
import { vectorStore } from '../services/vectorStore';
import { seedSampleDocuments } from '../services/sampleDocs';
import { DocumentMetadata, UserRole } from '../types';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
      stats
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

    // Extract text asynchronously
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

    // Update vector store
    vectorStore.addChunks(chunks);

    // Update metadata to ready
    docMeta.status = 'indexed';
    docMeta.chunkCount = chunks.length;
    vectorStore.saveDocumentMetadata(docMeta);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded and indexed ${originalname}`,
      document: docMeta
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
router.post('/seed', (req: Request, res: Response) => {
  try {
    const seeded = seedSampleDocuments();
    const docs = vectorStore.getAllDocuments();
    const stats = vectorStore.getStats();

    res.json({
      success: true,
      message: `Seeded ${seeded.length} sample policy documents`,
      seededCount: seeded.length,
      documents: docs,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

/**
 * DELETE /api/documents/:id - Delete document and purge vectors
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = vectorStore.deleteDocument(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Document not found' });
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
