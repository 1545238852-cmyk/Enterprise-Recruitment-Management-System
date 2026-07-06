from __future__ import annotations

import json

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session

from ..db import CandidateRecord, FeedbackSummaryRecord, JobRecord, KnowledgeDocumentRecord, ScreeningRecord
from ..evals import evaluate_retrieval
from ..llm import RecruitingLLM
from ..rag import CandidateRecallService, EmbeddingService, KnowledgeBaseService, build_candidate_profile_text
from ..schemas import (
    CandidateCreateRequest,
    CandidateRecallResponse,
    CandidateResponse,
    DashboardMetrics,
    FeedbackSummary,
    FeedbackSummaryRequest,
    FeedbackSummaryResponse,
    HardScreenResult,
    RetrievalEvalResponse,
    JobCreateRequest,
    JobResponse,
    KnowledgeDocumentResponse,
    KnowledgeIngestRequest,
    ScreeningReport,
    ScreeningResponse,
    StructuredCandidateProfile,
    StructuredJobProfile,
)


class RecruitmentPlatformService:
    def __init__(self, db: Session, llm: RecruitingLLM) -> None:
        self.db = db
        self.llm = llm
        self.embedding_service = EmbeddingService()
        self.knowledge_service = KnowledgeBaseService(db)
        self.recall_service = CandidateRecallService(db)

    def create_job(self, payload: JobCreateRequest) -> JobResponse:
        profile = self.llm.parse_job(payload.title, payload.description)
        record = JobRecord(title=payload.title or profile.role, raw_description=payload.description, structured_payload=json.dumps(profile.model_dump(), ensure_ascii=False))
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return JobResponse(id=record.id, title=record.title, raw_description=record.raw_description, structured_profile=profile, created_at=record.created_at, llm_provider=self.llm.provider_name)

    def list_jobs(self) -> list[JobResponse]:
        return [JobResponse(id=r.id, title=r.title, raw_description=r.raw_description, structured_profile=StructuredJobProfile.model_validate(r.structured), created_at=r.created_at, llm_provider=self.llm.provider_name) for r in self.db.query(JobRecord).order_by(JobRecord.id.desc()).all()]

    def delete_job(self, job_id: int) -> dict:
        record = self.db.get(JobRecord, job_id)
        if not record:
            raise ValueError('Job not found.')

        screenings = (
            self.db.query(ScreeningRecord)
            .options(selectinload(ScreeningRecord.feedback_summaries))
            .filter(ScreeningRecord.job_id == job_id)
            .all()
        )
        for screening in screenings:
            for feedback in screening.feedback_summaries:
                self.db.delete(feedback)
            self.db.delete(screening)

        self.db.delete(record)
        self.db.commit()
        return {'success': True, 'deleted_id': job_id}

    def create_candidate(self, payload: CandidateCreateRequest) -> CandidateResponse:
        profile = self.llm.parse_resume(payload.resume_text)
        profile_dict = profile.model_dump()
        profile_text = build_candidate_profile_text(profile_dict)
        embedding = self.embedding_service.embed_texts([profile_text])[0]
        record = CandidateRecord(
            name=profile.name,
            source_filename=payload.source_filename,
            raw_resume_text=payload.resume_text,
            structured_payload=json.dumps(profile_dict, ensure_ascii=False),
            profile_text=profile_text,
            embedding_payload=json.dumps(embedding),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return CandidateResponse(id=record.id, name=record.name, source_filename=record.source_filename, raw_resume_text=record.raw_resume_text, structured_profile=profile, created_at=record.created_at, llm_provider=self.llm.provider_name)

    def list_candidates(self) -> list[CandidateResponse]:
        return [CandidateResponse(id=r.id, name=r.name, source_filename=r.source_filename, raw_resume_text=r.raw_resume_text, structured_profile=StructuredCandidateProfile.model_validate(r.structured), created_at=r.created_at, llm_provider=self.llm.provider_name) for r in self.db.query(CandidateRecord).order_by(CandidateRecord.id.desc()).all()]

    def delete_candidate(self, candidate_id: int) -> dict:
        record = self.db.get(CandidateRecord, candidate_id)
        if not record:
            raise ValueError('Candidate not found.')

        screenings = (
            self.db.query(ScreeningRecord)
            .options(selectinload(ScreeningRecord.feedback_summaries))
            .filter(ScreeningRecord.candidate_id == candidate_id)
            .all()
        )
        for screening in screenings:
            for feedback in screening.feedback_summaries:
                self.db.delete(feedback)
            self.db.delete(screening)

        self.db.delete(record)
        self.db.commit()
        return {'success': True, 'deleted_id': candidate_id}

    def ingest_knowledge(self, payload: KnowledgeIngestRequest) -> KnowledgeDocumentResponse:
        return self.knowledge_service.ingest(payload)

    def list_knowledge(self) -> list[KnowledgeDocumentResponse]:
        return self.knowledge_service.list_documents()

    def recall_candidates(self, job_id: int) -> CandidateRecallResponse:
        job_record = self.db.get(JobRecord, job_id)
        if not job_record:
            raise ValueError('Job not found.')
        job = StructuredJobProfile.model_validate(job_record.structured)
        rankings = self.recall_service.rank_candidates(job)
        query = ' '.join([job.role, *job.must_have_skills, *job.preferred_skills])
        return CandidateRecallResponse(job_id=job_id, query=query, rankings=rankings)

    def screen_candidate(self, job_id: int, candidate_id: int) -> ScreeningResponse:
        job_record = self.db.get(JobRecord, job_id)
        candidate_record = self.db.get(CandidateRecord, candidate_id)
        if not job_record or not candidate_record:
            raise ValueError('Job or candidate not found.')
        job = StructuredJobProfile.model_validate(job_record.structured)
        candidate = StructuredCandidateProfile.model_validate(candidate_record.structured)

        workflow_log = ['读取岗位画像', '读取候选人画像', '执行硬筛', '构建 RAG 查询']
        hard_screen = self._run_hard_screen(job, candidate)
        rag_query = ' '.join([job.role, *job.must_have_skills, *job.preferred_skills, *candidate.skills[:5]])
        retrieved_contexts = self.knowledge_service.retrieve(rag_query, top_k=6)
        workflow_log.append(f'完成知识库检索：召回 {len(retrieved_contexts)} 条')

        analysis = self.llm.analyze_match(job, candidate, [item.chunk_text for item in retrieved_contexts], hard_screen.notes + hard_screen.missing_requirements)
        workflow_log.append('完成语义匹配分析')
        interview_plan = self.llm.generate_interview_plan(job, candidate, analysis)
        workflow_log.append('完成面试题生成')

        report = ScreeningReport(
            job_id=job_id,
            candidate_id=candidate_id,
            hard_screen=hard_screen,
            retrieved_contexts=retrieved_contexts,
            match_analysis=analysis,
            interview_plan=interview_plan,
            workflow_log=workflow_log,
            llm_provider=self.llm.provider_name,
        )
        record = ScreeningRecord(job_id=job_id, candidate_id=candidate_id, decision=analysis.recommendation, score=analysis.match_score, report_payload=json.dumps(report.model_dump(), ensure_ascii=False))
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return ScreeningResponse(id=record.id, job_id=record.job_id, candidate_id=record.candidate_id, decision=record.decision, score=int(record.score), report=report, created_at=record.created_at)

    def list_screenings(self) -> list[ScreeningResponse]:
        return [ScreeningResponse(id=r.id, job_id=r.job_id, candidate_id=r.candidate_id, decision=r.decision, score=int(r.score), report=ScreeningReport.model_validate(r.report), created_at=r.created_at) for r in self.db.query(ScreeningRecord).order_by(ScreeningRecord.id.desc()).all()]

    def summarize_feedback(self, screening_id: int, payload: FeedbackSummaryRequest) -> FeedbackSummaryResponse:
        screening = self.db.get(ScreeningRecord, screening_id)
        if not screening:
            raise ValueError('Screening not found.')
        job = StructuredJobProfile.model_validate(screening.job.structured)
        candidate = StructuredCandidateProfile.model_validate(screening.candidate.structured)
        summary: FeedbackSummary = self.llm.summarize_feedback(job, candidate, payload.feedback_text)
        record = FeedbackSummaryRecord(screening_id=screening_id, raw_feedback=payload.feedback_text, summary_payload=json.dumps(summary.model_dump(), ensure_ascii=False))
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return FeedbackSummaryResponse(id=record.id, screening_id=record.screening_id, raw_feedback=record.raw_feedback, summary=summary, created_at=record.created_at, llm_provider=self.llm.provider_name)

    def dashboard(self) -> DashboardMetrics:
        average_score = self.db.query(func.avg(ScreeningRecord.score)).scalar() or 0
        recommended = self.db.query(ScreeningRecord).filter(ScreeningRecord.decision.in_(['建议一面', '建议二面'])).count()
        return DashboardMetrics(
            jobs=self.db.query(JobRecord).count(),
            candidates=self.db.query(CandidateRecord).count(),
            knowledge_documents=self.db.query(KnowledgeDocumentRecord).count(),
            screenings=self.db.query(ScreeningRecord).count(),
            recommended_candidates=recommended,
            average_match_score=round(float(average_score), 2),
        )

    def evaluate_retrieval(self) -> RetrievalEvalResponse:
        jobs = self.db.query(JobRecord).order_by(JobRecord.id.asc()).all()
        candidates = self.db.query(CandidateRecord).order_by(CandidateRecord.id.asc()).all()
        return evaluate_retrieval(jobs, candidates, self.recall_service)

    def _run_hard_screen(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile) -> HardScreenResult:
        matched, missing, notes = [], [], []
        candidate_blob = ' '.join(candidate.skills + candidate.strengths + [project.name + ' ' + ' '.join(project.highlights) for project in candidate.projects]).lower()
        if candidate.years_experience >= job.min_years_experience:
            matched.append(f'工作年限满足：{candidate.years_experience} >= {job.min_years_experience}')
        else:
            missing.append(f'工作年限不足：{candidate.years_experience} < {job.min_years_experience}')
        for skill in job.must_have_skills:
            if skill.lower() in candidate_blob:
                matched.append(f'命中技能：{skill}')
            else:
                missing.append(f'缺少技能：{skill}')
        if job.education_requirement != '不限' and '本科' not in candidate.education:
            notes.append(f'学历需人工确认：岗位 {job.education_requirement}，候选人 {candidate.education}')
        return HardScreenResult(passed=len(missing) == 0, matched_requirements=matched, missing_requirements=missing, notes=notes)
