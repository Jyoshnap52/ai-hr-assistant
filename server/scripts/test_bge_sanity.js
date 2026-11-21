// server/scripts/test_bge_sanity.js
import { pipeline } from '@huggingface/transformers';

function vectorNorm(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  return Math.sqrt(sum);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot / (vectorNorm(a) * vectorNorm(b));
}

async function run() {
  console.log('🔄 Loading Xenova/all-MiniLM-L6-v2...');
  const extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
  console.log('\n--- TEST 1: Direct Concept Match ---');
  const query1 = 'vacation policy';
  const targetA1 = 'paid time off';
  const targetB1 = 'server maintenance';

  const q1 = await extractor(query1, { pooling: 'mean', normalize: true });
  const a1 = await extractor(targetA1, { pooling: 'mean', normalize: true });
  const b1 = await extractor(targetB1, { pooling: 'mean', normalize: true });

  const simA1 = cosineSimilarity(Array.from(q1.data), Array.from(a1.data));
  const simB1 = cosineSimilarity(Array.from(q1.data), Array.from(b1.data));

  console.log(`Query: "${query1}"`);
  console.log(`Doc A ("${targetA1}"):      ${simA1.toFixed(4)}`);
  console.log(`Doc B ("${targetB1}"): ${simB1.toFixed(4)}`);
  console.log(`Margin (A - B):                 ${(simA1 - simB1).toFixed(4)}`);
  console.log(simA1 > simB1 ? '✅ PASSED' : '❌ FAILED');

  console.log('\n--- TEST 2: Realistic HR Policy Sentences ---');
  const query2 = 'How many vacation days do I get?';
  const targetA2 = 'Employees are entitled to 18 days of annual paid time off and leave.';
  const targetB2 = 'All production servers undergo weekly security patches and database backup.';

  const q2 = await extractor(query2, { pooling: 'mean', normalize: true });
  const a2 = await extractor(targetA2, { pooling: 'mean', normalize: true });
  const b2 = await extractor(targetB2, { pooling: 'mean', normalize: true });

  const simA2 = cosineSimilarity(Array.from(q2.data), Array.from(a2.data));
  const simB2 = cosineSimilarity(Array.from(q2.data), Array.from(b2.data));

  console.log(`Query: "${query2}"`);
  console.log(`Doc A (Leave Policy):       ${simA2.toFixed(4)}`);
  console.log(`Doc B (Server Ops):         ${simB2.toFixed(4)}`);
  console.log(`Margin (A - B):             ${(simA2 - simB2).toFixed(4)}`);
  console.log(simA2 > simB2 ? '✅ PASSED' : '❌ FAILED');
}

run().catch(console.error);