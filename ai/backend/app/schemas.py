from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProjectSummary(BaseModel):
    name: str
    role: str
    highlights: list[str] = Field(default_factory=list)
    tech_stack: list[str] = Field(default_factory=list)


class StructuredJobProfile(BaseModel):
    role: str
    summary: str
    must_have_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    min_years_experience: int = 0
    education_requirement: str = '不限'
    location_requirement: str = '不限'
    keywords: list[str] = Field(default_factory=list)


class StructuredCandidateProfile(BaseModel):
    name: str
    current_title: str = '未知'
    years_experience: float = 0
    education: str = '未知'
    location: str = '未知'
    expected_salary: str | None = None
    skills: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    projects: list[ProjectSummary] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)


class HardScreenResult(BaseModel):
    passed: bool
    matched_requirements: list[str] = Field(default_factory=list)
    missing_requirements: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class KnowledgeChunkResult(BaseModel):
    chunk_id: int
    document_name: str
    category: str
    chunk_text: str
    lexical_score: float
    semantic_score: float
    final_score: float


class MatchAnalysis(BaseModel):
    match_score: int = Field(ge=0, le=100)
    matched_points: list[str] = Field(default_factory=list)
    missing_points: list[str] = Field(default_factory=list)
    risk_points: list[str] = Field(default_factory=list)
    recommendation: Literal['淘汰', '待定', '建议一面', '建议二面']
    interview_focus: list[str] = Field(default_factory=list)
    summary: str
    citations: list[str] = Field(default_factory=list)


class InterviewQuestion(BaseModel):
    category: str
    question: str
    why_it_matters: str


class InterviewPlan(BaseModel):
    overall_goal: str
    questions: list[InterviewQuestion] = Field(default_factory=list)


class FeedbackSummary(BaseModel):
    technical_strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    communication_signal: str
    next_step_recommendation: Literal['淘汰', '待定', '建议进入下一轮', '建议发 offer']
    final_summary: str


class CandidateRankingItem(BaseModel):
    candidate_id: int
    candidate_name: str
    recall_score: float
    vector_score: float
    lexical_score: float
    match_hint: str
    matched_skills: list[str] = Field(default_factory=list)


class ScreeningReport(BaseModel):
    job_id: int
    candidate_id: int
    hard_screen: HardScreenResult
    retrieved_contexts: list[KnowledgeChunkResult] = Field(default_factory=list)
    match_analysis: MatchAnalysis
    interview_plan: InterviewPlan
    workflow_log: list[str] = Field(default_factory=list)
    llm_provider: str


class DashboardMetrics(BaseModel):
    jobs: int
    candidates: int
    knowledge_documents: int
    screenings: int
    recommended_candidates: int
    average_match_score: float


class RetrievalEvalSummary(BaseModel):
    recall_at_1: float
    recall_at_3: float
    recall_at_5: float
    precision_at_3: float
    mrr: float


class RetrievalEvalCase(BaseModel):
    job_id: int
    job_title: str
    relevant_candidate_ids: list[int] = Field(default_factory=list)
    ranked_candidate_ids: list[int] = Field(default_factory=list)
    recall_at_1: float
    recall_at_3: float
    recall_at_5: float
    precision_at_3: float
    mrr: float


class RetrievalEvalResponse(BaseModel):
    generated_at: datetime
    total_jobs_evaluated: int
    total_candidates: int
    dataset_type: str
    strategy_notes: list[str] = Field(default_factory=list)
    summary: RetrievalEvalSummary
    cases: list[RetrievalEvalCase] = Field(default_factory=list)


class JobCreateRequest(BaseModel):
    title: str | None = None
    description: str


class CandidateCreateRequest(BaseModel):
    resume_text: str
    source_filename: str | None = None


class KnowledgeIngestRequest(BaseModel):
    name: str
    category: Literal['job_standard', 'interview_guide', 'playbook', 'faq', 'other'] = 'other'
    content: str
    metadata: dict = Field(default_factory=dict)


class CandidateRecallResponse(BaseModel):
    job_id: int
    query: str
    rankings: list[CandidateRankingItem]


class JobResponse(BaseModel):
    id: int
    title: str
    raw_description: str
    structured_profile: StructuredJobProfile
    created_at: datetime
    llm_provider: str


class CandidateResponse(BaseModel):
    id: int
    name: str
    source_filename: str | None
    raw_resume_text: str
    structured_profile: StructuredCandidateProfile
    created_at: datetime
    llm_provider: str


class KnowledgeDocumentResponse(BaseModel):
    id: int
    name: str
    category: str
    chunk_count: int
    created_at: datetime


class ScreeningResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    decision: str
    score: int
    report: ScreeningReport
    created_at: datetime


class FeedbackSummaryRequest(BaseModel):
    feedback_text: str


class FeedbackSummaryResponse(BaseModel):
    id: int
    screening_id: int
    raw_feedback: str
    summary: FeedbackSummary
    created_at: datetime
    llm_provider: str
