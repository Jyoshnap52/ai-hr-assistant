// server/scripts/test_cross_encoder_sanity.js
import { AutoTokenizer, AutoModelForSequenceClassification } from '@huggingface/transformers';

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

async function testCrossEncoder() {
  const modelId = 'Xenova/ms-marco-MiniLM-L-6-v2';
  console.log(`🔄 Loading Cross-Encoder: ${modelId}...`);
  console.log('(First run will download ~25MB ONNX model weights)\n');

  const tokenizer = await AutoTokenizer.from_pretrained(modelId);
  const model = await AutoModelForSequenceClassification.from_pretrained(modelId);

  const query = 'How many vacation days do full-time staff receive?';

  const candidates = [
    {
      title: 'Paid Leave & Time Off Policy',
      text: 'Full-time employees receive 18 paid leaves per calendar year, accrued monthly at 1.5 days per month.'
    },
    {
      title: 'Employee Handbook - General Hours',
      text: 'Core business working hours are 9:00 AM to 5:00 PM EST. Employees may work remotely up to 3 days per week.'
    },
    {
      title: 'Cloud Infrastructure Policy',
      text: 'Production servers undergo scheduled weekly database maintenance and security audits every Sunday night.'
    }
  ];

  console.log(`📌 Query: "${query}"\n`);

  for (const doc of candidates) {
    // Cross-encoder inputs: Query paired directly with Document text!
    const inputs = await tokenizer(query, {
      text_pair: doc.text,
      padding: true,
      truncation: true
    });

    const output = await model(inputs);
    const rawLogit = output.logits.data[0];
    const relevanceScore = sigmoid(rawLogit);

    console.log(`📄 [${doc.title}]`);
    console.log(`   Relevance Score: ${relevanceScore.toFixed(4)} (Logit: ${rawLogit.toFixed(2)})`);
  }
}

testCrossEncoder().catch(console.error);