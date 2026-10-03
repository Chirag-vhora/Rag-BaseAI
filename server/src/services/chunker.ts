import { v4 as uuidv4 } from 'uuid';
import { VectorChunk, UserRole } from '../types';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  roleAccess?: UserRole | 'all';
  category?: string;
}

/**
 * Splits document text into semantic chunks with overlap and attaches metadata
 */
export function chunkText(
  documentId: string,
  documentName: string,
  text: string,
  options: ChunkingOptions = {}
): VectorChunk[] {
  const chunkSize = options.chunkSize || 500;
  const chunkOverlap = options.chunkOverlap || 100;
  const roleAccess = options.roleAccess || 'all';
  const category = options.category || 'general';

  const cleanedText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (!cleanedText) {
    return [];
  }

  // Split text into paragraphs first to respect document structure
  const paragraphs = cleanedText.split('\n\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if ((currentChunk + '\n\n' + trimmedPara).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // Handle oversized paragraphs by sliding window
      if (trimmedPara.length > chunkSize) {
        let start = 0;
        while (start < trimmedPara.length) {
          const end = Math.min(start + chunkSize, trimmedPara.length);
          chunks.push(trimmedPara.slice(start, end));
          start += chunkSize - chunkOverlap;
        }
        currentChunk = '';
      } else {
        currentChunk = trimmedPara;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  const totalChunks = chunks.length;

  return chunks.map((content, index) => ({
    id: uuidv4(),
    documentId,
    documentName,
    content: content.trim(),
    chunkIndex: index + 1,
    totalChunks,
    roleAccess,
    category
  }));
}
