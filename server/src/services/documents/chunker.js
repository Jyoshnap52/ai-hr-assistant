/**
 * Splits document text into structured chunks with chunk index and section metadata.
 */
export function chunkText(rawText, chunkSize = 500, overlap = 100) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Clean extra whitespace
  const cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Split by paragraphs first for coherent chunking
  const paragraphs = cleanedText.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  let currentSection = 'General Overview';
  let pageCounter = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para) continue;

    // Detect section headers (e.g., "Section 3: Paid Leave", "1. Code of Conduct")
    if (/^(section|article|chapter|\d+\.|\b[A-Z\s]{4,}\b)/i.test(para) && para.length < 80) {
      currentSection = para;
    }

    if ((currentChunk + ' ' + para).length <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          section: currentSection,
          pageNumber: Math.max(1, Math.floor(chunks.length / 3) + 1)
        });
      }
      // Start next chunk with overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.min(words.length, Math.floor(overlap / 6))).join(' ');
      currentChunk = overlapWords + (overlapWords ? '\n\n' : '') + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      section: currentSection,
      pageNumber: Math.max(1, Math.floor(chunks.length / 3) + 1)
    });
  }

  return chunks;
}
