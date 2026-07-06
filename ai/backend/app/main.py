from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import get_settings
from .db import SessionLocal, init_db
from .llm import get_llm
from .schemas import CandidateCreateRequest, FeedbackSummaryRequest, JobCreateRequest, KnowledgeIngestRequest
from .services.file_parser import extract_text_from_upload
from .services.recruitment import RecruitmentPlatformService

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_service(db: Session = Depends(get_db)) -> RecruitmentPlatformService:
    return RecruitmentPlatformService(db=db, llm=get_llm())


@app.get(f'{settings.api_prefix}/health')
def health_check():
    return {
        'status': 'ok',
        'provider': settings.llm_provider,
        'model': settings.openai_model,
        'database_url': settings.database_url,
        'cors_origins': settings.cors_origins,
    }


@app.get(f'{settings.api_prefix}/dashboard')
def get_dashboard(service: RecruitmentPlatformService = Depends(get_service)):
    return service.dashboard()


@app.get(f'{settings.api_prefix}/evals/retrieval')
def get_retrieval_evals(service: RecruitmentPlatformService = Depends(get_service)):
    return service.evaluate_retrieval()


@app.post(f'{settings.api_prefix}/jobs')
def create_job(payload: JobCreateRequest, service: RecruitmentPlatformService = Depends(get_service)):
    return service.create_job(payload)


@app.get(f'{settings.api_prefix}/jobs')
def list_jobs(service: RecruitmentPlatformService = Depends(get_service)):
    return service.list_jobs()

@app.delete(f'{settings.api_prefix}/jobs/{{job_id}}')
def delete_job(job_id: int, service: RecruitmentPlatformService = Depends(get_service)):
    try:
        return service.delete_job(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post(f'{settings.api_prefix}/jobs/{{job_id}}/recall')
def recall_candidates(job_id: int, service: RecruitmentPlatformService = Depends(get_service)):
    try:
        return service.recall_candidates(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post(f'{settings.api_prefix}/candidates/text')
def create_candidate(payload: CandidateCreateRequest, service: RecruitmentPlatformService = Depends(get_service)):
    return service.create_candidate(payload)


@app.post(f'{settings.api_prefix}/candidates/upload')
async def upload_candidate(file: UploadFile = File(...), service: RecruitmentPlatformService = Depends(get_service)):
    content = await file.read()
    text = extract_text_from_upload(file.filename or 'resume.txt', content)
    if not text:
        raise HTTPException(status_code=400, detail='未能从上传文件中提取到简历文本')
    return service.create_candidate(CandidateCreateRequest(resume_text=text, source_filename=file.filename))


@app.get(f'{settings.api_prefix}/candidates')
def list_candidates(service: RecruitmentPlatformService = Depends(get_service)):
    return service.list_candidates()

@app.delete(f'{settings.api_prefix}/candidates/{{candidate_id}}')
def delete_candidate(candidate_id: int, service: RecruitmentPlatformService = Depends(get_service)):
    try:
        return service.delete_candidate(candidate_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post(f'{settings.api_prefix}/knowledge')
def ingest_knowledge(payload: KnowledgeIngestRequest, service: RecruitmentPlatformService = Depends(get_service)):
    return service.ingest_knowledge(payload)


@app.post(f'{settings.api_prefix}/knowledge/upload')
async def upload_knowledge(file: UploadFile = File(...), category: str = 'other', service: RecruitmentPlatformService = Depends(get_service)):
    content = await file.read()
    text = extract_text_from_upload(file.filename or 'knowledge.txt', content)
    if not text:
        raise HTTPException(status_code=400, detail='未能从上传文件中提取到知识库文本')
    return service.ingest_knowledge(KnowledgeIngestRequest(name=file.filename or 'knowledge.txt', category=category, content=text))


@app.get(f'{settings.api_prefix}/knowledge')
def list_knowledge(service: RecruitmentPlatformService = Depends(get_service)):
    return service.list_knowledge()


@app.post(f'{settings.api_prefix}/screenings')
def create_screening(job_id: int, candidate_id: int, service: RecruitmentPlatformService = Depends(get_service)):
    try:
        return service.screen_candidate(job_id, candidate_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get(f'{settings.api_prefix}/screenings')
def list_screenings(service: RecruitmentPlatformService = Depends(get_service)):
    return service.list_screenings()


@app.post(f'{settings.api_prefix}/screenings/{{screening_id}}/feedback')
def summarize_feedback(screening_id: int, payload: FeedbackSummaryRequest, service: RecruitmentPlatformService = Depends(get_service)):
    try:
        return service.summarize_feedback(screening_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


