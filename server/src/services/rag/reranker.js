// server/src/services/rag/reranker.js
import { AutoTokenizer, AutoModelForSequenceClassification } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/ms-marco-MiniLM-L-6-v2';

let tokenizer = null;
let model = null;
let isLoading = false;

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Loads the Cross-Encoder Model (Singleton)
 */
export async function getCrossEncoder() {
  if (tokenizer && model) return { tokenizer, model };
  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return { tokenizer, model };
  }

  isLoading = true;
  try {
    console.log(`🤖 Loading Neural Cross-Encoder Reranker: ${MODEL_ID}...`);
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
    model = await AutoModelForSequenceClassification.from_pretrained(MODEL_ID);
    console.log(`✅ Cross-Encoder loaded successfully.`);
  } catch (err) {
    console.error('❌ Failed to load Cross-Encoder:', err.message);
    throw err;
  } finally {
    isLoading = false;
  }

  return { tokenizer, model };
}

/**
 * Reranks candidate document chunks using deep Cross-Attention.
 * @param {string} query - The user search query.
 * @param {Array} candidates - The top candidates from Stage 1 (Hybrid RRF).
 * @param {number} topK - Number of final chunks to return.
 * @returns {Promise<Array>} Reranked candidates sorted by neural relevance score.
 */
export async function rerankCandidates(query, candidates, topK = 4) {
  if (!candidates || candidates.length === 0) return [];
  if (candidates.length <= 1) return candidates;

  try {
    const { tokenizer: tok, model: mdl } = await getCrossEncoder();

    const scoredCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const title = candidate.documentTitle ? `[Document: ${candidate.documentTitle}] ` : '';
        const chunkText = title + (candidate.content || candidate.text || '');
        const inputs = await tok(query, {
          text_pair: chunkText,
          padding: true,
          truncation: true
        });

        const output = await mdl(inputs);
        const rawLogit = output.logits.data[0];
        const relevanceScore = sigmoid(rawLogit);

        return {
          ...candidate,
          rerankScore: Number(relevanceScore.toFixed(4)),
          rawLogit: Number(rawLogit.toFixed(2))
        };
      })
    );

    // Sort descending by neural cross-encoder relevance score
    scoredCandidates.sort((a, b) => b.rerankScore - a.rerankScore);

    return scoredCandidates.slice(0, topK);
  } catch (err) {
    console.warn('⚠️ Cross-encoder rerank fallback:', err.message);
    return candidates.slice(0, topK);
  }
}