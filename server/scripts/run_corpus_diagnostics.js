import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { memoryStore } from '../src/config/db.js';
import { seedInitialData } from '../src/utils/seed.js';
import { similaritySearch } from '../src/services/rag/vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDiagnostics() {
  console.log('🔄 Seeding in-memory corpus...');
  await seedInitialData();
  const chunks = memoryStore.documentChunks;
  const totalChunks = chunks.length;

  console.log(`\n======================================================`);
  console.log(`🔍 CHECK 1: COUNT UNIQUE CHUNKS (Duplicate Detection)`);
  console.log(`======================================================`);
  const uniqueContents = new Set(chunks.map(c => c.content.trim().toLowerCase()));
  const uniqueTitles = new Set(chunks.map(c => c.documentTitle));

  console.log(`Total Chunks:           ${totalChunks}`);
  console.log(`Unique Chunk Texts:     ${uniqueContents.size}`);
  console.log(`Unique Document Titles: ${uniqueTitles.size}`);
  
  if (uniqueContents.size === totalChunks) {
    console.log(`✅ Clean Corpus: 100% of the ${totalChunks} chunks are distinct text.`);
  } else {
    console.log(`⚠️ Warning: ${totalChunks - uniqueContents.size} duplicate chunks detected!`);
  }

  // Load dataset
  const dataPath = path.join(__dirname, '../data/paraphrase_test_set_30.json');
  const testSet = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`\n======================================================`);
  console.log(`🎲 CHECK 2: RANDOM-SCORE CONTROL (Null Hypothesis)`);
  console.log(`======================================================`);
  console.log(`Shuffling top-8 candidates randomly instead of Cross-Encoder scoring.`);
  console.log(`Expected theoretical Recall@1: ~12.5% (1 in 8 chance)\n`);

  let randomR1 = 0;
  let randomR4 = 0;

  for (let i = 0; i < testSet.length; i++) {
    const item = testSet[i];
    // Retrieve top 8 using hybrid RRF
    const results = await similaritySearch(item.query, 8, {
      userRole: item.requiredRole || 'Employee',
      mode: 'hybrid_rrf'
    });

    // Randomly shuffle the 8 candidates
    const shuffled = [...results].sort(() => Math.random() - 0.5);

    if (shuffled[0]?.documentTitle === item.targetDocTitle) randomR1++;
    const top4Titles = shuffled.slice(0, 4).map(c => c.documentTitle);
    if (top4Titles.includes(item.targetDocTitle)) randomR4++;
  }

  console.log(`Random Control Recall@1: ${((randomR1 / testSet.length) * 100).toFixed(1)}% (${randomR1}/${testSet.length})`);
  console.log(`Random Control Recall@4: ${((randomR4 / testSet.length) * 100).toFixed(1)}% (${randomR4}/${testSet.length})`);

  console.log(`\n======================================================`);
  console.log(`👁️ CHECK 3: READ 5 QUESTIONS BY EYE (Ground Truth Check)`);
  console.log(`======================================================`);

  for (let i = 0; i < 5; i++) {
    const item = testSet[i];
    const results = await similaritySearch(item.query, 4, {
      userRole: item.requiredRole || 'Employee',
      mode: 'hybrid_rerank'
    });

    console.log(`\n------------------------------------------------------`);
    console.log(`[Q${i + 1}] "${item.query}"`);
    console.log(`🎯 Expected Target Document: "${item.targetDocTitle}"`);
    console.log(`Top 3 Retrieved & Reranked Chunks:`);
    results.slice(0, 3).forEach((r, idx) => {
      const isMatch = r.documentTitle === item.targetDocTitle ? '✅ MATCH' : '❌ DISTRACTOR';
      console.log(`  Rank ${idx + 1} [${isMatch}]: [${r.documentTitle}]`);
      console.log(`    "${r.content.slice(0, 100).replace(/\n/g, ' ')}..."`);
    });
  }
}

runDiagnostics().catch(console.error);