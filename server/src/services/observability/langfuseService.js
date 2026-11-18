/**
 * Enterprise Observability & Tracing via Langfuse (OpenTelemetry Protocol)
 * Provides end-to-end tracing across Guardrails, Hybrid Retrieval, Reranking, and LLM Generation
 * using the modern Langfuse OpenTelemetry ingestion API (POST /api/public/otel/v1/traces).
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const publicKey = (process.env.LANGFUSE_PUBLIC_KEY || '').replace(/^["']|["']$/g, '').trim();
const secretKey = (process.env.LANGFUSE_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();
const baseUrl = (process.env.LANGFUSE_BASE_URL || 'https://us.cloud.langfuse.com').replace(/^["']|["']$/g, '').trim();

const isConfigured = Boolean(publicKey && secretKey);

if (isConfigured) {
  console.log('🔭 Langfuse OpenTelemetry client active (Host:', baseUrl, ')');
} else {
  console.log('ℹ️ Langfuse keys not configured; running in passive logging mode.');
}

/**
 * Record a full multi-stage RAG query trace via OpenTelemetry
 */
export async function recordRagTrace({
  question,
  userContext = {},
  retrievalMode = 'rewrite_hybrid_rerank',
  guardrailCheck = {},
  relevantChunks = [],
  userPrompt = '',
  rawAnswer = '',
  finalAnswer = '',
  stageTimings = {},
  confidenceScore = 1.0,
  toolData = null
}) {
  const traceId = crypto.randomBytes(16).toString('hex');

  if (!isConfigured) {
    return `local_trace_${traceId}`;
  }

  try {
    const userRole = userContext.role || 'Employee';
    const userId = userContext.email || userContext.id || 'anonymous_user';

    const rootSpanId = crypto.randomBytes(8).toString('hex');
    const guardSpanId = crypto.randomBytes(8).toString('hex');
    const retSpanId = crypto.randomBytes(8).toString('hex');
    const genSpanId = crypto.randomBytes(8).toString('hex');

    const startNano = BigInt(Date.now()) * 1000000n;
    const guardEndNano = startNano + BigInt(Math.max(1, stageTimings.guardrailMs || 10)) * 1000000n;
    const retEndNano = guardEndNano + BigInt(Math.max(1, stageTimings.retrievalMs || 20)) * 1000000n;
    const genEndNano = retEndNano + BigInt(Math.max(1, stageTimings.generationMs || 250)) * 1000000n;

    const spans = [
      // 1. Root Pipeline Span
      {
        traceId,
        spanId: rootSpanId,
        name: 'HR_RAG_Pipeline',
        kind: 1, // INTERNAL
        startTimeUnixNano: startNano.toString(),
        endTimeUnixNano: genEndNano.toString(),
        attributes: [
          { key: 'user.id', value: { stringValue: userId } },
          { key: 'input.value', value: { stringValue: question } },
          { key: 'output.value', value: { stringValue: finalAnswer || '' } },
          { key: 'metadata.userRole', value: { stringValue: userRole } },
          { key: 'metadata.retrievalMode', value: { stringValue: retrievalMode } },
          { key: 'metadata.confidenceScore', value: { doubleValue: Number(confidenceScore) || 0.95 } },
          {
            key: 'langfuse.tags',
            value: {
              arrayValue: {
                values: [
                  { stringValue: userRole },
                  { stringValue: retrievalMode },
                  { stringValue: guardrailCheck.passed ? 'PASSED_GUARDRAIL' : 'BLOCKED_GUARDRAIL' }
                ]
              }
            }
          }
        ]
      },
      // 2. Span: Guardrails
      {
        traceId,
        spanId: guardSpanId,
        parentSpanId: rootSpanId,
        name: 'Input Guardrail & Threat Defense',
        kind: 1,
        startTimeUnixNano: startNano.toString(),
        endTimeUnixNano: guardEndNano.toString(),
        attributes: [
          { key: 'input.value', value: { stringValue: question } },
          {
            key: 'output.value',
            value: {
              stringValue: JSON.stringify({
                passed: guardrailCheck.passed !== false,
                reason: guardrailCheck.reason || 'SAFE'
              })
            }
          }
        ]
      }
    ];

    // 3. Span: Retrieval
    if (relevantChunks.length > 0 || !guardrailCheck.passed) {
      spans.push({
        traceId,
        spanId: retSpanId,
        parentSpanId: rootSpanId,
        name: 'RBAC Hybrid Retrieval & Reranker',
        kind: 1,
        startTimeUnixNano: guardEndNano.toString(),
        endTimeUnixNano: retEndNano.toString(),
        attributes: [
          { key: 'input.value', value: { stringValue: guardrailCheck.sanitizedQuery || question } },
          { key: 'output.value', value: { stringValue: `Retrieved ${relevantChunks.length} chunks` } },
          { key: 'retrieval.chunksCount', value: { intValue: relevantChunks.length } }
        ]
      });
    }

    // 4. Span: Groq Generation
    if (rawAnswer && !guardrailCheck.blocked) {
      spans.push({
        traceId,
        spanId: genSpanId,
        parentSpanId: rootSpanId,
        name: 'Groq Frontier 120B Generation',
        kind: 3, // CLIENT
        startTimeUnixNano: retEndNano.toString(),
        endTimeUnixNano: genEndNano.toString(),
        attributes: [
          { key: 'gen_ai.system', value: { stringValue: 'groq' } },
          { key: 'gen_ai.request.model', value: { stringValue: 'openai/gpt-oss-120b' } },
          { key: 'input.value', value: { stringValue: userPrompt || question } },
          { key: 'output.value', value: { stringValue: rawAnswer } }
        ]
      });
    }

    const otelPayload = {
      resourceSpans: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'people-ai-rag' } }
            ]
          },
          scopeSpans: [
            {
              scope: { name: 'HR_RAG_Pipeline' },
              spans
            }
          ]
        }
      ]
    };

    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');

    // Send asynchronously to OpenTelemetry ingestion
    fetch(`${baseUrl}/api/public/otel/v1/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(otelPayload)
    }).catch((err) => {
      console.warn('Langfuse OTel delivery warning:', err.message);
    });

    return traceId;
  } catch (err) {
    console.warn('Failed to record Langfuse OTel trace:', err.message);
    return `local_trace_${Date.now()}`;
  }
}

/**
 * Record User Feedback (Thumbs up / down score) on a Trace
 */
export async function recordTraceFeedback({ traceId, value, reason, comment }) {
  if (!isConfigured || !traceId || traceId.startsWith('local_trace_')) {
    return false;
  }

  try {
    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
    const numericScore = value === 'positive' || value === 1 ? 1 : 0;

    await fetch(`${baseUrl}/api/public/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        traceId,
        name: 'user_feedback',
        value: numericScore,
        comment: comment || reason || (numericScore === 1 ? 'Helpful answer' : 'Unhelpful answer')
      })
    }).catch(() => {});

    return true;
  } catch (err) {
    console.warn('Failed to record Langfuse feedback score:', err.message);
    return false;
  }
}

export default { recordRagTrace, recordTraceFeedback };
