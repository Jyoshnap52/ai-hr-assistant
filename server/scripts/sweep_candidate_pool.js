import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { memoryStore } from '../src/config/db.js';
import { seedInitialData } from '../src/utils/seed.js';
import { similaritySearch } from '../src/services/rag/vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getP50(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function runSweep() {
  console.log('🔄 Seeding in-memory corpus...');
  await seedInitialData();
  const totalChunks = memoryStore.documentChunks.length;
  console.log(`✅ Loaded ${totalChunks} chunks in corpus.\n`);

  const dataPath = path.join(__dirname, '../data/paraphrase_test_set_30.json');
  const testSet = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const poolSizes = [8, 15, 25, 40];

  // =========================================================================
  // 1. UNRERANKED HYBRID RECALL CEILINGS (Ceiling for Reranker)
  // =========================================================================
  console.log('========================================================================');
  console.log('📊 1. UNRERANKED HYBRID RECALL CEILINGS (Theoretical Maximums for Reranker)');
  console.log('========================================================================');

  const ceilingResults = [];

  for (const k of poolSizes) {
    let hits = 0;

    for (const item of testSet) {
      // Retrieve top k unreranked using hybrid_rrf
      const results = await similaritySearch(item.query, k, {
        userRole: item.requiredRole || 'Employee',
        mode: 'hybrid_rrf',
        candidatePoolSize: k
      });

      const retrievedTitles = results.map(r => r.documentTitle);
      if (retrievedTitles.includes(item.targetDocTitle)) {
        hits++;
      }
    }

    const recall = (hits / testSet.length) * 100;
    ceilingResults.push({
      'Candidate Pool (k)': k,
      'Hybrid Recall@k (Ceiling)': `${recall.toFixed(1)}%`,
      'Raw Hits': `${hits}/${testSet.length}`,
      'Headroom Left': `${(100 - recall).toFixed(1)}%`
    });
  }

  console.table(ceilingResults);

  // =========================================================================
  // 2. SWEEP CROSS-ENCODER POOL SIZES (Quality vs p50 Latency)
  // =========================================================================
  console.log('\n========================================================================');
  console.log('🎯 2. CROSS-ENCODER CANDIDATE POOL SWEEP (Quality vs p50 Latency)');
  console.log('========================================================================');

  const sweepResults = [];

  for (const k of poolSizes) {
    let r1Hits = 0;
    let r4Hits = 0;
    let mrrTotal = 0;
    const latencies = [];

    for (const item of testSet) {
      const t0 = performance.now();
      const results = await similaritySearch(item.query, 4, {
        userRole: item.requiredRole || 'Employee',
        mode: 'hybrid_rerank',
        candidatePoolSize: k
      });
      const t1 = performance.now();
      latencies.push(t1 - t0);

      const top1Doc = results[0]?.documentTitle;
      const top4Docs = results.slice(0, 4).map(r => r.documentTitle);

      if (top1Doc === item.targetDocTitle) r1Hits++;
      if (top4Docs.includes(item.targetDocTitle)) r4Hits++;

      const rankIndex = results.findIndex(r => r.documentTitle === item.targetDocTitle);
      if (rankIndex !== -1) {
        mrrTotal += 1 / (rankIndex + 1);
      }
    }

    const n = testSet.length;
    const p50 = getP50(latencies);

    sweepResults.push({
      'Pool Size (k)': k,
      'Recall@1': `${((r1Hits / n) * 100).toFixed(1)}%`,
      'Recall@4': `${((r4Hits / n) * 100).toFixed(1)}%`,
      'MRR': (mrrTotal / n).toFixed(3),
      'p50 Retrieval Latency': `${p50.toFixed(1)} ms`
    });
  }

  console.table(sweepResults);
}

runSweep().catch(console.error);