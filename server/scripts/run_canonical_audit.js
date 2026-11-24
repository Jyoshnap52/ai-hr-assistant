import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedInitialData } from '../src/utils/seed.js';
import { answerHRQuestion } from '../src/services/rag/ragService.js';
import { getGroqCompletion } from '../src/services/ai/groqService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/blind_test_set_20.json');
const dataset = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function judgeAnswer(query, retrievedChunks, answer) {
  const contextText = retrievedChunks.map((c, i) => `[Chunk ${i + 1} (${c.documentTitle})]: ${c.content}`).join('\n\n');

  const systemPrompt = `You are a strict RAG compliance auditor following RAGAS standards.
Evaluate whether the Generated Answer is 100% faithful to the context chunks.
Output JSON only:
{"verdict": "PASS" or "FAIL", "faithfulnessScore": 1.00, "reasoning": "concise explanation"}`;

  const userPrompt = `USER QUERY: "${query}"\n\nCONTEXT CHUNKS:\n${contextText || 'No context.'}\n\nGENERATED ANSWER:\n"${answer}"\n\nRules: PASS (score >= 0.85) if claims are directly supported or it safely refuses. FAIL (score < 0.85) if it hallucinates unsupported facts. Output JSON only.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await getGroqCompletion(systemPrompt, userPrompt, 'llama-3.3-70b-versatile');
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.verdict && typeof parsed.faithfulnessScore === 'number') {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(`Judge attempt ${attempt + 1} error:`, err.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return { verdict: 'FAIL', faithfulnessScore: 0.0, reasoning: 'Judge error' };
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.ceil((p / 100) * s.length) - 1];
}

async function runCanonical() {
  await seedInitialData();

  console.log('========================================================================');
  console.log(`📋 RUNNING CANONICAL AUDIT ON BLIND-20`);
  console.log(`Generator: gpt-oss-120b | Judge: Meta llama-3.3-70b-versatile`);
  console.log('========================================================================\n');

  const results = [];
  const latencies = [];
  let hits = 0;
  let passes = 0;
  let totalFaithfulness = 0;

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    process.stdout.write(`[Row ${String(i + 1).padStart(2, '0')}/${dataset.length}] "${item.query.slice(0, 38)}..." `);

    const t0 = performance.now();
    const ragRes = await answerHRQuestion(
      item.query,
      4,
      { role: item.requiredRole || 'Employee', email: 'audit@company.com' },
      { skipCache: true, retrievalMode: 'hybrid_rerank' }
    );
    const latency = performance.now() - t0;
    latencies.push(latency);

    const chunks = ragRes.retrievedChunks || [];
    const isHit = chunks.some(c => c.documentTitle === item.targetDocTitle);
    if (isHit) hits++;

    const judge = await judgeAnswer(item.query, chunks, ragRes.answer);
    const score = judge.faithfulnessScore ?? (judge.verdict === 'PASS' ? 1.0 : 0.0);
    totalFaithfulness += score;

    const isPass = judge.verdict === 'PASS' || score >= 0.85;
    if (isPass) passes++;

    console.log(`➔ ${latency.toFixed(0)}ms | Hit: ${isHit ? 'HIT' : 'MISS'} | Judge: ${isPass ? 'PASS' : 'FAIL'} (${score})`);

    results.push({
      rowIndex: i,
      id: item.id,
      query: item.query,
      target: item.targetDocTitle,
      latencyMs: Number(latency.toFixed(1)),
      retrievalHit: isHit,
      judgeVerdict: isPass ? 'PASS' : 'FAIL',
      judgeScore: score,
      judgeReasoning: judge.reasoning,
      answerExcerpt: ragRes.answer.slice(0, 90).replace(/\n/g, ' ') + '...'
    });

    await new Promise(r => setTimeout(r, 700));
  }

  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const avgFaith = totalFaithfulness / dataset.length;

  const outputPath = path.join(__dirname, '../data/audit_blind_20_results.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        summary: {
          p50Ms: p50,
          p95Ms: p95,
          retrievalHits: hits,
          judgePasses: passes,
          avgFaithfulness: Number(avgFaith.toFixed(3)),
          total: dataset.length
        },
        rows: results
      },
      null,
      2
    )
  );

  console.log('\n========================================================================');
  console.log(`📊 FINAL RECONCILED AUDIT RESULTS (N = ${dataset.length}):`);
  console.log('========================================================================');
  console.log(`- Retrieval Recall@4:      ${hits}/${dataset.length} (${((hits / dataset.length) * 100).toFixed(0)}%)`);
  console.log(`- Judge Pass Rate:         ${passes}/${dataset.length} (${((passes / dataset.length) * 100).toFixed(0)}%)`);
  console.log(`- Average Faithfulness:    ${(avgFaith * 100).toFixed(1)}%`);
  console.log(`- Latency p50 (${dataset.length} calls):  ${p50.toFixed(0)} ms`);
  console.log(`- Latency p95 (${dataset.length} calls):  ${p95.toFixed(0)} ms`);
  console.log(`- Canonical Data Saved:    ${outputPath}`);
  console.log('========================================================================\n');

  process.exit(0);
}

runCanonical().catch(console.error);