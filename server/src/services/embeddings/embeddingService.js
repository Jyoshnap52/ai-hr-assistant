// server/src/services/embeddings/embeddingService.js
import { generateNeuralEmbedding } from './hfEmbeddingService.js';

const VECTOR_DIM = 384;

// 1. Old Hashing Algorithm (Kept as baseline for ablation comparison)
function hashString(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function generateHashedEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Array(VECTOR_DIM).fill(0);
  }

  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  const vector = new Array(VECTOR_DIM).fill(0);

  if (words.length === 0) return vector;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const h1 = hashString(word) % VECTOR_DIM;
    vector[h1] += 1.5;

    if (i < words.length - 1) {
      const bigram = word + '_' + words[i + 1];
      const h2 = hashString(bigram) % VECTOR_DIM;
      vector[h2] += 2.0;
    }
  }

  // Normalize
  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) vector[i] /= norm;
  }
  return vector;
}

// 2. The Universal Generator with Switch
export async function generateEmbedding(text, isQuery = false) {
  const mode = process.env.EMBEDDER || 'bge'; // Defaults to real Hugging Face model

  if (mode === 'hashed') {
    return generateHashedEmbedding(text);
  }

  // Real BGE Hugging Face model
  return await generateNeuralEmbedding(text, isQuery);
}

// 3. True Cosine Similarity
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}