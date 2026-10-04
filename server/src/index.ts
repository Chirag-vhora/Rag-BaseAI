import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import documentRoutes from './routes/documentRoutes';
import chatRoutes from './routes/chatRoutes';
import { seedSampleDocuments } from './services/sampleDocs';
import { vectorStore } from './services/vectorStore';

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

app.listen(PORT, () => {
  console.log(`🚀 AI HR Assistant Server running on http://localhost:${PORT}`);
  console.log(`📚 Vector store ready with ${vectorStore.getStats().totalDocuments} documents & ${vectorStore.getStats().totalChunks} chunks.`);
});
