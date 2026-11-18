/**
 * Enterprise Ragas & LLM-as-a-Judge Evaluation Suite
 * Evaluates generation quality, faithfulness, answer correctness, and citation accuracy.
 */

import { tokenize } from '../rag/bm25.js';
import { getGroqCompletion } from '../ai/groqService.js';

/**
 * Metric 0: Live Neural LLM-as-a-Judge Evaluation (Ragas Framework)
 * Uses Groq's 120B/20B model as an impartial judge to score Faithfulness and Correctness with reasoning.
 */
export async function evaluateWithLLMJudge(question, retrievedChunks, generatedAnswer, groundTruth) {
  try {
    const fullContext = (retrievedChunks || []).map((c) => c.content).join('\n---\n').slice(0, 1500);

    const systemPrompt = `You are a strict RAG Generation Quality Judge following the RAGAS evaluation standard. Respond ONLY with valid JSON in this exact structure:
{"faithfulness": 0.95, "answerCorrectness": 0.92, "reasoning": "concise explanation of ratings"}`;

    const userPrompt = `User Question: "${question}"

Retrieved Context Chunks:
${fullContext}

Generated Answer to Evaluate:
${generatedAnswer}

Reference Ground Truth Answer:
${groundTruth}

Evaluate the generated answer on a strict scale from 0.00 to 1.00:
1. Faithfulness (0.00 to 1.00): Is every factual claim and numerical figure in the generated answer strictly entailed by the Retrieved Context? (If safe refusal due to lack of context or clearance, rate 1.00).
2. Answer Correctness (0.00 to 1.00): How factually accurate and complete is the answer compared to the Reference Ground Truth?
Output only JSON.`;

    const raw = await getGroqCompletion(systemPrompt, userPrompt, 'openai/gpt-oss-120b');
    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (typeof parsed.faithfulness === 'number' && typeof parsed.answerCorrectness === 'number') {
        return {
          judge: 'Live Groq LLM-as-a-Judge (openai/gpt-oss-120b)',
          faithfulness: Number(parsed.faithfulness.toFixed(3)),
          answerCorrectness: Number(parsed.answerCorrectness.toFixed(3)),
          reasoning: parsed.reasoning || 'Evaluated via live frontier model judge'
        };
      }
    }
  } catch (err) {
    console.warn('Live LLM Judge fallback triggered:', err.message);
  }

  // Fallback to deterministic token/claim evaluator
  const faithfulness = calculateFaithfulness(generatedAnswer, retrievedChunks);
  const answerCorrectness = calculateAnswerCorrectness(generatedAnswer, groundTruth);
  return {
    judge: 'Deterministic Token Entailment Scorer',
    faithfulness,
    answerCorrectness,
    reasoning: 'Evaluated via token entailment and keyword alignment'
  };
}

/**
 * Metric 1: Faithfulness (Is every factual claim supported by the retrieved text?)
 * Evaluates whether factual claims in generated answer are entailed by the retrieved chunks.
 */
export function calculateFaithfulness(answer, retrievedChunks) {
  if (!answer || answer.trim().length === 0) return 1.0;

  const ansLower = answer.toLowerCase();

  // If answer is a safe boundary or refusal response, it has zero ungrounded claims
  if (
    ansLower.includes('restricted') ||
    ansLower.includes('couldn’t find') ||
    ansLower.includes('could not find') ||
    ansLower.includes('not accessible') ||
    ansLower.includes('security alert')
  ) {
    return 1.0;
  }

  if (!retrievedChunks || retrievedChunks.length === 0) {
    return 0.1;
  }

  // Concatenate all retrieved context
  const fullContext = retrievedChunks.map((c) => c.content).join(' ').toLowerCase();

  // Extract substantive factual sentences (filter out conversational scaffolding & headers & citation footers)
  const lines = answer
    .split(/\n+/)
    .map((l) => l.replace(/^[#*\-\s]+/, '').trim())
    .filter(
      (l) =>
        l.length > 20 &&
        !l.toLowerCase().startsWith('source:') &&
        !l.toLowerCase().includes('(source:') &&
        !l.toLowerCase().includes('source: paid leave') &&
        !l.toLowerCase().includes('source: medical') &&
        !l.toLowerCase().includes('source: employee handbook') &&
        !l.toLowerCase().includes('source: manager') &&
        !l.toLowerCase().includes('source: executive') &&
        !l.toLowerCase().includes('source: confidential') &&
        !l.toLowerCase().startsWith('according to') &&
        !l.toLowerCase().startsWith('here are') &&
        !l.toLowerCase().startsWith('based on')
    );

  if (lines.length === 0) return 1.0;

  let supportedClaims = 0;

  for (const line of lines) {
    const claimTokens = tokenize(line);
    if (claimTokens.length === 0) {
      supportedClaims++;
      continue;
    }

    // Check token overlap in retrieved context
    let matched = 0;
    for (const token of claimTokens) {
      if (fullContext.includes(token)) {
        matched++;
      }
    }
    const overlap = matched / claimTokens.length;

    // Check numbers/quantities
    const numbers = line.match(/\b\d+(\.\d+)?\b/g);
    let numbersSupported = true;
    if (numbers) {
      for (const num of numbers) {
        if (!fullContext.includes(num)) {
          numbersSupported = false;
          break;
        }
      }
    }

    if (overlap >= 0.45 && numbersSupported) {
      supportedClaims++;
    } else if (overlap >= 0.65) {
      supportedClaims++;
    }
  }

  const score = supportedClaims / lines.length;
  return Number(Math.max(0.1, Math.min(1.0, score)).toFixed(3));
}

/**
 * Metric 2: Answer Correctness against Ground Truth Reference
 * Evaluates semantic equivalence and factual keyword alignment.
 */
export function calculateAnswerCorrectness(generatedAnswer, groundTruth, expectedKeywords = []) {
  if (!generatedAnswer || !groundTruth) return 0.5;

  const genLower = generatedAnswer.toLowerCase();
  const truthLower = groundTruth.toLowerCase();

  // 1. Keyword coverage check
  let keywordScore = 1.0;
  if (expectedKeywords && expectedKeywords.length > 0) {
    let matched = 0;
    for (const kw of expectedKeywords) {
      if (genLower.includes(kw.toLowerCase())) {
        matched++;
      }
    }
    keywordScore = matched / expectedKeywords.length;
  }

  // 2. Token overlap with ground truth
  const truthTokens = tokenize(groundTruth);
  let matchedTokens = 0;
  for (const t of truthTokens) {
    if (genLower.includes(t)) {
      matchedTokens++;
    }
  }
  const tokenScore = truthTokens.length > 0 ? matchedTokens / truthTokens.length : 0.8;

  // 3. Number alignment
  const truthNumbers = truthLower.match(/\b\d+(\.\d+)?\b/g) || [];
  let numberScore = 1.0;
  if (truthNumbers.length > 0) {
    let numMatches = 0;
    for (const num of truthNumbers) {
      if (genLower.includes(num)) {
        numMatches++;
      }
    }
    numberScore = numMatches / truthNumbers.length;
  }

  const combined = keywordScore * 0.45 + tokenScore * 0.35 + numberScore * 0.20;
  return Number(Math.min(1.0, Math.max(0.0, combined)).toFixed(3));
}

/**
 * Metric 3: Citation Accuracy
 * Verifies if returned source documents contain the expected authoritative document.
 */
export function calculateCitationAccuracy(sources, expectedDocument) {
  if (!expectedDocument) return 1.0;
  if (!sources || sources.length === 0) return 0.0;

  const hasExpected = sources.some(
    (s) => (s.documentTitle || '').toLowerCase().includes(expectedDocument.toLowerCase())
  );

  return hasExpected ? 1.0 : 0.2;
}

/**
 * Full Generation Quality Evaluator
 */
export function evaluateGenerationQuality(item, ragResult) {
  const faithfulness = calculateFaithfulness(ragResult.answer, ragResult.retrievedChunks);
  const answerCorrectness = calculateAnswerCorrectness(
    ragResult.answer,
    item.ground_truth,
    item.expected_keywords
  );
  const citationAccuracy = calculateCitationAccuracy(ragResult.sources, item.expected_document);

  // Context recall: was the expected document in retrieved chunks?
  const contextRecall = (ragResult.retrievedChunks || []).some((c) =>
    (c.documentTitle || '').toLowerCase().includes((item.expected_document || '').toLowerCase())
  )
    ? 1.0
    : 0.0;

  return {
    questionId: item.id,
    faithfulness,
    answerCorrectness,
    citationAccuracy,
    contextRecall,
    compositeQuality: Number(
      (faithfulness * 0.4 + answerCorrectness * 0.4 + citationAccuracy * 0.2).toFixed(3)
    )
  };
}
