from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass

import numpy as np
from openai import OpenAI
from sqlalchemy.orm import Session

from .config import get_settings
from .db import CandidateRecord, KnowledgeChunkRecord, KnowledgeDocumentRecord
from .schemas import CandidateRankingItem, KnowledgeChunkResult, KnowledgeDocumentResponse, KnowledgeIngestRequest, StructuredJobProfile


WORD_RE = re.compile(r'[A-Za-z0-9\u4e00-\u9fff#\.]{2,}')


@dataclass
class EmbeddedChunk:
    chunk_text: str
    metadata: dict
    embedding: list[float]


class EmbeddingService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.provider_name = self._resolve_provider_name()
        client_base_url = (self.settings.openai_base_url or '').rstrip('/') or None
        self.client = OpenAI(api_key=self.settings.openai_api_key, base_url=client_base_url) if self.provider_name == 'openai' else None

    def _resolve_provider_name(self) -> str:
        provider = self.settings.embedding_provider
        if provider == 'mock':
            return 'mock'
        if provider == 'openai':
            if not self.settings.openai_api_key:
                raise ValueError('EMBEDDING_PROVIDER=openai 但未配置 OPENAI_API_KEY。')
            return 'openai'
        if not self.settings.openai_api_key:
            return 'mock'
        if self.settings.openai_base_url:
            return 'mock'
        return 'openai'

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if self.client is not None:
            result = self.client.embeddings.create(model=self.settings.embedding_model, input=texts)
            return [item.embedding for item in result.data]
        return [self._deterministic_embedding(text) for text in texts]

    def _deterministic_embedding(self, text: str) -> list[float]:
        dims = self.settings.embedding_dimensions
        vector = np.zeros(dims, dtype=float)
        for token in tokenize(text):
            digest = hashlib.sha256(token.encode('utf-8')).digest()
            for offset in range(0, min(len(digest), dims), 2):
                index = digest[offset] % dims
                sign = 1 if digest[offset + 1] % 2 == 0 else -1
                vector[index] += sign * 1.0
        norm = np.linalg.norm(vector)
        if norm == 0:
            return vector.tolist()
        return (vector / norm).tolist()


def tokenize(text: str) -> list[str]:
    return [match.group(0).lower() for match in WORD_RE.finditer(text)]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    if len(a) != len(b):
        return 0.0
    a_np = np.array(a, dtype=float)
    b_np = np.array(b, dtype=float)
    denom = np.linalg.norm(a_np) * np.linalg.norm(b_np)
    if denom == 0:
        return 0.0
    return float(np.dot(a_np, b_np) / denom)


def lexical_overlap_score(query: str, text: str) -> float:
    q = set(tokenize(query))
    t = set(tokenize(text))
    if not q or not t:
        return 0.0
    overlap = len(q & t)
    return overlap / math.sqrt(len(q) * len(t))


def chunk_text(content: str, chunk_size: int, overlap: int) -> list[str]:
    content = content.strip()
    if len(content) <= chunk_size:
        return [content]
    chunks = []
    start = 0
    while start < len(content):
        end = min(len(content), start + chunk_size)
        chunks.append(content[start:end])
        if end == len(content):
            break
        start = max(0, end - overlap)
    return chunks


class KnowledgeBaseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.embedding_service = EmbeddingService()

    def ingest(self, payload: KnowledgeIngestRequest) -> KnowledgeDocumentResponse:
        chunks = chunk_text(payload.content, self.settings.chunk_size, self.settings.chunk_overlap)
        embeddings = self.embedding_service.embed_texts(chunks)
        document = KnowledgeDocumentRecord(
            name=payload.name,
            category=payload.category,
            raw_text=payload.content,
            metadata_payload=json_dumps(payload.metadata),
        )
        self.db.add(document)
        self.db.flush()
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            record = KnowledgeChunkRecord(
                document_id=document.id,
                chunk_index=idx,
                chunk_text=chunk,
                metadata_payload=json_dumps({'category': payload.category, **payload.metadata}),
                embedding_payload=json_dumps(embedding),
                lexical_hint=' '.join(tokenize(chunk)[:50]),
            )
            self.db.add(record)
        self.db.commit()
        self.db.refresh(document)
        return KnowledgeDocumentResponse(
            id=document.id,
            name=document.name,
            category=document.category,
            chunk_count=len(document.chunks),
            created_at=document.created_at,
        )

    def list_documents(self) -> list[KnowledgeDocumentResponse]:
        docs = self.db.query(KnowledgeDocumentRecord).order_by(KnowledgeDocumentRecord.id.desc()).all()
        return [
            KnowledgeDocumentResponse(
                id=doc.id,
                name=doc.name,
                category=doc.category,
                chunk_count=len(doc.chunks),
                created_at=doc.created_at,
            )
            for doc in docs
        ]

    def retrieve(self, query: str, top_k: int = 5, category: str | None = None) -> list[KnowledgeChunkResult]:
        query_embedding = self.embedding_service.embed_texts([query])[0]
        records = self.db.query(KnowledgeChunkRecord).join(KnowledgeDocumentRecord)
        if category:
            records = records.filter(KnowledgeDocumentRecord.category == category)
        scored = []
        for record in records.all():
            lexical = lexical_overlap_score(query, record.chunk_text)
            semantic = cosine_similarity(query_embedding, record.embedding)
            final_score = lexical * 0.45 + semantic * 0.55
            scored.append((final_score, lexical, semantic, record))
        scored.sort(key=lambda item: item[0], reverse=True)
        results = []
        for final_score, lexical, semantic, record in scored[:top_k]:
            results.append(
                KnowledgeChunkResult(
                    chunk_id=record.id,
                    document_name=record.document.name,
                    category=record.document.category,
                    chunk_text=record.chunk_text,
                    lexical_score=round(lexical, 4),
                    semantic_score=round(semantic, 4),
                    final_score=round(final_score, 4),
                )
            )
        return results


class CandidateRecallService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.embedding_service = EmbeddingService()

    def rank_candidates(self, job_profile: StructuredJobProfile, top_k: int = 10) -> list[CandidateRankingItem]:
        query = ' '.join([
            job_profile.role,
            job_profile.summary,
            *job_profile.must_have_skills,
            *job_profile.preferred_skills,
            *job_profile.keywords,
        ])
        query_embedding = self.embedding_service.embed_texts([query])[0]
        rankings = []
        for candidate in self.db.query(CandidateRecord).all():
            lexical = lexical_overlap_score(query, candidate.profile_text)
            vector = cosine_similarity(query_embedding, candidate.embedding)
            score = lexical * 0.4 + vector * 0.6
            structured = candidate.structured
            skills = structured.get('skills', [])
            matched_skills = [skill for skill in job_profile.must_have_skills if skill.lower() in ' '.join(skills).lower()]
            rankings.append(
                CandidateRankingItem(
                    candidate_id=candidate.id,
                    candidate_name=candidate.name,
                    recall_score=round(score, 4),
                    vector_score=round(vector, 4),
                    lexical_score=round(lexical, 4),
                    matched_skills=matched_skills,
                    match_hint=' / '.join(matched_skills[:4]) or '待补充人工判断',
                )
            )
        rankings.sort(key=lambda item: item.recall_score, reverse=True)
        return rankings[:top_k]


def build_candidate_profile_text(candidate_profile: dict) -> str:
    projects = candidate_profile.get('projects', [])
    project_blob = ' '.join(
        f"{item.get('name', '')} {' '.join(item.get('highlights', []))} {' '.join(item.get('tech_stack', []))}"
        for item in projects
    )
    return ' '.join([
        candidate_profile.get('name', ''),
        candidate_profile.get('current_title', ''),
        ' '.join(candidate_profile.get('skills', [])),
        ' '.join(candidate_profile.get('strengths', [])),
        project_blob,
    ]).strip()


def json_dumps(value) -> str:
    import json
    return json.dumps(value, ensure_ascii=False)

