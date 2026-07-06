# Intelligent Recruiting Assistant - Architecture

## 1. Purpose

Intelligent Recruiting Assistant (IRA) is a full-stack AI agent project for the recruiting workflow.
It is not a single-turn chat demo. The system covers:

- job description parsing
- resume parsing and candidate profiling
- hybrid candidate recall
- RAG-based knowledge retrieval
- screening report generation
- interview feedback summarization
- retrieval evaluation metrics
- frontend console and Docker deployment

This makes the project strong enough for a resume, portfolio, or interview presentation.

---

## 2. High-level architecture

```text
+--------------------------------------------------------------+
|                       Next.js Frontend                       |
| Dashboard / Jobs / Candidates / Knowledge / Screenings/Evals|
+------------------------------+-------------------------------+
                               | HTTP / JSON
                               v
+--------------------------------------------------------------+
|                       FastAPI Backend                        |
| API routes + dependency injection + service orchestration   |
+--------------------+----------------------+------------------+
                     |                      |
                     v                      v
          +--------------------+   +--------------------------+
          | Recruiting Service |   | RAG / Retrieval Layer    |
          | - JD parsing       |   | - chunking               |
          | - resume parsing   |   | - embeddings             |
          | - hard screen      |   | - lexical scoring        |
          | - match analysis   |   | - vector scoring         |
          | - interview plan   |   | - hybrid ranking         |
          | - feedback summary |   | - retrieval evaluation   |
          +----------+---------+   +-------------+------------+
                     |                           |
                     v                           v
          +--------------------+      +------------------------+
          | LLM Providers      |      | Database               |
          | - mock             |      | jobs                   |
          | - openai           |      | candidates             |
          | - dify             |      | knowledge_documents    |
          +--------------------+      | knowledge_chunks       |
                                      | screenings             |
                                      | feedback_summaries     |
                                      +------------------------+
```

---

## 3. Layer responsibilities

### Frontend

The frontend is built with Next.js App Router and provides:

- dashboard metrics
- job management and recall actions
- candidate ingestion by text or file
- knowledge base management
- screening report review
- feedback summary generation
- retrieval evaluation metrics page

`frontend/src/lib/api.ts` supports both browser and container-friendly API base URLs:

- `NEXT_PUBLIC_API_BASE_URL`
- `INTERNAL_API_BASE_URL`

This avoids address mismatch between browser requests and server-side rendering inside Docker.

### API layer

`backend/app/main.py` is responsible for:

- FastAPI app setup
- CORS configuration
- DB initialization
- dependency injection
- REST endpoint exposure

### Service layer

`RecruitmentPlatformService` is the core workflow orchestrator. It connects parsing, retrieval, rules, and generation into one pipeline.

Main workflows:

1. parse a job into a structured job profile
2. parse a resume into a structured candidate profile
3. rank candidates for a job
4. apply hard-screen rules
5. retrieve RAG context from the knowledge base
6. generate match analysis and interview plan
7. summarize interview feedback

This is the agent-like part of the project: it does not just call an LLM directly, it composes retrieval, rules, and model inference.

### LLM provider layer

`backend/app/llm.py` exposes a unified provider interface with three modes:

- `mock`: deterministic local fallback for demos without API keys
- `openai`: structured parsing and generation with OpenAI APIs
- `dify`: workflow-based Dify integration

Benefits of this abstraction:

- provider switching without changing business logic
- local/offline demo path
- better future extensibility

### Retrieval and RAG layer

`backend/app/rag.py` implements:

- chunking
- embeddings
- lexical overlap scoring
- cosine similarity
- hybrid ranking

Two major retrieval paths exist:

1. **Knowledge RAG** for screening support context
2. **Candidate Recall** for job-to-candidate ranking

Current candidate ranking formula:

```text
final_score = 0.4 * lexical_score + 0.6 * vector_score
```

Why hybrid ranking:

- lexical retrieval improves interpretability
- vector retrieval improves semantic generalization
- combined scoring balances recall and precision

### Evaluation layer

`backend/app/evals.py` provides a development benchmark with:

- Recall@1
- Recall@3
- Recall@5
- Precision@3
- MRR

The current relevance label is heuristic and self-labeled from must-have skills plus years of experience.
This is good for development regression checks and demo storytelling.
Later it can be replaced by human-labeled or historical recruiting data.

---

## 4. Data model

Core tables:

- `jobs`
- `candidates`
- `knowledge_documents`
- `knowledge_chunks`
- `screenings`
- `feedback_summaries`

Design choices:

- keep raw text for auditability
- keep structured payloads for downstream logic
- store embeddings separately for retrieval
- separate knowledge documents from chunks for flexible ingestion

---

## 5. Key workflows

### Job creation

```text
JD input -> LLM parsing -> structured profile -> DB
```

### Candidate ingestion

```text
resume text or file -> candidate parsing -> profile text -> embedding -> DB
```

### Screening workflow

```text
job profile + candidate profile
-> hard screen
-> build RAG query
-> retrieve knowledge context
-> generate match analysis
-> generate interview plan
-> persist screening report
```

### Feedback summary workflow

```text
interview feedback text -> LLM summary -> structured recommendation
```

### Retrieval evaluation workflow

```text
jobs + candidates
-> auto relevance labeling
-> hybrid ranking
-> metric calculation
```

---

## 6. Why this is resume-worthy

Compared with a basic chat UI, this project demonstrates:

- business-oriented AI system design
- structured output engineering
- RAG and hybrid retrieval
- evaluation awareness
- full-stack delivery
- Docker-ready deployment

It shows both AI application ability and software engineering ability.

---

## 7. Recommended next upgrades

1. replace local embedding payload storage with pgvector
2. add a reranker layer
3. introduce async jobs for heavy file ingestion
4. add auth, RBAC, and audit logs
5. build a real labeled evaluation dataset
6. add business metrics such as interview pass rate or offer conversion
