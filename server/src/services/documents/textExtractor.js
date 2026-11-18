import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts raw text from PDF, DOCX, or TXT buffer/path.
 */
export async function extractTextFromFile(filePath, fileType) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const normalizedType = (fileType || '').toLowerCase();

    if (normalizedType.includes('pdf')) {
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text || '';
    } else if (normalizedType.includes('docx') || normalizedType.includes('word')) {
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      return docxResult.value || '';
    } else {
      // Plain text or fallback
      return fileBuffer.toString('utf-8');
    }
  } catch (error) {
    console.error('Error extracting text from file:', error.message);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}
