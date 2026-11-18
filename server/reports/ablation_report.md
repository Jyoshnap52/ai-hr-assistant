| Retrieval Architecture | Recall@4 | MRR | Faithfulness | Correctness | Latency (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Dense Vector Only** | **25.5%** | 0.255 | 100.0% | 28.0% | 3ms |
| **2. BM25 Lexical Only** | **100.0%** | 0.989 | 100.0% | 93.5% | 1ms |
| **3. Hybrid (Dense + BM25 RRF)** | **100.0%** | 0.989 | 100.0% | 93.5% | 1ms |
| **4. Hybrid + Reranking** | **100.0%** | 0.95 | 100.0% | 88.0% | 1ms |
| **5. Query Rewrite + Hybrid + Rerank (Production)** | **100.0%** | 0.95 | 100.0% | 88.0% | 1ms |
