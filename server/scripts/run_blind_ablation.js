import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { memoryStore } from '../src/config/db.js';
import { seedInitialData } from '../src/utils/seed.js';
import { similaritySearch } from '../src/services/rag/vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blindDataPath = path.join(__dirname, '../data/blind_test_set_20.json');
const dataset = JSON.parse(fs.readFileSync(blindDataPath, 'utf-8'));

async function evaluateMode(modeName, label, candidatePoolSize = 8) {
  let hitsAt1 = 0;
  let hitsAt4 = 0;
  let sumRR = 0;

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const results = await similaritySearch(item.query, 4, {
      userRole: item.requiredRole || 'Employee',
      mode: modeName,
      candidatePoolSize
    });

    let rankFound = -1;
    for (let r = 0; r < results.length; r++) {
      if (results[r].documentTitle === item.targetDocTitle) {
        rankFound = r + 1;
        break;
      }
    }

    if (rankFound === 1) hitsAt1++;
    if (rankFound >= 1 && rankFound <= 4) {
      hitsAt4++;
      sumRR += 1 / rankFound;
    }
  }

  const n = dataset.length;
  return {
    architecture: label,
    'Recall@1': `${hitsAt1}/${n} (${((hitsAt1 / n) * 100).toFixed(0)}%)`,
    'Recall@4': `${hitsAt4}/${n} (${((hitsAt4 / n) * 100).toFixed(0)}%)`,
    mrr: (sumRR / n).toFixed(3)
  };
}

async function run() {
  console.log(`🔄 Seeding in-memory corpus...`);
  await seedInitialData();
  const totalChunks = memoryStore.documentChunks.length;
  console.log(`✅ Loaded ${totalChunks} chunks in corpus.\n`);

  console.log(`========================================================================`);
  console.log(`🛡️ COMPLETE ABLATION ON BLIND-20 (N = 20 Unseen Queries, 302 Chunks)`);
  console.log(`========================================================================`);

  // 1. BM25 Lexical Only
  const bm25 = await evaluateMode('bm25_only', '1. BM25 Lexical Only');

  // 2. Dense Vector Only (BGE)
  const dense = await evaluateMode('vector_only', '2. Dense Vector Only (BGE-small)');

  // 3. Hybrid RRF (BGE + BM25)
  const hybrid = await evaluateMode('hybrid_rrf', '3. Hybrid RRF (BGE + BM25)');

  // 4. Hybrid RRF + Cross-Encoder Reranker (MiniLM, k=8)
  const rerank = await evaluateMode('hybrid_rerank', '4. Hybrid RRF + MiniLM Reranker (k=8)');

  console.table([bm25, dense, hybrid, rerank]);
}

run().catch(console.error);