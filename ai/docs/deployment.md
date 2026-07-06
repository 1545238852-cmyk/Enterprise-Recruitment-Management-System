# Intelligent Recruiting Assistant - Deployment Guide

## 1. Deployment targets

This project supports two common modes:

1. **local development mode**
2. **Docker Compose deployment mode**

For a resume or portfolio project, Docker Compose deployment is the recommended demonstration path.

---

## 2. Local development

### Start backend

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload
```

Open:

- API health: `http://127.0.0.1:8000/api/health`
- Swagger UI: `http://127.0.0.1:8000/docs`

### Start frontend

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai\frontend"
npm run dev
```

Open:

- frontend: `http://127.0.0.1:3000`

### Seed demo data

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe backend\scripts\seed_demo.py
```

---

## 3. Environment variables

Key files:

- `.env`
- `.env.example`

### Base settings

```env
APP_ENV=development
DATABASE_URL=sqlite:///./backend/recruit_agent.db
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### OpenAI mode

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.4-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### Dify mode

```env
LLM_PROVIDER=dify
DIFY_API_BASE=https://your-dify-host/v1
DIFY_API_KEY=your_key
DIFY_JOB_WORKFLOW_ID=xxx
DIFY_RESUME_WORKFLOW_ID=xxx
DIFY_MATCH_WORKFLOW_ID=xxx
DIFY_INTERVIEW_WORKFLOW_ID=xxx
DIFY_FEEDBACK_WORKFLOW_ID=xxx
```

---

## 4. Docker Compose deployment

### Prerequisites on Windows

Make sure that:

- Docker Desktop is installed
- Docker Desktop is open
- Docker Engine status is `Running`

If you see this error:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

then the problem is usually not the YAML file. It means the Docker daemon is not running yet.

### Start all services

Run from the project root:

```powershell
docker compose up --build
```

The stack includes:

- `postgres`
- `backend`
- `frontend`

Default addresses:

- frontend: `http://localhost:3000`
- backend: `http://localhost:8000`
- postgres: `localhost:5432`

### Validate Compose syntax

```powershell
docker compose config
```

If this passes, the compose file syntax is valid.

---

## 5. Container design

### Backend container

Responsibilities:

- install Python dependencies
- run FastAPI with Uvicorn
- read runtime env vars for provider switching

### Frontend container

Responsibilities:

- install Node.js dependencies
- build the Next.js production bundle
- serve the app with `next start`

### Database container

Image used:

- `postgres:16-alpine`

This is lightweight and good enough for a showcase deployment.

---

## 6. Cloud deployment recommendations

### Recommended server size

For demo or portfolio usage:

- 2 vCPU
- 4 GB RAM
- 40 GB SSD
- Ubuntu 22.04 LTS

### Option A: single machine with Docker Compose

Good for:

- portfolio projects
- interview demos
- light traffic

Typical steps:

1. install Docker and Docker Compose
2. clone the repository
3. configure `.env`
4. run `docker compose up -d --build`
5. place Nginx in front of the app
6. enable HTTPS with Let's Encrypt

### Option B: split frontend and backend deployment

Good for:

- frontend on Vercel
- backend on a VM or container platform
- managed PostgreSQL database

Important checks:

- update `NEXT_PUBLIC_API_BASE_URL` to the production backend URL
- allow the frontend domain in `CORS_ORIGINS`
- keep OpenAI or Dify secrets on the server side only

---

## 7. Production hardening checklist

Before treating this like a real production service, add:

- authentication and login
- role-based access control
- logs, monitoring, and alerting
- async task processing
- object storage for uploaded files
- DB backup strategy
- HTTPS and domain setup
- rate limiting and audit logging

---

## 8. Troubleshooting

### `ModuleNotFoundError: No module named 'app'`

Use this command:

```powershell
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload
```

Do not use:

```powershell
uvicorn app.main:app --reload
```

### Frontend cannot reach backend

Check:

- backend is running on port 8000
- `NEXT_PUBLIC_API_BASE_URL` is correct
- `CORS_ORIGINS` includes the frontend origin

### Docker stack does not start

Check:

- Docker Desktop is running
- ports 3000 / 5432 / 8000 are available
- `.env` values are valid

### OpenAI or Dify path does not work

Check:

- `LLM_PROVIDER` value
- API key validity
- Dify workflow IDs
- whether the app is still in `mock` mode

---

## 9. Pre-release checklist

- [ ] backend tests pass
- [ ] frontend build passes
- [ ] `docker compose config` passes
- [ ] `docker compose up --build` starts correctly
- [ ] production env vars are set
- [ ] frontend can reach backend
- [ ] OpenAI or Dify integration is verified
- [ ] demo data is prepared
