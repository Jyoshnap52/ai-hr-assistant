# 🏢 AI HR Assistant (Enterprise RAG Platform)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-blue?style=flat&logo=vercel)](https://ai-hr-assistant-smoky.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://ai-hr-assistant-backend-bmwp.onrender.com)
[![Embeddings](https://img.shields.io/badge/Embeddings-BGE--small--en-orange?style=flat&logo=huggingface)](https://huggingface.co/BAAI/bge-small-en-v1.5)
[![Reranker](https://img.shields.io/badge/Reranker-MS--MARCO--MiniLM-yellow?style=flat&logo=huggingface)](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, privacy-first **Retrieval-Augmented Generation (RAG)** platform designed for internal human resources. Features **Role-Based Access Control (RBAC)**, a 2-stage neural retrieval pipeline (**BGE embeddings + BM25 + Reciprocal Rank Fusion + Cross-Encoder Reranking**), hallucination guardrails, and real-time streaming answers.

---

## ⚡ Live Deployments

- **Frontend Application**: [https://ai-hr-assistant-smoky.vercel.app](https://ai-hr-assistant-smoky.vercel.app)
- **Backend API**: [https://ai-hr-assistant-backend-bmwp.onrender.com](https://ai-hr-assistant-backend-bmwp.onrender.com)

---

## 🏗️ System Architecture

```
User Query
   │
   ▼
[ Security Guardrails ] ────► Prompt Injection & Out-of-Domain Filter
   │
   ▼
[ RBAC Pre-Filtering ]  ────► Enforce role access (Employee / Manager / HR Admin)
   │
   ├───► Dense Vector Search (BGE-small-en-v1.5, 384-dim, ONNX CPU)
   │
   └───► Sparse Lexical Search (BM25 token frequency)
         │
         ▼
[ Reciprocal Rank Fusion (RRF) ] ──► Blends dense + sparse into top 8 candidates
         │
         ▼
[ Neural Cross-Encoder Rerank ]  ──► ms-marco-MiniLM-L-6-v2 joint cross-attention
         │
         ▼
[ Context Assembler ] ────────────► Top 4 verified policy chunks + citations
         │
         ▼
[ LLM Generation (Groq / Llama) ] ─► Grounded answer with source document links
```

---

## ✨ Key Features

- **2-Stage Neural Retrieval**:
  - **Stage 1 (Hybrid)**: Dense semantic vectors (`Xenova/bge-small-en-v1.5`) combined with BM25 lexical search via Reciprocal Rank Fusion ($k=60$).
  - **Stage 2 (Reranker)**: Lightweight neural cross-encoder (`Xenova/ms-marco-MiniLM-L-6-v2`) performs token-to-token cross-attention to eliminate false-positive candidates in ~20ms.
- **Strict Role-Based Access Control (RBAC)**:
  - 3 permission tiers: `Employee`, `Manager`, `HR Admin`.
  - Documents are pre-filtered before vector search, mathematically preventing unauthorized policy leakage.
- **Enterprise Guardrails**:
  - Pre-retrieval prompt injection and jailbreak detection.
  - Out-of-domain query classification.
  - Source citation verification to minimize hallucination.
- **Dual Storage Support**:
  - In-memory vector store with cosine similarity for sub-second startup and self-contained testing.
  - MongoDB Atlas Vector Search support for production persistence.

---

## 🔬 Empirical Retrieval Evaluation

The retrieval pipeline was benchmarked against an expanded **302-chunk enterprise corpus** across 72 policy documents, testing performance on realistic conversational paraphrases and domain distractors.

### 1. Headline Generalization: Blind-20 (Unseen Queries)
*Tested on 20 completely unseen queries with locked hyperparameters ($k_{\text{pool}}=8$, MiniLM):*

| Architecture | Recall@1 | Recall@4 | MRR | p50 Latency |
| :--- | :---: | :---: | :---: | :---: |
| **BM25 Lexical Only** | 20% (4/20) | 60% (12/20) | 0.371 | 2.8 ms |
| **Dense Vector (BGE-small)** | 50% (10/20) | 85% (17/20) | 0.667 | 11.4 ms |
| **Hybrid RRF (BGE + BM25)** | 35% (7/20) | 80% (16/20) | 0.533 | 13.9 ms |
| **Hybrid RRF + MiniLM Reranker ($k=8$)** | **45% (9/20)** | **85% (17/20)** | **0.625** | **27.8 ms** |

> **Analysis**: On colloquial phrasing, dense retrieval matches the full pipeline at 85% Recall@4. Equal-weight RRF fusion is vulnerable when BM25 struggles with conversational phrasing (20% R@1), but the Cross-Encoder successfully rescues candidate ranks (+10% R@1 over raw Hybrid).

---

### 2. Aggregate Benchmark: Combined-50 (N = 50 Queries, 302 Chunks)
*Combining development and blind test sets for higher statistical power:*

| Architecture | Recall@1 | Recall@4 | MRR | Key Insight |
| :--- | :---: | :---: | :---: | :--- |
| **BM25 Lexical Only** | 34% (17/50) | 68% (34/50) | 0.473 | Keyword matching fails on natural human paraphrasing. |
| **Dense Vector (BGE-small)** | 50% (25/50) | 82% (41/50) | 0.650 | Consistent semantic baseline across all test splits. |
| **Hybrid RRF (BGE + BM25)** | 42% (21/50) | 80% (40/50) | 0.573 | Equal-weight fusion allows weak BM25 hits to dilute candidates. |
| **Hybrid RRF + MiniLM ($k=8$)** | **54% (27/50)** | **90% (45/50)** | **0.697** | **Best overall accuracy**; rescues hybrid pool to 90% Recall@4. |

---

### 3. Production Architecture Decision
- **Default Pipeline**: **Hybrid RRF + MiniLM Cross-Encoder ($k_{\text{pool}} = 8$)**
- **Rationale**: Achieves the highest overall accuracy (**90% Recall@4**, **0.697 MRR**) at negligible CPU latency (**~28ms p50**). Retains BM25 coverage for exact policy codes, acronyms, and section numbers, while the cross-encoder ensures conversational questions are not diluted.

---

## 🛡️ Role-Based Access Control (RBAC) & Security Audit

The system enforces **Pre-Retrieval Role Filtering**: chunks are partitioned by permission tier (`Employee`, `Manager`, `HR Admin`) before vector indexing and BM25 tokenization occur. Unauthorized documents do not exist in the search space for a restricted user's query.

### Adversarial Security Benchmark (302-Chunk Corpus)
Evaluated across two distinct probe sets to verify pre-retrieval containment:

| Audit Phase | Corpus Size | Probe Suite | Candidate Leaks | Containment Rate | Root Cause & Resolution |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Initial Audit (Before)** | 302 chunks | **15 Baseline Probes** | 9 leaks | 40.0% (6/15) | **Metadata Tag Mismatch**: Newly ingested documents used `allowedRoles` instead of `accessRoles`, triggering a fallback in `addChunksToVectorStore` that defaulted missing tags to public access. |
| **Hardened Audit (After)** | 302 chunks | **25 Total Probes**<br>*(15 baseline + 10 fresh indirect)* | **0 leaks** | **100.0% (25/25)** | **Defensive Architecture**: Unified role mapping (`accessRoles \|\| allowedRoles`), verified dual BM25/Dense filtering parity, and added a fail-fast startup guard that aborts boot if any chunk lacks an explicit role tag. Verified on 10 fresh indirect probes written after the fix with zero tuning. |

> **Audit Integrity Note**: The 10 fresh indirect probes were authored strictly *after* the ingestion fix was deployed and executed blindly on the first run with zero code modifications. The pre-retrieval filter structurally eliminates non-eligible chunks at the database query level, preventing leakage regardless of phrasing.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js (ESM), Express.js |
| **Embeddings** | Hugging Face `@huggingface/transformers` (`Xenova/bge-small-en-v1.5`, 384 dims) |
| **Reranker** | Cross-Encoder (`Xenova/ms-marco-MiniLM-L-6-v2`) via ONNX Runtime CPU |
| **LLM Inference** | Groq Cloud SDK (`llama-3.3-70b-versatile` / `mixtral-8x7b-32768`) |
| **Database** | MongoDB Atlas / In-Memory Mock Store with Cosine Similarity |
| **Deployment** | Vercel (Client), Render (API Server) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- A free API key from [Groq Console](https://console.groq.com)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JyoshnaP52/ai-hr-assistant.git
   cd ai-hr-assistant
   ```

2. **Setup Backend**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Add your GROQ_API_KEY inside server/.env
   ```

3. **Setup Frontend**:
   ```bash
   cd ../client
   npm install
   ```

4. **Run Locally**:
   ```bash
   # In terminal 1 (Backend - http://localhost:5001):
   cd server && npm run dev

   # In terminal 2 (Frontend - http://localhost:5173):
   cd client && npm run dev
   ```

---

## 🧪 Running Evaluations

All benchmarks can be executed locally on CPU with zero external API dependencies:

```bash
cd server

# Run the 5-stage architecture ablation on Dev-30:
node scripts/run_embedding_comparison.js

# Run the candidate pool size sweep (k = 8, 15, 25, 40):
node scripts/sweep_candidate_pool.js

# Run the held-out blind evaluation (Blind-20):
node scripts/run_blind_ablation.js

# Run the full 50-query combined benchmark:
node scripts/run_combined_evaluation.js
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
