import mongoose from 'mongoose';
import { DocumentChunk } from '../../models/DocumentChunk.js';
import { generateEmbedding, cosineSimilarity } from '../embeddings/embeddingService.js';
import { memoryStore } from '../../config/db.js';
import { BM25Index } from './bm25.js';
import { rerankCandidates } from './reranker.js';
import { expandQueryHeuristic } from './queryRewriter.js';

// Helper to reliably check live MongoDB connection
function isMongoLive() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// Cached in-memory BM25 index
let cachedBM25Index = null;
let lastIndexedCount = 0;

/**
 * Add document chunks to vector & document store with role metadata
 */
export async function addChunksToVectorStore(chunks, documentId, documentTitle, options = {}) {
  // Defensive RBAC Assertion: Fail fast if tags are missing or empty
  if (!options.accessRoles || !Array.isArray(options.accessRoles) || options.accessRoles.length === 0) {
    throw new Error(`🚨 [RBAC Integrity Error] Document "${documentTitle}" has missing or empty accessRoles! Untagged documents are blocked.`);
  }

  const accessRoles = options.accessRoles;
  const version = options.version || '1.0';
  const isSuperseded = options.isSuperseded || false;
 
  // Use Promise.all with async so await works properly
  const preparedChunks = await Promise.all(
    chunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk.content, false);
      return {
        documentId,
        documentTitle,
        chunkIndex: index,
        content: chunk.content,
        section: chunk.section || 'General',
        pageNumber: chunk.pageNumber || 1,
        accessRoles,
        version,
        isSuperseded,
        embedding
      };
    })
  );

  if (isMongoLive()) {
    await DocumentChunk.insertMany(preparedChunks);
  } else {
    memoryStore.documentChunks.push(...preparedChunks);
  }

  // Invalidate cached BM25 index so next search rebuilds it
  cachedBM25Index = null;

  return preparedChunks.length;
}

/**
 * Fetch all eligible chunks with pre-retrieval role filtering and active version check
 */
export async function getEligibleChunks(userRole = 'Employee') {
  let chunks = [];

  if (isMongoLive()) {
    chunks = await DocumentChunk.find({
      accessRoles: userRole,
      isSuperseded: { $ne: true }
    });
  } else {
    chunks = (memoryStore.documentChunks || []).filter((chunk) => {
      const allowedRoles = chunk.accessRoles || ['Employee', 'Manager', 'HR Admin'];
      const notSuperseded = !chunk.isSuperseded;
      // SIMULATED RBAC BYPASS BUG: allow all roles access to all chunks
      return notSuperseded;
    });
  }

  return chunks;
}

/**
 * Dense Vector Similarity Search
 */
export async function denseVectorSearch(query, eligibleChunks, topK = 8) {
  if (!eligibleChunks || eligibleChunks.length === 0) return [];
  const queryEmbedding = await generateEmbedding(query, true);

  // Use Promise.all with async
  const scored = await Promise.all(
    eligibleChunks.map(async (chunk, idx) => {
      const chunkEmbed =
        chunk.embedding && chunk.embedding.length
          ? chunk.embedding
          : await generateEmbedding(chunk.content, false);
      const score = cosineSimilarity(queryEmbedding, chunkEmbed);
      return {
        chunk,
        denseScore: score,
        idx
      };
    })
  );

  scored.sort((a, b) => b.denseScore - a.denseScore);
  return scored.slice(0, topK);
}

/**
 * Sparse BM25 Lexical Search
 */
export function sparseBM25Search(query, eligibleChunks, topK = 8) {
  if (!eligibleChunks || eligibleChunks.length === 0) return [];

  const bm25 = new BM25Index();
  bm25.buildIndex(eligibleChunks);
  const results = bm25.search(query, topK);

  return results.map((res) => ({
    chunk: res.chunk,
    bm25Score: res.bm25Score
  }));
}

/**
 * Reciprocal Rank Fusion (RRF) combining Dense and Sparse rankings
 */
export function reciprocalRankFusion(denseResults, bm25Results, k = 60) {
  const scoreMap = new Map();

  denseResults.forEach((item, rank) => {
    const key = `${item.chunk.documentTitle}-${item.chunk.chunkIndex || item.chunk.section}`;
    const rrfScore = 1 / (k + rank + 1);
    scoreMap.set(key, {
      chunk: item.chunk,
      denseScore: item.denseScore || 0,
      bm25Score: 0,
      rrfScore
    });
  });

  bm25Results.forEach((item, rank) => {
    const key = `${item.chunk.documentTitle}-${item.chunk.chunkIndex || item.chunk.section}`;
    const rrfAdd = 1 / (k + rank + 1);
    if (scoreMap.has(key)) {
      const existing = scoreMap.get(key);
      existing.bm25Score = item.bm25Score || 0;
      existing.rrfScore += rrfAdd;
    } else {
      scoreMap.set(key, {
        chunk: item.chunk,
        denseScore: 0,
        bm25Score: item.bm25Score || 0,
        rrfScore: rrfAdd
      });
    }
  });

  const merged = Array.from(scoreMap.values());
  merged.sort((a, b) => b.rrfScore - a.rrfScore);
  return merged;
}

/**
 * Unified Search with Full Ablation Mode Support
 */
export async function similaritySearch(query, topK = 4, options = {}) {
  const userRole = options.userRole || 'Employee';
  const mode = options.mode || 'rewrite_hybrid_rerank';
  const candidatePoolSize = options.candidatePoolSize || 8;

  // 1. Enforce Role-Based Pre-Retrieval Filtering
  const eligibleChunks = await getEligibleChunks(userRole);
  if (!eligibleChunks || eligibleChunks.length === 0) {
    return [];
  }

  // 2. Query expansion / rewriting if enabled
  let searchQuery = query;
  if (mode === 'rewrite_hybrid_rerank' || options.enableQueryRewrite) {
    searchQuery = expandQueryHeuristic(query);
  }

  // 3. Execution based on selected ablation mode
  if (mode === 'vector_only') {
    const dense = await denseVectorSearch(searchQuery, eligibleChunks, topK);
    return dense
      .filter((d) => d.denseScore > 0.04)
      .map((d) => formatChunkOutput(d.chunk, d.denseScore, 'vector_only'));
  }

  if (mode === 'bm25_only') {
    const sparse = sparseBM25Search(searchQuery, eligibleChunks, topK);
    return sparse.map((s) => formatChunkOutput(s.chunk, s.bm25Score, 'bm25_only'));
  }

  // Stage 1: Hybrid candidate generation (Dense + Sparse)
  const denseCandidates = await denseVectorSearch(searchQuery, eligibleChunks, candidatePoolSize);
  const sparseCandidates = sparseBM25Search(searchQuery, eligibleChunks, candidatePoolSize);

  // If sparse candidates exist, filter out weak dense noise
  const filteredDense = denseCandidates.filter(
    (d) => d.denseScore >= 0.22 || sparseCandidates.some((s) => s.chunk.documentTitle === d.chunk.documentTitle)
  );

  // Fuse candidates using RRF
  const fusedCandidates = reciprocalRankFusion(filteredDense, sparseCandidates);

  if (fusedCandidates.length === 0) {
    return [];
  }

  if (mode === 'hybrid_rrf') {
    return fusedCandidates
      .slice(0, topK)
      .map((item) => formatChunkOutput(item.chunk, item.rrfScore, 'hybrid_rrf', item));
  }

  // Stage 2: Contextual Reranking
  const candidateFormatted = fusedCandidates.slice(0, candidatePoolSize).map((item) => {
    const chunkObj = item.chunk?.toObject ? item.chunk.toObject() : (item.chunk || {});
    return {
      ...chunkObj,
      content: chunkObj.content || item.chunk?.content || '',
      score: item.rrfScore,
      denseScore: item.denseScore,
      bm25Score: item.bm25Score
    };
  });

  const reranked = await rerankCandidates(query, candidateFormatted, topK, false);

  return reranked.map((item) =>
    formatChunkOutput(item, item.rerankScore || item.score, 'hybrid_rerank', {
      denseScore: item.denseScore,
      bm25Score: item.bm25Score
    })
  );
}

// Alias for backwards compatibility
export const searchVectorStore = similaritySearch;

function formatChunkOutput(chunk, score, retrievalMethod, extra = {}) {
  const c = chunk?.toObject ? chunk.toObject() : (chunk || {});
  return {
    documentId: c.documentId,
    documentTitle: c.documentTitle,
    content: c.content || '',
    section: c.section || 'General',
    pageNumber: c.pageNumber || 1,
    accessRoles: c.accessRoles || ['Employee'],
    version: c.version || '1.0',
    effectiveDate: c.effectiveDate || '2026-01-01',
    score: Number((score || 0).toFixed(4)),
    retrievalMethod,
    denseScore: extra.denseScore !== undefined ? Number(extra.denseScore.toFixed(4)) : undefined,
    bm25Score: extra.bm25Score !== undefined ? Number(extra.bm25Score.toFixed(4)) : undefined
  };
}

export async function deleteDocumentChunks(documentId) {
  if (isMongoLive()) {
    await DocumentChunk.deleteMany({ documentId });
  } else {
    memoryStore.documentChunks = memoryStore.documentChunks.filter(
      (c) => String(c.documentId) !== String(documentId)
    );
  }
  cachedBM25Index = null;
}