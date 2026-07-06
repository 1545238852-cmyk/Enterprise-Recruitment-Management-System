from __future__ import annotations

import math
from datetime import UTC, datetime

from .db import CandidateRecord, JobRecord
from .rag import build_candidate_profile_text
from .schemas import (
    RetrievalEvalCase,
    RetrievalEvalResponse,
    RetrievalEvalSummary,
    StructuredCandidateProfile,
    StructuredJobProfile,
)


def _candidate_blob(candidate: StructuredCandidateProfile) -> str:
    return build_candidate_profile_text(candidate.model_dump()).lower()


def _is_relevant(job: StructuredJobProfile, candidate: StructuredCandidateProfile) -> bool:
    blob = _candidate_blob(candidate)
    matched = sum(1 for skill in job.must_have_skills if skill.lower() in blob)
    if not job.must_have_skills:
        return candidate.years_experience >= max(job.min_years_experience - 1, 0)
    required_match_count = max(1, math.ceil(len(job.must_have_skills) * 0.6))
    years_ok = candidate.years_experience >= max(job.min_years_experience - 1, 0)
    return years_ok and matched >= required_match_count


def _recall_at_k(relevant: set[int], ranked: list[int], k: int) -> float:
    if not relevant:
        return 0.0
    hit_count = len(relevant.intersection(ranked[:k]))
    return round(hit_count / len(relevant), 4)


def _precision_at_k(relevant: set[int], ranked: list[int], k: int) -> float:
    window = ranked[:k]
    if not window:
        return 0.0
    hit_count = len(relevant.intersection(window))
    return round(hit_count / len(window), 4)


def _mrr(relevant: set[int], ranked: list[int]) -> float:
    for index, candidate_id in enumerate(ranked, start=1):
        if candidate_id in relevant:
            return round(1 / index, 4)
    return 0.0


def evaluate_retrieval(jobs: list[JobRecord], candidates: list[CandidateRecord], ranker) -> RetrievalEvalResponse:
    candidate_profiles = {
        candidate.id: StructuredCandidateProfile.model_validate(candidate.structured)
        for candidate in candidates
    }

    cases: list[RetrievalEvalCase] = []
    for job_record in jobs:
        job = StructuredJobProfile.model_validate(job_record.structured)
        relevant = {
            candidate_id
            for candidate_id, profile in candidate_profiles.items()
            if _is_relevant(job, profile)
        }
        if not relevant:
            continue

        rankings = ranker.rank_candidates(job, top_k=max(10, len(candidate_profiles)))
        ranked_ids = [item.candidate_id for item in rankings]
        cases.append(
            RetrievalEvalCase(
                job_id=job_record.id,
                job_title=job_record.title,
                relevant_candidate_ids=sorted(relevant),
                ranked_candidate_ids=ranked_ids,
                recall_at_1=_recall_at_k(relevant, ranked_ids, 1),
                recall_at_3=_recall_at_k(relevant, ranked_ids, 3),
                recall_at_5=_recall_at_k(relevant, ranked_ids, 5),
                precision_at_3=_precision_at_k(relevant, ranked_ids, 3),
                mrr=_mrr(relevant, ranked_ids),
            )
        )

    if cases:
        summary = RetrievalEvalSummary(
            recall_at_1=round(sum(case.recall_at_1 for case in cases) / len(cases), 4),
            recall_at_3=round(sum(case.recall_at_3 for case in cases) / len(cases), 4),
            recall_at_5=round(sum(case.recall_at_5 for case in cases) / len(cases), 4),
            precision_at_3=round(sum(case.precision_at_3 for case in cases) / len(cases), 4),
            mrr=round(sum(case.mrr for case in cases) / len(cases), 4),
        )
    else:
        summary = RetrievalEvalSummary(recall_at_1=0.0, recall_at_3=0.0, recall_at_5=0.0, precision_at_3=0.0, mrr=0.0)

    return RetrievalEvalResponse(
        generated_at=datetime.now(UTC),
        total_jobs_evaluated=len(cases),
        total_candidates=len(candidates),
        dataset_type='heuristic_self_labeled_benchmark',
        strategy_notes=[
            'Hybrid retrieval mixes keyword overlap with vector similarity ranking.',
            'This dev benchmark auto-labels relevance using must-have skill coverage and years of experience.',
            'In production you can replace it with human-labeled resume, interview, and offer outcomes.',
        ],
        summary=summary,
        cases=cases,
    )
