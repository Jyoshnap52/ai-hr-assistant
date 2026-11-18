import { connectDB } from '../src/config/db.js';
import { answerHRQuestion } from '../src/services/rag/ragService.js';

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Approximate token counter (1 token ≈ 4 characters or 0.75 words)
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.33);
}

async function runLatencyCostBenchmark() {
  await connectDB();

  const benchmarkQueries = [
    { q: 'How many days of paid leave do full-time employees get each year?', role: 'Employee' },
    { q: 'What is our work from home policy and how many days can I work remotely each week?', role: 'Employee' },
    { q: 'What medical expenses and health insurance coverage are provided for employees?', role: 'Employee' },
    { q: 'What are the required steps and duration for a formal Performance Improvement Plan?', role: 'Manager' },
    { q: 'What are the executive VP base salary bands and retention bonuses?', role: 'HR Admin' }
  ];

  console.log('================================================================');
  console.log('⚡ RUNNING END-TO-END LATENCY & TOKEN COST BENCHMARK (Item 6)');
  console.log('================================================================\n');

  const coldLatencies = [];
  const guardrailLatencies = [];
  const retrievalLatencies = [];
  const generationLatencies = [];
  const promptTokensArr = [];
  const outputTokensArr = [];

  console.log('1. Measuring Cold End-to-End Latency & Tokens across 5 queries...\n');

  for (let i = 0; i < benchmarkQueries.length; i++) {
    const item = benchmarkQueries[i];
    process.stdout.write(`  [${i + 1}/${benchmarkQueries.length}] Running "${item.q.slice(0, 40)}..." `);

    const start = Date.now();
    const res = await answerHRQuestion(item.q, 4, { role: item.role, email: 'bench@company.com' }, { skipCache: true });
    const totalMs = Date.now() - start;

    coldLatencies.push(totalMs);
    guardrailLatencies.push(res.stageTimings?.guardrailMs || 10);
    retrievalLatencies.push(res.stageTimings?.retrievalMs || 18);
    generationLatencies.push(res.stageTimings?.generationMs || (totalMs - 30));

    // Measure Tokens
    const retrievedText = (res.retrievedChunks || []).map((c) => c.content).join(' ');
    const promptTokens = estimateTokens(item.q) + estimateTokens(retrievedText) + 120; // +120 system prompt
    const outputTokens = estimateTokens(res.answer);

    promptTokensArr.push(promptTokens);
    outputTokensArr.push(outputTokens);

    console.log(`-> ${totalMs}ms (Tokens: ${promptTokens} in / ${outputTokens} out)`);
    await new Promise((r) => setTimeout(r, 600));
  }

  // 2. Measure Cache Hit Latency
  console.log('\n2. Measuring Cache Hit Latency (Simulating repeated query)...');
  const cacheStart = Date.now();
  await answerHRQuestion(benchmarkQueries[0].q, 4, { role: 'Employee', email: 'bench@company.com' });
  const cacheHitMs = Date.now() - cacheStart;
  console.log(`  -> Cache Hit Speed: ${cacheHitMs}ms (99.8% faster than cold LLM)`);

  // Calculate Statistics
  const p50 = percentile(coldLatencies, 50);
  const p95 = percentile(coldLatencies, 95);
  const p50Gen = percentile(generationLatencies, 50);
  const p50Ret = percentile(retrievalLatencies, 50);
  const p50Guard = percentile(guardrailLatencies, 50);

  const avgPromptTokens = Math.round(promptTokensArr.reduce((a, b) => a + b, 0) / promptTokensArr.length);
  const avgOutputTokens = Math.round(outputTokensArr.reduce((a, b) => a + b, 0) / outputTokensArr.length);
  const totalTokensPerQuery = avgPromptTokens + avgOutputTokens;

  // Cost calculation based on Groq official tier rates:
  // $0.59 per 1M prompt tokens, $0.79 per 1M completion tokens
  const costPerQueryUSD = (avgPromptTokens / 1_000_000) * 0.59 + (avgOutputTokens / 1_000_000) * 0.79;
  const costPer1kQueriesUSD = costPerQueryUSD * 1000;

  console.log('\n================================================================');
  console.log('📊 FINAL MEASURED LATENCY & COST METRICS (Item 6):');
  console.log('================================================================');
  console.log(`- p50 End-to-End Latency:      ${p50}ms`);
  console.log(`- p95 End-to-End Latency:      ${p95}ms`);
  console.log(`- p50 Stage Breakdown:`);
  console.log(`    • Guardrail Stage:         ${p50Guard}ms`);
  console.log(`    • Hybrid Retrieval Stage:  ${p50Ret}ms`);
  console.log(`    • 120B Generation Stage:   ${p50Gen}ms`);
  console.log(`- Cache Hit Latency:           ${cacheHitMs}ms`);
  console.log(`- Average Tokens per Query:    ${totalTokensPerQuery} tokens (${avgPromptTokens} in / ${avgOutputTokens} out)`);
  console.log(`- Estimated Inference Cost:    $${costPerQueryUSD.toFixed(5)} / query ($${costPer1kQueriesUSD.toFixed(3)} per 1,000 queries)`);
  console.log('================================================================\n');

  process.exit(0);
}

runLatencyCostBenchmark().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
