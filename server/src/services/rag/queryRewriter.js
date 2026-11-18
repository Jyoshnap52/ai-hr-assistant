/**
 * Query Expansion & Rewriting Engine
 * Transforms conversational or shorthand user questions into optimized search queries.
 */

const HR_SYNONYMS = {
  pto: 'paid time off annual leave vacation days',
  wfh: 'work from home remote hybrid flexibility policy',
  insurance: 'medical health dental vision coverage reimbursement claims',
  increment: 'salary revision compensation hike appraisal bonus',
  resignation: 'notice period offboarding exit interview termination',
  maternity: 'parental leave pregnancy benefits paternity time off',
  laptop: 'equipment hardware allowance reimbursement desk monitor'
};

/**
 * Heuristic fast query expansion with domain synonym injection
 */
export function expandQueryHeuristic(query) {
  if (!query || typeof query !== 'string') return query;
  const lower = query.toLowerCase();
  const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);

  const expansions = [];
  for (const w of words) {
    if (HR_SYNONYMS[w]) {
      expansions.push(HR_SYNONYMS[w]);
    }
  }

  if (expansions.length === 0) return query;
  return `${query} (${expansions.join(' ')})`;
}

/**
 * LLM-based query rewrite for complex conversational queries
 */
export async function rewriteQueryWithLLM(query, conversationHistory = []) {
  if (!query) return query;

  // Simple queries don't need heavy LLM rewrite
  if (query.trim().split(/\s+/).length < 4 && conversationHistory.length === 0) {
    return expandQueryHeuristic(query);
  }

  // Domain expansion fallback
  return expandQueryHeuristic(query);
}
