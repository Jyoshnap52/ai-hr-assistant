/**
 * Retrieval Ablation Study Runner
 * Evaluates the 47 enterprise HR benchmark questions across 5 pipeline architectures:
 * 1. Vector-only
 * 2. BM25-only
 * 3. Hybrid (Dense + BM25 with RRF)
 * 4. Hybrid + Reranking
 * 5. Query Rewriting + Hybrid + Reranking (Production Standard)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { answerHRQuestion } from '../rag/ragService.js';
import { evaluateGenerationQuality } from './ragasEvaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runAblationStudy(options = {}) {
  const datasetPath = path.join(__dirname, '../../../data/eval_dataset_47.json');
  let dataset = [];

  try {
    const raw = fs.readFileSync(datasetPath, 'utf8');
    dataset = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load eval dataset:', err.message);
    return { error: 'Dataset not found' };
  }

  const limit = options.limitQuestions || dataset.length;
  const testSlice = dataset.slice(0, limit);

  const architectures = [
    { mode: 'vector_only', label: '1. Dense Vector Only' },
    { mode: 'bm25_only', label: '2. BM25 Lexical Only' },
    { mode: 'hybrid_rrf', label: '3. Hybrid (Dense + BM25 RRF)' },
    { mode: 'hybrid_rerank', label: '4. Hybrid + Reranking' },
    { mode: 'rewrite_hybrid_rerank', label: '5. Query Rewrite + Hybrid + Rerank (Production)' }
  ];

  const resultsTable = [];

  for (const arch of architectures) {
    console.log(`  Evaluating [${arch.label}] on ${testSlice.length} questions...`);
    let totalRecallAt4 = 0;
    let totalMRR = 0;
    let totalFaithfulness = 0;
    let totalCorrectness = 0;
    let totalLatencyMs = 0;

    for (const item of testSlice) {
      const startTime = Date.now();
      const userContext = { role: item.required_role || 'Employee' };

      const ragResult = await answerHRQuestion(item.question, 4, userContext, {
        retrievalMode: arch.mode,
        skipLLM: true,
        skipNeuralGuard: true
      });

      const elapsed = Date.now() - startTime;
      totalLatencyMs += elapsed;

      // Check Recall@4 and MRR
      const chunks = ragResult.retrievedChunks || [];
      const expectedDoc = (item.expected_document || '').toLowerCase();

      let rank = 0;
      for (let i = 0; i < chunks.length; i++) {
        if ((chunks[i].documentTitle || '').toLowerCase().includes(expectedDoc)) {
          rank = i + 1;
          break;
        }
      }

      if (rank > 0 && rank <= 4) {
        totalRecallAt4++;
        totalMRR += 1 / rank;
      }

      const evalScores = evaluateGenerationQuality(item, ragResult);
      totalFaithfulness += evalScores.faithfulness;
      totalCorrectness += evalScores.answerCorrectness;
    }

    const N = testSlice.length;
    resultsTable.push({
      architecture: arch.label,
      mode: arch.mode,
      recallAt4: Number((totalRecallAt4 / N).toFixed(3)),
      mrr: Number((totalMRR / N).toFixed(3)),
      faithfulness: Number((totalFaithfulness / N).toFixed(3)),
      answerCorrectness: Number((totalCorrectness / N).toFixed(3)),
      avgLatencyMs: Math.round(totalLatencyMs / N)
    });
  }

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalBenchmarkQuestions: dataset.length,
      totalTested: testSlice.length
    },
    table: resultsTable
  };
}

/**
 * Format ablation results as clean Markdown table for README & reports
 */
export function formatAblationMarkdown(table) {
  let md = '| Retrieval Architecture | Recall@4 | MRR | Faithfulness | Correctness | Latency (ms) |\n';
  md += '| :--- | :---: | :---: | :---: | :---: | :---: |\n';

  for (const row of table) {
    md += `| **${row.architecture}** | **${(row.recallAt4 * 100).toFixed(1)}%** | ${row.mrr} | ${(row.faithfulness * 100).toFixed(1)}% | ${(row.answerCorrectness * 100).toFixed(1)}% | ${row.avgLatencyMs}ms |\n`;
  }

  return md;
}
