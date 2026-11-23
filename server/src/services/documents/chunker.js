// server/src/services/documents/chunker.js
/**
 * Sentence-aware high-resolution chunker.
 * Slices documents into precise ~200-character semantic chunks for production retrieval.
 */
export function chunkText(rawText, maxChunkSize = 220, overlap = 45) {
  if (!rawText || typeof rawText !== 'string') return [];

  const cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const paragraphs = cleanedText.split(/\n\n+/);
  const chunks = [];
  let currentSection = 'General Overview';
  let pageCounter = 1;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // Detect section headers
    if (/^(section|article|chapter|\d+\.|\b[A-Z\s]{4,}\b)/i.test(trimmedPara) && trimmedPara.length < 80) {
      currentSection = trimmedPara;
    }

    // Split paragraph by sentences
    const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [trimmedPara];
    let currentChunk = '';

    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (!cleanSentence) continue;

      if ((currentChunk + ' ' + cleanSentence).length <= maxChunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + cleanSentence;
      } else {
        if (currentChunk.trim().length > 30) {
          chunks.push({
            content: currentChunk.trim(),
            section: currentSection,
            pageNumber: Math.max(1, Math.floor(chunks.length / 4) + 1)
          });
        }
        // Retain overlap from end of previous chunk
        const words = currentChunk.split(' ');
        const overlapSlice = words.slice(-Math.min(words.length, 5)).join(' ');
        currentChunk = overlapSlice + ' ' + cleanSentence;
      }
    }

    if (currentChunk.trim().length > 30) {
      chunks.push({
        content: currentChunk.trim(),
        section: currentSection,
        pageNumber: Math.max(1, Math.floor(chunks.length / 4) + 1)
      });
    }
  }

  return chunks;
}