/**
 * Enterprise Secure RAG Cache
 * Provides high-speed caching for safe, general employee HR policy queries.
 * Enforces strict security boundaries:
 * - Personal tool calls are NEVER cached.
 * - Elevated clearance (Manager/HR Admin) queries are NEVER cached.
 * - Guardrail interceptions and access refusals are NEVER cached.
 * - Cache key strictly scopes to userRole to prevent privilege leakage.
 */

// In-memory LRU cache map
const cacheStore = new Map();
const MAX_CACHE_ENTRIES = 200;
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours TTL

/**
 * Normalize query to maximize cache hit rate on equivalent phrasing
 */
export function normalizeCacheQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')    // normalize whitespace
    .trim();
}

/**
 * Generate secure role-scoped cache key
 */
export function generateCacheKey(userRole, query) {
  const normalized = normalizeCacheQuery(query);
  return `${userRole || 'Employee'}:${normalized}`;
}

/**
 * Strictly validate if a query result is eligible for caching
 */
export function isEligibleForCache({
  userRole,
  query,
  ragResult
}) {
  // 1. Only general Employee policies are eligible
  if (userRole !== 'Employee') {
    return false;
  }

  // 2. Personal employee tool calls must NEVER be cached
  if (ragResult.toolCall) {
    return false;
  }

  // 3. Guardrail blocked attempts must NEVER be cached
  if (ragResult.guardrailTriggered) {
    return false;
  }

  // 4. Low-confidence or access refusal messages must NEVER be cached
  const answer = (ragResult.answer || '').toLowerCase();
  if (
    answer.includes('information not accessible') ||
    answer.includes('restricted or not available') ||
    answer.includes('security alert') ||
    answer.includes('couldn’t find this information') ||
    answer.includes('could not find')
  ) {
    return false;
  }

  // 5. Must have authorized retrieved source documents
  if (!ragResult.sources || ragResult.sources.length === 0) {
    return false;
  }

  // 6. Ensure none of the retrieved documents are restricted manager/executive docs
  const hasRestrictedDocs = ragResult.sources.some((s) => {
    const title = (s.documentTitle || '').toLowerCase();
    return title.includes('executive') || title.includes('manager disciplinary') || title.includes('severance');
  });

  if (hasRestrictedDocs) {
    return false;
  }

  return true;
}

/**
 * Look up query in cache
 */
export function getCachedRagResponse(userRole, query) {
  // Only employees can read from the general cache
  if (userRole !== 'Employee') {
    return null;
  }

  const key = generateCacheKey(userRole, query);
  const entry = cacheStore.get(key);

  if (!entry) {
    return null;
  }

  // Check TTL expiration
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cacheStore.delete(key);
    return null;
  }

  return {
    ...entry.data,
    isCacheHit: true,
    cacheTimestamp: entry.timestamp
  };
}

/**
 * Store eligible query response in cache
 */
export function setCachedRagResponse(userRole, query, ragResult) {
  if (!isEligibleForCache({ userRole, query, ragResult })) {
    return false;
  }

  const key = generateCacheKey(userRole, query);

  // Evict oldest entry if at capacity (LRU behavior)
  if (cacheStore.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cacheStore.keys().next().value;
    cacheStore.delete(firstKey);
  }

  cacheStore.set(key, {
    timestamp: Date.now(),
    data: {
      answer: ragResult.answer,
      sources: ragResult.sources,
      retrievedChunks: ragResult.retrievedChunks,
      documentCount: ragResult.documentCount,
      confidenceScore: ragResult.confidenceScore,
      userRole: ragResult.userRole || userRole,
      retrievalMode: ragResult.retrievalMode
    }
  });

  return true;
}

/**
 * Clear the cache (e.g. when policies are updated)
 */
export function clearRagCache() {
  cacheStore.clear();
}
