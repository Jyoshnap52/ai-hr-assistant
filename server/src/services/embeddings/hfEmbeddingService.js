// server/src/services/embeddings/hfEmbeddingService.js
import { pipeline } from '@huggingface/transformers';

const MODEL_NAME = 'Xenova/bge-small-en-v1.5';
const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';

let extractor = null;
let isLoading = false;

/**
 * Initializes and caches the Hugging Face pipeline (Singleton).
 */
export async function getExtractor() {
  if (extractor) return extractor;
  if (isLoading) {
    // Wait until existing loader completes
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return extractor;
  }

  isLoading = true;
  try {
    console.log(`🤖 Initializing Hugging Face Embedding Model: ${MODEL_NAME}...`);
    extractor = await pipeline('feature-extraction', MODEL_NAME);
    console.log(`✅ Hugging Face Model ${MODEL_NAME} loaded successfully.`);
  } catch (error) {
    console.error('❌ Failed to load Hugging Face model:', error.message);
    throw error;
  } finally {
    isLoading = false;
  }

  return extractor;
}

/**
 * Generates a 384-dimensional dense vector for a given text.
 * @param {string} text - The input query or document passage.
 * @param {boolean} isQuery - If true, prepends the BGE search query instruction.
 * @returns {Promise<number[]>} 384-dimensional normalized vector.
 */
export async function generateNeuralEmbedding(text, isQuery = false) {
  if (!text || typeof text !== 'string') {
    return new Array(384).fill(0);
  }

  const model = await getExtractor();
  const input = isQuery ? QUERY_PREFIX + text : text;

  const output = await model(input, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}