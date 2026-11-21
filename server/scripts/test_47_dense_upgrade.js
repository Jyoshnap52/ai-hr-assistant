// server/scripts/test_47_dense_upgrade.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedInitialData } from '../src/utils/seed.js';
import { similaritySearch } from '../src/services/rag/vectorStore.js';
import { memoryStore } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const datasetPath = path.join(__dirname, '../data/eval_dataset_47.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

async function run() {
  process.env.EMBEDDER = 'bge';
  memoryStore.documentChunks = [];
  console.log('🌱 Seeding document store with Hugging Face BGE embeddings...');
  await seedInitialData();

  console.log(`\n🔍 Evaluating Dense Vector Search on all 47 Benchmark Questions...`);

  let hitsAt4 = 0;
  let sumRR = 0;

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const results = await similaritySearch(item.question, 4, {
      userRole: 'HR Admin', // Admin has full access across all docs
      mode: 'vector_only'
    });

    let rankFound = -1;
    for (let r = 0; r < results.length; r++) {
      if (results[r].documentTitle === item.expected_document) {
        rankFound = r + 1;
        break;
      }
    }

    if (rankFound >= 1 && rankFound <= 4) {
      hitsAt4++;
      sumRR += 1 / rankFound;
    }
  }

  const recallAt4 = ((hitsAt4 / dataset.length) * 100).toFixed(1);
  const mrr = (sumRR / dataset.length).toFixed(3);

  console.log('\n======================================================');
  console.log('📊 DENSE VECTOR UPGRADE RESULTS (47 BENCHMARK QUESTIONS)');
  console.log('======================================================');
  console.log(`- Old Hashed Vectors Recall@4:  25.5%  (MRR: 0.255)`);
  console.log(`- New Hugging Face BGE Recall@4: ${recallAt4}%  (MRR: ${mrr})`);
  console.log('======================================================\n');
}

run().catch(console.error);
