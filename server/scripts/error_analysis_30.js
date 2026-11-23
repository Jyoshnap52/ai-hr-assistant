// server/scripts/error_analysis_30.js
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

async function run() {
  process.env.EMBEDDER = 'bge';
  memoryStore.documentChunks = [];
  console.log('🌱 Seeding document store with Hugging Face BGE embeddings...');
  await seedInitialData();

  console.log('\n======================================================');
  console.log('🔬 1. Running Row 5: Query Rewrite + Hybrid + Rerank');
  console.log('======================================================');

  let hitsAt1 = 0;
  let hitsAt4 = 0;
  let sumRR = 0;
  const missedQuestions = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];

    const results = await similaritySearch(item.query, 4, {
      userRole: item.requiredRole || 'Employee',
      mode: 'rewrite_hybrid_rerank'
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
    } else {
      missedQuestions.push({
        id: item.id,
        index: i + 1,
        query: item.query,
        targetDocTitle: item.targetDocTitle,
        category: item.category,
        retrieved: results.map((r, idx) => ({
          rank: idx + 1,
          title: r.documentTitle,
          score: r.score || r.rerankScore || 0,
          snippet: (r.content || '').slice(0, 100)
        }))
      });
    }
  }

  const recallAt1 = ((hitsAt1 / dataset.length) * 100).toFixed(1);
  const recallAt4 = ((hitsAt4 / dataset.length) * 100).toFixed(1);
  const mrr = (sumRR / dataset.length).toFixed(3);

  console.log(`\n📊 Row 5 Results (Query Rewrite + Hybrid + Rerank):`);
  console.log(`- Recall@1: ${recallAt1}%`);
  console.log(`- Recall@4: ${recallAt4}%`);
  console.log(`- MRR:      ${mrr}`);

  console.log('\n======================================================');
  console.log(`🔍 2. Detailed Error Analysis on the ${missedQuestions.length} Missed Questions`);
  console.log('======================================================');

  missedQuestions.forEach((m) => {
    console.log(`\n❌ [${m.id} - Q${m.index}] "${m.query}"`);
    console.log(`   🎯 Expected Target: "${m.targetDocTitle}" (Category: ${m.category})`);
    console.log(`   📄 What was retrieved in Top 4 instead:`);
    m.retrieved.forEach((r) => {
      console.log(`      [Rank ${r.rank}] "${r.title}" (Score: ${r.score})`);
      console.log(`         Preview: "${r.snippet}..."`);
    });
  });
}

run().catch(console.error);