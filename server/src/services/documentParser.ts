import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase();

  try {
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      // pdf.js 1.10 (pdf-parse) mis-reads Node's *pooled* Buffers for files < 8 KB
      // (it uses the underlying ArrayBuffer and ignores byteOffset → "bad XRef entry").
      // Copying into a plain Uint8Array gives it a fresh, offset-0 ArrayBuffer.
      // (pdf-parse's typings ask for Buffer; runtime accepts any typed array.)
      const data = await pdfParse(new Uint8Array(buffer) as unknown as Buffer);
      return data.text;
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // Default to plain text
    return buffer.toString('utf-8');
  } catch (error) {
    console.error(`Error parsing file ${fileName}:`, error);
    throw new Error(`Failed to extract text from document (${fileName}): ${(error as Error).message}`);
  }
}
