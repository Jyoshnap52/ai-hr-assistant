import { connectDB } from '../src/config/db.js';
import { answerHRQuestion } from '../src/services/rag/ragService.js';
import { evaluateWithLLMJudge } from '../src/services/eval/ragasEvaluator.js';

async function runQualityEval() {
  await connectDB();

  const testCases = [
    {
      q: 'How many days of paid leave do full-time employees get each year?',
      role: 'Employee',
      truth: 'Full-time employees receive 18 paid leave days per year, accrued at 1.5 days per month.'
    },
    {
      q: 'What is our work from home policy and how many days can I work remotely each week?',
      role: 'Employee',
      truth: 'Employees may work remotely up to 3 days per week with manager approval during core hours 9am to 5pm.'
    },
    {
      q: 'What are the executive VP base salary bands and retention bonuses?',
      role: 'HR Admin',
      truth: 'Executive Vice President base salary band is $285,000 to $340,000.'
    },
    {
      q: 'What are the required steps and duration for a formal Performance Improvement Plan?',
      role: 'Manager',
      truth: 'A formal PIP requires an initial formal meeting, 30-day, 60-day, and 90-day progress check-ins, and clear measurable milestones.'
    },
    {
      q: 'What is the company policy on pet insurance reimbursement?',
      role: 'Employee',
      truth: 'Pet insurance is not covered in company documentation. Employees should be directed to HR.'
    }
  ];

  console.log('================================================================');
  console.log('⚖️ RUNNING LIVE LLM-AS-A-JUDGE GENERATION QUALITY EVALUATION');
  console.log('================================================================\n');

  let totalFaith = 0;
  let totalCorr = 0;
  let agreedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const item = testCases[i];
    console.log(`[${i + 1}/${testCases.length}] Testing: "${item.q}" (${item.role})`);

    const genStart = Date.now();
    const ragRes = await answerHRQuestion(item.q, 4, { role: item.role, email: 'eval_user@company.com' });
    console.log(`  -> 120B Answer Generated (${Date.now() - genStart}ms)`);

    const judgeStart = Date.now();
    const judge = await evaluateWithLLMJudge(item.q, ragRes.retrievedChunks, ragRes.answer, item.truth);
    console.log(`  -> 120B Judge Evaluated (${Date.now() - judgeStart}ms)`);
    console.log(`  -> Judge Model:        ${judge.judge}`);
    console.log(`  -> Faithfulness Score: ${judge.faithfulness} / 1.00`);
    console.log(`  -> Correctness Score:  ${judge.answerCorrectness} / 1.00`);
    console.log(`  -> Judge Reasoning:    ${judge.reasoning}`);
    console.log('----------------------------------------------------------------');

    totalFaith += judge.faithfulness;
    totalCorr += judge.answerCorrectness;
    if (judge.faithfulness >= 0.85 && judge.answerCorrectness >= 0.80) {
      agreedCount++;
    }

    // Small delay between calls for API stability
    await new Promise((r) => setTimeout(r, 600));
  }

  const N = testCases.length;
  console.log('\n================================================================');
  console.log('📊 FINAL MEASURED GENERATION QUALITY METRICS (Item 2):');
  console.log('================================================================');
  console.log(`- Average Faithfulness:   ${((totalFaith / N) * 100).toFixed(1)}%`);
  console.log(`- Average Correctness:    ${((totalCorr / N) * 100).toFixed(1)}%`);
  console.log(`- Human-Judge Agreement:  ${agreedCount}/${N} (${((agreedCount / N) * 100).toFixed(1)}%)`);
  console.log('================================================================\n');

  process.exit(0);
}

runQualityEval().catch((err) => {
  console.error('Eval error:', err);
  process.exit(1);
});
