import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const pk = (process.env.LANGFUSE_PUBLIC_KEY || '').replace(/^["']|["']$/g, '').trim();
const sk = (process.env.LANGFUSE_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();
const host = (process.env.LANGFUSE_BASE_URL || 'https://us.cloud.langfuse.com').replace(/^["']|["']$/g, '').trim();

if (!pk || !sk) {
  console.error('❌ Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY in server/.env');
  process.exit(1);
}

const auth = Buffer.from(`${pk}:${sk}`).toString('base64');
const traceId = crypto.randomBytes(16).toString('hex');
const rootSpanId = crypto.randomBytes(8).toString('hex');
const guardSpanId = crypto.randomBytes(8).toString('hex');
const retSpanId = crypto.randomBytes(8).toString('hex');
const genSpanId = crypto.randomBytes(8).toString('hex');

const startNano = BigInt(Date.now()) * 1000000n;
const guardEndNano = startNano + 15000000n;
const retEndNano = guardEndNano + 25000000n;
const genEndNano = retEndNano + 250000000n;

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
          spans: [
            // Root Pipeline Trace
            {
              traceId,
              spanId: rootSpanId,
              name: 'HR_RAG_Pipeline',
              kind: 1,
              startTimeUnixNano: startNano.toString(),
              endTimeUnixNano: genEndNano.toString(),
              attributes: [
                { key: 'user.id', value: { stringValue: 'david.chen@company.com' } },
                { key: 'input.value', value: { stringValue: 'How many days of paid leave do full-time employees get each year?' } },
                { key: 'output.value', value: { stringValue: 'Full-time employees receive 18 paid leave days per year, which accrue at a rate of 1.5 days each month.' } },
                { key: 'langfuse.tags', value: { arrayValue: { values: [{ stringValue: 'Employee' }, { stringValue: 'rewrite_hybrid_rerank' }, { stringValue: 'PASSED_GUARDRAIL' }] } } },
                { key: 'metadata.userRole', value: { stringValue: 'Employee' } },
                { key: 'metadata.retrievalMode', value: { stringValue: 'rewrite_hybrid_rerank' } },
                { key: 'metadata.confidenceScore', value: { doubleValue: 0.96 } }
              ]
            },
            // Span 1: Guardrail
            {
              traceId,
              spanId: guardSpanId,
              parentSpanId: rootSpanId,
              name: 'Input Guardrail & Threat Defense',
              kind: 1,
              startTimeUnixNano: startNano.toString(),
              endTimeUnixNano: guardEndNano.toString(),
              attributes: [
                { key: 'input.value', value: { stringValue: 'How many days of paid leave do full-time employees get each year?' } },
                { key: 'output.value', value: { stringValue: '{"passed": true, "reason": "SAFE"}' } }
              ]
            },
            // Span 2: Retrieval
            {
              traceId,
              spanId: retSpanId,
              parentSpanId: rootSpanId,
              name: 'RBAC Hybrid Retrieval & Reranker',
              kind: 1,
              startTimeUnixNano: guardEndNano.toString(),
              endTimeUnixNano: retEndNano.toString(),
              attributes: [
                { key: 'input.value', value: { stringValue: 'paid leave policy' } },
                { key: 'output.value', value: { stringValue: 'Retrieved 3 chunks: Paid Leave & Time Off Policy (v3.0)' } },
                { key: 'retrieval.chunksCount', value: { intValue: 3 } }
              ]
            },
            // Span 3: Groq 120B Generation
            {
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
                { key: 'input.value', value: { stringValue: 'Retrieved Context: Full-time employees receive 18 paid leave days...' } },
                { key: 'output.value', value: { stringValue: 'Full-time employees receive 18 paid leave days per year, which accrue at a rate of 1.5 days each month.' } }
              ]
            }
          ]
        }
      ]
    }
  ]
};

console.log('📡 Sending OpenTelemetry Trace to Langfuse US Cloud...');
console.log('Endpoint:', `${host}/api/public/otel/v1/traces`);

try {
  const response = await fetch(`${host}/api/public/otel/v1/traces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify(otelPayload)
  });

  if (response.ok || response.status === 200 || response.status === 201) {
    console.log('🎉 SUCCESS! Trace delivered to Langfuse Cloud via OpenTelemetry!');
    console.log('Trace ID:', traceId);
  } else {
    const errorText = await response.text();
    console.error(`❌ Langfuse returned HTTP ${response.status}:`, errorText);
  }
} catch (err) {
  console.error('❌ Network error sending trace:', err.message);
}
