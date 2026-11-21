// server/scripts/test_vector_search_live.js
import { seedInitialData } from '../src/utils/seed.js';
import { searchVectorStore } from '../src/services/rag/vectorStore.js';

async function testLiveVectorSearch() {
  console.log('🌱 Seeding policy documents with Hugging Face BGE embeddings...');
  await seedInitialData();

  console.log('\n======================================================');
  console.log('🔍 Running Test Query with Pure Vector Search (Dense-Only)');
  console.log('======================================================\n');

  // Notice this query uses words NOT in the document ("vacation days" instead of "paid leaves")
  const query = 'How many vacation days do I get each year?';
  const userContext = { role: 'Employee' };

  console.log(`User Query: "${query}"`);
  console.log('Searching vector store...\n');

  const results = await searchVectorStore(query, 3, userContext);

  console.log('🏆 Top Retrieved Documents:');
  results.forEach((chunk, index) => {
    console.log(`\n[Rank ${index + 1}] (Score: ${chunk.similarity ? chunk.similarity.toFixed(4) : 'N/A'}) - ${chunk.documentTitle}`);
    console.log(`Content Preview: "${chunk.content.slice(0, 150)}..."`);
  });

  if (results.length > 0 && results[0].documentTitle.toLowerCase().includes('leave')) {
    console.log('\n🎉 SUCCESS! Pure dense retrieval ranked the Leave Policy as #1!');
    console.log('   The BGE Hugging Face model successfully bridged "vacation" to "paid leave"!');
  } else {
    console.log('\n⚠️ Rank 1 was not the leave policy. Check results above.');
  }
}

testLiveVectorSearch().catch(console.error);