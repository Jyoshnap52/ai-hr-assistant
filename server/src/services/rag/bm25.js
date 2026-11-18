/**
 * Enterprise BM25 (Best Matching 25) Sparse Lexical Retrieval Engine
 * Implements Okapi BM25 with IDF weighting and document length normalization.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'what', 'where', 'when', 'who', 'how', 'can', 'do', 'does', 'did', 'i',
  'my', 'we', 'our', 'you', 'your', 'about', 'please', 'tell', 'me'
]);

export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export class BM25Index {
  constructor(k1 = 1.2, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.documents = [];
    this.docLengths = [];
    this.avgDocLength = 0;
    this.docFreqs = new Map(); // term -> count of docs containing term
    this.invertedIndex = new Map(); // term -> array of { docIndex, tf }
    this.totalDocs = 0;
  }

  buildIndex(chunks) {
    this.documents = chunks;
    this.totalDocs = chunks.length;
    this.docLengths = new Array(this.totalDocs);
    this.docFreqs = new Map();
    this.invertedIndex = new Map();

    let totalLength = 0;

    for (let i = 0; i < this.totalDocs; i++) {
      const tokens = tokenize(chunks[i].content);
      this.docLengths[i] = tokens.length;
      totalLength += tokens.length;

      // Calculate term frequencies for doc i
      const termCounts = new Map();
      for (const token of tokens) {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
      }

      for (const [term, tf] of termCounts.entries()) {
        this.docFreqs.set(term, (this.docFreqs.get(term) || 0) + 1);
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, []);
        }
        this.invertedIndex.get(term).push({ docIndex: i, tf });
      }
    }

    this.avgDocLength = this.totalDocs > 0 ? totalLength / this.totalDocs : 1;
  }

  search(query, topK = 8) {
    if (this.totalDocs === 0) return [];
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores = new Float64Array(this.totalDocs);

    for (const term of queryTokens) {
      const postings = this.invertedIndex.get(term);
      if (!postings) continue;

      const df = this.docFreqs.get(term) || 0;
      // Okapi BM25 standard IDF with smoothing
      const idf = Math.log(1 + (this.totalDocs - df + 0.5) / (df + 0.5));

      for (const { docIndex, tf } of postings) {
        const docLen = this.docLengths[docIndex];
        const normFactor = 1 - this.b + this.b * (docLen / (this.avgDocLength || 1));
        const termScore = idf * ((tf * (this.k1 + 1)) / (tf + this.k1 * normFactor));
        scores[docIndex] += termScore;
      }
    }

    const scoredDocs = [];
    for (let i = 0; i < this.totalDocs; i++) {
      if (scores[i] > 0) {
        scoredDocs.push({
          chunk: this.documents[i],
          bm25Score: scores[i],
          docIndex: i
        });
      }
    }

    scoredDocs.sort((a, b) => b.bm25Score - a.bm25Score);
    return scoredDocs.slice(0, topK);
  }
}
