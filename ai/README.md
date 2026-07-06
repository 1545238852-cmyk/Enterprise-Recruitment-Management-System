# AI Recruiting ATS

AI Recruiting ATS is an internal recruiting workflow system built for portfolio presentation, local demos, and container-based deployment. It focuses on operational recruiting flows instead of chatbot-style interaction.

## Features

- Job creation and structured job profile extraction
- Candidate ingestion from text and file upload
- Knowledge base ingestion for RAG
- Hybrid retrieval with lexical and vector scoring
- Hard-screen rules for mandatory requirements
- Screening report generation
- Interview question planning
- Feedback summarization
- Retrieval evaluation dashboard
- Docker deployment support

## Stack

### Backend
- FastAPI
- SQLAlchemy
- Pydantic Settings
- OpenAI SDK
- SQLite / PostgreSQL

### Frontend
- Next.js
- React
- TypeScript

### Deployment
- Docker
- Docker Compose

## Project Structure

```text
ai/
├─ backend/
│  ├─ app/
│  ├─ sample_data/
│  ├─ scripts/
│  └─ tests/
├─ frontend/
├─ docs/
├─ infra/
├─ docker-compose.yml
├─ .env.example
└─ README.md
```

## Local Setup

### 1. Create environment file

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
copy .env.example .env
```

### 2. Start backend

```powershell
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8001
```

Backend endpoints:
- Health: `http://127.0.0.1:8001/api/health`
- Docs: `http://127.0.0.1:8001/docs`

### 3. Start frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend:
- `http://127.0.0.1:3000`

## Demo Data

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe backend\scripts\seed_demo.py
```

Sample files:
- `backend/sample_data/job_ai_engineer.txt`
- `backend/sample_data/resume_candidate_zhangsan.txt`
- `backend/sample_data/knowledge_interview_guide.txt`
- `backend/sample_data/knowledge_hiring_playbook.txt`
- `backend/sample_data/knowledge_rag_quality.txt`

## API Overview

### Core endpoints
- `POST /api/jobs`
- `GET /api/jobs`
- `DELETE /api/jobs/{job_id}`
- `POST /api/candidates/text`
- `POST /api/candidates/upload`
- `GET /api/candidates`
- `DELETE /api/candidates/{candidate_id}`
- `POST /api/knowledge`
- `POST /api/knowledge/upload`
- `GET /api/knowledge`
- `POST /api/jobs/{job_id}/recall`
- `POST /api/screenings`
- `GET /api/screenings`
- `POST /api/screenings/{screening_id}/feedback`
- `GET /api/evals/retrieval`
- `GET /api/dashboard`

## Model Providers

### Mock mode

```env
LLM_PROVIDER=mock
EMBEDDING_PROVIDER=auto
```

### OpenAI mode

```env
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-5.4-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### Dify + OpenAI embeddings

```env
LLM_PROVIDER=dify
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
EMBEDDING_MODEL=text-embedding-3-small
DIFY_API_BASE=https://your-dify-domain/v1
DIFY_API_KEY=your_default_dify_key
DIFY_JOB_API_KEY=
DIFY_RESUME_API_KEY=
DIFY_MATCH_API_KEY=
DIFY_INTERVIEW_API_KEY=
DIFY_FEEDBACK_API_KEY=
```

## Retrieval Strategy

The candidate retrieval flow combines:

1. structured extraction
2. lexical matching
3. vector similarity
4. hard-screen filtering
5. RAG-assisted analysis

Current combined score:

```text
final_score = 0.4 * lexical_score + 0.6 * vector_score
```

## Testing

### Backend tests

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe -m pytest backend\tests -q
```

### Frontend build

```powershell
cd frontend
npm run build
```

## Deployment

### Docker Compose

```powershell
docker compose up --build
```

See also:
- `docs/architecture.md`
- `docs/deployment.md`

## Roadmap

- Authentication and role-based access control
- Audit trail for recruiter actions
- PostgreSQL + pgvector support
- Rerank stage for retrieval improvement
- Async task processing
- Object storage integration
- Human-labeled evaluation set
