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
      const data = await pdfParse(buffer);
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
