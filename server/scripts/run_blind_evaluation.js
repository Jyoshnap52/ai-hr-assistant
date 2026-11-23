import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { memoryStore } from '../src/config/db.js';
import { seedInitialData } from '../src/utils/seed.js';
import { similaritySearch } from '../src/services/rag/vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBlindTest() {
  console.log('🔄 Seeding in-memory corpus...');
  await seedInitialData();
  const totalChunks = memoryStore.documentChunks.length;
  console.log(`✅ Loaded ${totalChunks} chunks in corpus.\n`);

  const blindDataPath = path.join(__dirname, '../data/blind_test_set_20.json');
  const testSet = JSON.parse(fs.readFileSync(blindDataPath, 'utf-8'));

  console.log(`========================================================================`);
  console.log(`🛡️ RUNNING BLIND EVALUATION (N = ${testSet.length} Unseen Questions)`);
  console.log(`Pipeline: Hybrid RRF + MiniLM Reranker (Candidate Pool k = 8)`);
  console.log(`========================================================================\n`);

  let r1Hits = 0;
  let r4Hits = 0;
  let sumRR = 0;

  for (let i = 0; i < testSet.length; i++) {
    const item = testSet[i];
    const results = await similaritySearch(item.query, 4, {
      userRole: item.requiredRole || 'Employee',
      mode: 'hybrid_rerank',
      candidatePoolSize: 8
    });

    let rankFound = -1;
    for (let r = 0; r < results.length; r++) {
      if (results[r].documentTitle === item.targetDocTitle) {
        rankFound = r + 1;
        break;
      }
    }

    if (rankFound === 1) r1Hits++;
    if (rankFound >= 1 && rankFound <= 4) {
      r4Hits++;
      sumRR += 1 / rankFound;
    }

    const badge = rankFound === 1 ? '🥇 Rank 1' : rankFound > 1 ? `🥈 Rank ${rankFound}` : '❌ Missed';
    console.log(`[Q${String(i + 1).padStart(2, '0')}] ${badge} | "${item.query.slice(0, 48)}..." ➔ Target: ${item.targetDocTitle}`);
  }

  const n = testSet.length;
  const recallAt1 = ((r1Hits / n) * 100).toFixed(1);
  const recallAt4 = ((r4Hits / n) * 100).toFixed(1);
  const mrr = (sumRR / n).toFixed(3);

  console.log(`\n========================================================================`);
  console.log(`🏆 FINAL BLIND TEST RESULTS ON UNSEEN QUESTIONS`);
  console.log(`========================================================================`);
  console.table([
    {
      'Test Set': `Blind Set (N=${n})`,
      'Corpus Chunks': totalChunks,
      'Pipeline': 'Hybrid RRF + MiniLM (k=8)',
      'Recall@1': `${recallAt1}%`,
      'Recall@4': `${recallAt4}%`,
      'MRR': mrr
    }
  ]);
}

runBlindTest().catch(console.error);