import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { memoryStore } from '../src/config/db.js';
import { seedInitialData } from '../src/utils/seed.js';
import { similaritySearch, getEligibleChunks, denseVectorSearch, sparseBM25Search, reciprocalRankFusion } from '../src/services/rag/vectorStore.js';
import { AutoTokenizer, AutoModelForSequenceClassification } from '@huggingface/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getP50(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Custom rerank function that takes a specific model
async function evaluateReranker(modelName, poolSize, testSet, eligibleChunks) {
  console.log(`\n⏳ Loading ${modelName}...`);
  const tokenizer = await AutoTokenizer.from_pretrained(modelName);
  const model = await AutoModelForSequenceClassification.from_pretrained(modelName);

  let r1 = 0, r4 = 0, mrrTotal = 0;
  const latencies = [];

  for (const item of testSet) {
    // 1. Get hybrid candidates of size poolSize
    const dense = await denseVectorSearch(item.query, eligibleChunks, poolSize);
    const sparse = sparseBM25Search(item.query, eligibleChunks, poolSize);
    const candidates = reciprocalRankFusion(dense, sparse).slice(0, poolSize);

    // 2. Score with cross-encoder
    const t0 = performance.now();
    const scored = [];
    for (const cand of candidates) {
      const inputs = await tokenizer(item.query, {
        text_pair: cand.chunk.content,
        padding: true,
        truncation: true,
        max_length: 512
      });
      const output = await model(inputs);
      const logit = Number(output.logits.data[0]);
      scored.push({ ...cand.chunk, score: 1 / (1 + Math.exp(-logit)) });
    }
    scored.sort((a, b) => b.score - a.score);
    const t1 = performance.now();
    latencies.push(t1 - t0);

    const top1 = scored[0]?.documentTitle;
    const top4 = scored.slice(0, 4).map(c => c.documentTitle);

    if (top1 === item.targetDocTitle) r1++;
    if (top4.includes(item.targetDocTitle)) r4++;

    const rankIdx = scored.findIndex(c => c.documentTitle === item.targetDocTitle);
    if (rankIdx !== -1) mrrTotal += 1 / (rankIdx + 1);
  }

  const n = testSet.length;
  return {
    'Reranker Model': modelName.replace('Xenova/', ''),
    'Pool (k)': poolSize,
    'Recall@1': `${((r1 / n) * 100).toFixed(1)}%`,
    'Recall@4': `${((r4 / n) * 100).toFixed(1)}%`,
    'MRR': (mrrTotal / n).toFixed(3),
    'p50 Latency': `${getP50(latencies).toFixed(1)} ms`
  };
}

async function run() {
  await seedInitialData();
  const eligibleChunks = await getEligibleChunks('Employee');
  const testSet = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/paraphrase_test_set_30.json'), 'utf-8'));

  const results = [];
  
  // 1. MiniLM at pool 8 & 15
  results.push(await evaluateReranker('Xenova/ms-marco-MiniLM-L-6-v2', 8, testSet, eligibleChunks));
  results.push(await evaluateReranker('Xenova/ms-marco-MiniLM-L-6-v2', 15, testSet, eligibleChunks));

  // 2. BGE Reranker Base at pool 8 & 15
  results.push(await evaluateReranker('Xenova/bge-reranker-base', 8, testSet, eligibleChunks));
  results.push(await evaluateReranker('Xenova/bge-reranker-base', 15, testSet, eligibleChunks));

  console.log('\n========================================================================');
  console.log('🏆 CROSS-ENCODER HEAD-TO-HEAD: MiniLM-L6 vs. BGE-Reranker-Base');
  console.log('========================================================================');
  console.table(results);
}

run().catch(console.error);