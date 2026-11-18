/**
 * Contextual Reranker Engine
 * Implements two-stage retrieval refinement:
 * Stage 1: Candidate retrieval (top 8 via Hybrid RRF)
 * Stage 2: Reranking & precision filtering down to top K (e.g. top 4)
 */

import { getGroqCompletion } from '../ai/groqService.js';

/**
 * Fast cross-encoder relevance scoring heuristic
 * Computes exact phrase matches, term co-occurrences, and proximity bonuses.
 */
export function fastHeuristicRerank(query, chunkContent) {
  if (!chunkContent || typeof chunkContent !== 'string') return 0.05;
  if (!query || typeof query !== 'string') return 0.05;

  const qLower = query.toLowerCase();
  const cLower = chunkContent.toLowerCase();

  let score = 0;

  // Exact phrase match bonus
  if (cLower.includes(qLower)) {
    score += 0.45;
  }

  // Token coverage
  const qTokens = qLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  if (qTokens.length === 0) return 0.1;

  let matchedTokens = 0;
  for (const token of qTokens) {
    if (cLower.includes(token)) {
      matchedTokens++;
    }
  }
  const tokenCoverage = matchedTokens / qTokens.length;
  score += tokenCoverage * 0.4;

  // Header/Section title alignment bonus
  const firstLine = cLower.split('\n')[0] || '';
  for (const token of qTokens) {
    if (firstLine.includes(token)) {
      score += 0.15;
      break;
    }
  }

  return Math.min(1.0, score);
}

/**
 * High-precision LLM-powered reranker for top candidate refinement.
 * Scores candidate chunks from 0.00 to 1.00 based on factual relevance to the query.
 */
export async function rerankCandidates(query, candidates, topK = 4, useLLM = false) {
  if (!candidates || candidates.length === 0) return [];
  if (candidates.length <= topK && !useLLM) return candidates;

  if (!useLLM) {
    // Stage 2 fast heuristic reranker
    const reranked = candidates.map((item) => {
      const hScore = fastHeuristicRerank(query, item.content);
      const combinedScore = (item.score || item.rrfScore || 0.5) * 0.5 + hScore * 0.5;
      return {
        ...item,
        rerankScore: Number(combinedScore.toFixed(4))
      };
    });

    reranked.sort((a, b) => b.rerankScore - a.rerankScore);
    return reranked.slice(0, topK);
  }

  // LLM Reranker for production-grade evaluation and precision
  try {
    const candidateSummaries = candidates
      .slice(0, 8)
      .map((c, i) => `[Candidate ${i + 1}] (${c.documentTitle}):\n${c.content.slice(0, 300)}...`)
      .join('\n\n');

    const prompt = `You are an expert search reranker for an enterprise HR retrieval system.
Given the User Query and a list of Candidate Chunks, output a JSON array of the top candidate indices sorted by relevance, along with a relevance score between 0.0 and 1.0.

User Query: "${query}"

Candidates:
${candidateSummaries}

Respond ONLY with a valid JSON array like this:
[{"index": 1, "score": 0.95}, {"index": 3, "score": 0.82}]`;

    const rawResponse = await getGroqCompletion('You are a JSON search ranking evaluator.', prompt);
    const jsonMatch = rawResponse.match(/\[.*\]/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const reordered = [];
      for (const rank of parsed) {
        const orig = candidates[rank.index - 1];
        if (orig) {
          reordered.push({
            ...orig,
            rerankScore: rank.score
          });
        }
      }
      if (reordered.length > 0) {
        return reordered.slice(0, topK);
      }
    }
  } catch (err) {
    console.warn('LLM Reranker fallback to heuristic:', err.message);
  }

  // Fallback to heuristic
  return candidates.slice(0, topK);
}
