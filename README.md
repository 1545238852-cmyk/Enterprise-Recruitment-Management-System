# AI Recruiting ATS

Production-style recruiting workflow system built with **FastAPI + Next.js**. The project includes job intake, candidate parsing, knowledge base ingestion, hybrid retrieval, screening reports, and evaluation dashboards.

## Repository Structure

```text
.
├─ ai/                  # application source
│  ├─ backend/          # FastAPI service
│  ├─ frontend/         # Next.js frontend
│  ├─ docs/             # architecture and deployment docs
│  ├─ infra/            # infrastructure assets
│  ├─ docker-compose.yml
│  └─ README.md         # project setup and feature docs
└─ .gitignore
```

## Why this repository looks production-ready

- clear monorepo layout
- backend / frontend separation
- environment template checked in, secrets excluded
- local runtime artifacts removed from version control
- Docker-based deployment path included
- backend tests included
- frontend build configuration included

## Quick Start

```powershell
cd "ai"
copy .env.example .env
```

### Backend

```powershell
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8001
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open:
- Frontend: `http://127.0.0.1:3000`
- API docs: `http://127.0.0.1:8001/docs`

## Documentation

- App guide: `ai/README.md`
- Architecture: `ai/docs/architecture.md`
- Deployment: `ai/docs/deployment.md`

## GitHub Upload

```powershell
git add .
git commit -m "chore: prepare repository for github"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

If `origin` already exists:

```powershell
git remote set-url origin <your-repo-url>
git push -u origin main
```
