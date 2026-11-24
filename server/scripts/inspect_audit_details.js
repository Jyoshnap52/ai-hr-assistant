import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedInitialData } from '../src/utils/seed.js';
import { answerHRQuestion } from '../src/services/rag/ragService.js';
import { getGroqCompletion } from '../src/services/ai/groqService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataset = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/blind_test_set_20.json'), 'utf-8'));

async function inspectRows() {
  await seedInitialData();

  // The 6 indices in question:
  // 4, 13, 16 (Contractor MISSes), 5 (Laptop MISS), and 2, 12 (PIP FAILs)
  const targetIndices = [2, 4, 5, 12, 13, 16];

  for (const idx of targetIndices) {
    const item = dataset[idx];
    console.log(`\n======================================================`);
    console.log(`🔍 [ROW ${idx}] Query: "${item.query}"`);
    console.log(`🎯 Test Label Target: "${item.targetDocTitle}"`);
    console.log(`======================================================`);

    const ragRes = await answerHRQuestion(item.query, 4, { role: item.requiredRole || 'Employee' }, { skipCache: true });

    console.log(`\n📚 Actually Retrieved Chunks:`);
    ragRes.retrievedChunks.forEach((c, i) => {
      console.log(`  [Chunk ${i + 1}] Document: "${c.documentTitle}" | Section: "${c.section}"`);
    });

    console.log(`\n💬 Generated Answer:\n"${ragRes.answer}"\n`);

    // Call Judge with full reasoning
    const systemPrompt = `You are a strict RAG judge. Respond in JSON: {"verdict": "PASS"|"FAIL", "score": 0.0 to 1.0, "fullReasoning": "detailed explanation"}`;
    const userPrompt = `Query: "${item.query}"\nContext: ${ragRes.retrievedChunks.map(c => c.content).join(' ')}\nAnswer: "${ragRes.answer}"\nEvaluate faithfulness. Output JSON only.`;

    const raw = await getGroqCompletion(systemPrompt, userPrompt, 'llama-3.3-70b-versatile');
    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log(`⚖️ Judge Verdict: ${parsed.verdict} (Score: ${parsed.score})`);
      console.log(`📝 Full Judge Reasoning:\n"${parsed.fullReasoning}"`);
    }

    await new Promise(r => setTimeout(r, 600));
  }

  process.exit(0);
}

inspectRows().catch(console.error);