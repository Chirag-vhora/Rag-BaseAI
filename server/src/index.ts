import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import documentRoutes from './routes/documentRoutes';
import chatRoutes from './routes/chatRoutes';
import { seedSampleDocuments } from './services/sampleDocs';
import { vectorStore } from './services/vectorStore';
import { pineconeStore } from './services/pineconeStore';
import { getBatchGeminiEmbeddings } from './services/geminiEmbeddings';
import { DocumentMetadata, VectorChunk } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AI HR Assistant RAG Pipeline',
    timestamp: new Date().toISOString(),
    stats: vectorStore.getStats()
  });
});

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// ---------------------------------------------------------------------------
// Serve the built React client so the whole app lives on ONE URL (production).
// In local dev the UI is served by Vite on :3000, so this only kicks in when
// `client/dist` exists (i.e. after `npm run build`).
// ---------------------------------------------------------------------------
const clientDist = path.resolve(__dirname, '../../client/dist');
const hasBuiltClient = fs.existsSync(path.join(clientDist, 'index.html'));

if (hasBuiltClient) {
  app.use(express.static(clientDist));

  // SPA fallback: every non-API GET request returns the React index.html
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  console.log(`🖥️ Serving client UI from ${clientDist}`);
} else {
  console.log('🖥️ client/dist not found — running in API-only mode (run `npm run build` to serve the UI).');
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Seed initial sample documents for evaluation readiness
try {
  const { seeded } = seedSampleDocuments();
  if (seeded.length > 0) {
    console.log(`✅ Initial company HR policies seeded into RAG vector store successfully.`);
  } else {
    console.log('✅ Company HR policies already seeded (vector store ready).');
  }
} catch (err) {
  console.warn('⚠️ Could not seed sample documents on boot:', err);
}

/**
 * Reconcile the local store with Pinecone before serving traffic.
 *
 *  1. Rehydrate any document that exists in Pinecone but not locally — this is
 *     what keeps uploaded PDFs visible after a restart wiped memory/disk
 *     (Render free tier has an ephemeral filesystem).
 *  2. Index any local document Pinecone is missing or has stale/partial
 *     vectors for, so retrieval never silently falls back to TF-IDF.
 *
 * Failure here is non-fatal: we log it and start the server anyway.
 */
async function syncVectorStores(): Promise<void> {
  if (!pineconeStore.isConfigured()) {
    console.log('🌲 Pinecone not configured — serving from the local store only.');
    return;
  }

  try {
    const remote = await pineconeStore.fetchAll();

    const remoteCount = new Map<string, number>();
    const remoteLength = new Map<string, number>();
    for (const chunk of remote.chunks) {
      remoteCount.set(chunk.documentId, (remoteCount.get(chunk.documentId) || 0) + 1);
      remoteLength.set(
        chunk.documentId,
        (remoteLength.get(chunk.documentId) || 0) + chunk.content.length
      );
    }

    // 1) Pull remote-only documents back into the local store
    const localIds = new Set(vectorStore.getAllDocuments().map((d) => d.id));
    const restoreDocs = remote.documents.filter((d) => !localIds.has(d.id));
    if (restoreDocs.length > 0) {
      vectorStore.restoreDocuments(restoreDocs, remote.chunks);
    }

    // 2) Push local documents Pinecone doesn't know about (or has out of date)
    const toUpsert: VectorChunk[] = [];
    const ownerDocs: DocumentMetadata[] = [];
    for (const doc of vectorStore.getAllDocuments()) {
      const chunks = vectorStore.getChunksByDocument(doc.id);
      if (chunks.length === 0) continue;

      const knownCount = remoteCount.get(doc.id) || 0;
      const localLength = chunks.reduce((sum, c) => sum + c.content.length, 0);
      const inSync = knownCount === chunks.length && (remoteLength.get(doc.id) || 0) === localLength;
      if (inSync) continue;

      if (knownCount > 0) {
        await pineconeStore.deleteDocument(doc.id); // drop stale/partial vectors first
      }
      toUpsert.push(...chunks);
      ownerDocs.push(doc);
    }

    if (toUpsert.length > 0) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) throw new Error('GEMINI_API_KEY is missing — cannot embed missing chunks');
      const embeddings = await getBatchGeminiEmbeddings(toUpsert.map((c) => c.content), geminiKey);
      await pineconeStore.upsertChunks(toUpsert, embeddings, ownerDocs);
      console.log(`🌲 Boot sync: indexed ${toUpsert.length} chunks into Pinecone`);
    }

    console.log(
      `🌲 Pinecone sync OK — ${remote.chunks.length} remote records · ` +
        `${vectorStore.getStats().totalDocuments} documents tracked`
    );
  } catch (err) {
    console.warn('🌲 Pinecone boot sync failed (server continues):', (err as Error).message);
  }
}

async function start(): Promise<void> {
  await syncVectorStores();

  app.listen(PORT, () => {
    console.log(`🚀 AI HR Assistant Server running on http://localhost:${PORT}`);
    console.log(`📚 Vector store ready with ${vectorStore.getStats().totalDocuments} documents & ${vectorStore.getStats().totalChunks} chunks.`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
