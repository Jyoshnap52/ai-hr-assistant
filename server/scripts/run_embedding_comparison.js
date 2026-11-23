// server/scripts/run_embedding_comparison.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedInitialData } from '../src/utils/seed.js';
import { similaritySearch } from '../src/services/rag/vectorStore.js';
import { memoryStore } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const datasetPath = path.join(__dirname, '../data/paraphrase_test_set_30.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

async function evaluateMode(modeName, label) {
  console.log(`\n======================================================`);
  console.log(`🔬 Running Architecture: ${label.toUpperCase()}`);
  console.log(`======================================================`);

  let hitsAt1 = 0;
  let hitsAt4 = 0;
  let sumRR = 0;

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];

    const results = await similaritySearch(item.query, 4, {
      userRole: item.requiredRole || 'Employee',
      mode: modeName
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

    const statusIcon = rankFound === 1 ? '🥇 Rank 1' : rankFound > 1 ? `🥈 Rank ${rankFound}` : '❌ Missed';
    console.log(`[Q${i + 1}/30] ${statusIcon} | "${item.query.slice(0, 50)}..." ➔ Target: ${item.targetDocTitle}`);
  }

  const recallAt1 = ((hitsAt1 / dataset.length) * 100).toFixed(1);
  const recallAt4 = ((hitsAt4 / dataset.length) * 100).toFixed(1);
  const mrr = (sumRR / dataset.length).toFixed(3);

  return {
    architecture: label,
    recallAt1: `${recallAt1}%`,
    recallAt4: `${recallAt4}%`,
    mrr
  };
}

async function run() {
  console.log(`📊 Loaded ${dataset.length} Challenging Semantic Paraphrase Questions.`);
  
  process.env.EMBEDDER = 'bge';
  memoryStore.documentChunks = [];
  console.log('🌱 Seeding document store with Hugging Face BGE embeddings...');
  await seedInitialData();

  // 1. BM25 Lexical Only
  const bm25Results = await evaluateMode('bm25_only', '1. BM25 Lexical Only');

  // 2. Dense Vector Only (BGE)
  const denseResults = await evaluateMode('vector_only', '2. Dense Vector Only (BGE)');

  // 3. Hybrid RRF (BGE + BM25)
  const hybridResults = await evaluateMode('hybrid_rrf', '3. Hybrid RRF (BGE + BM25)');

  // 4. Hybrid RRF + Neural Cross-Encoder Reranker
  const rerankResults = await evaluateMode('hybrid_rerank', '4. Hybrid RRF + Cross-Encoder Rerank');

  // 5. Query Rewrite + Hybrid + Rerank
  const rewriteResults = await evaluateMode('rewrite_hybrid_rerank', '5. Query Rewrite + Hybrid + Rerank');

  // Print Complete Comparison Table
  console.log('\n========================================================================');
  console.log('🏆 COMPLETE 4-STAGE RETRIEVAL ABLATION ON 30 PARAPHRASE QUESTIONS');
  console.log('========================================================================');
  console.table([bm25Results, denseResults, hybridResults, rerankResults, rewriteResults]);
}

run().catch(console.error);