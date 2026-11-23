import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { memoryStore } from '../src/config/db.js';
import { seedInitialData } from '../src/utils/seed.js';
import { similaritySearch } from '../src/services/rag/vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devPath = path.join(__dirname, '../data/paraphrase_test_set_30.json');
const blindPath = path.join(__dirname, '../data/blind_test_set_20.json');

const devSet = JSON.parse(fs.readFileSync(devPath, 'utf-8'));
const blindSet = JSON.parse(fs.readFileSync(blindPath, 'utf-8'));
const combinedSet = [...devSet, ...blindSet];

async function evaluateDataset(dataset, modeName, label, candidatePoolSize = 8) {
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
    MRR: (sumRR / n).toFixed(3)
  };
}

async function run() {
  console.log(`🔄 Seeding in-memory corpus...`);
  await seedInitialData();
  const totalChunks = memoryStore.documentChunks.length;
  console.log(`✅ Loaded ${totalChunks} chunks in corpus.\n`);

  console.log(`========================================================================`);
  console.log(`📊 COMBINED EVALUATION: COMBINED-50 (N = 50 Queries, 302 Chunks)`);
  console.log(`========================================================================`);

  const modes = [
    { mode: 'bm25_only', label: '1. BM25 Lexical Only' },
    { mode: 'vector_only', label: '2. Dense Vector (BGE-small)' },
    { mode: 'hybrid_rrf', label: '3. Hybrid RRF (BGE + BM25)' },
    { mode: 'hybrid_rerank', label: '4. Hybrid RRF + MiniLM (k=8)' }
  ];

  const results = [];
  for (const m of modes) {
    results.push(await evaluateDataset(combinedSet, m.mode, m.label));
  }

  console.table(results);
}

run().catch(console.error);