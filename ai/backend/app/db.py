from __future__ import annotations

import json
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text, create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
connect_args = {'check_same_thread': False} if settings.database_url.startswith('sqlite') else {}
engine = create_engine(settings.database_url, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def utc_now() -> datetime:
    return datetime.now(UTC)


class JobRecord(Base):
    __tablename__ = 'jobs'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(Text)
    raw_description: Mapped[str] = mapped_column(Text)
    structured_payload: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    screenings: Mapped[list['ScreeningRecord']] = relationship(back_populates='job')

    @property
    def structured(self) -> dict:
        return json.loads(self.structured_payload)


class CandidateRecord(Base):
    __tablename__ = 'candidates'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(Text)
    source_filename: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_resume_text: Mapped[str] = mapped_column(Text)
    structured_payload: Mapped[str] = mapped_column(Text)
    profile_text: Mapped[str] = mapped_column(Text)
    embedding_payload: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    screenings: Mapped[list['ScreeningRecord']] = relationship(back_populates='candidate')

    @property
    def structured(self) -> dict:
        return json.loads(self.structured_payload)

    @property
    def embedding(self) -> list[float]:
        return json.loads(self.embedding_payload)


class KnowledgeDocumentRecord(Base):
    __tablename__ = 'knowledge_documents'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(Text)
    raw_text: Mapped[str] = mapped_column(Text)
    metadata_payload: Mapped[str] = mapped_column(Text, default='{}')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    chunks: Mapped[list['KnowledgeChunkRecord']] = relationship(back_populates='document', cascade='all, delete-orphan')


class KnowledgeChunkRecord(Base):
    __tablename__ = 'knowledge_chunks'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey('knowledge_documents.id'))
    chunk_index: Mapped[int] = mapped_column(Integer)
    chunk_text: Mapped[str] = mapped_column(Text)
    metadata_payload: Mapped[str] = mapped_column(Text, default='{}')
    embedding_payload: Mapped[str] = mapped_column(Text)
    lexical_hint: Mapped[str] = mapped_column(Text, default='')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    document: Mapped[KnowledgeDocumentRecord] = relationship(back_populates='chunks')

    @property
    def embedding(self) -> list[float]:
        return json.loads(self.embedding_payload)

    @property
    def metadata_dict(self) -> dict:
        return json.loads(self.metadata_payload)


class ScreeningRecord(Base):
    __tablename__ = 'screenings'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey('jobs.id'))
    candidate_id: Mapped[int] = mapped_column(ForeignKey('candidates.id'))
    decision: Mapped[str] = mapped_column(Text)
    score: Mapped[float] = mapped_column(Float)
    report_payload: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    job: Mapped[JobRecord] = relationship(back_populates='screenings')
    candidate: Mapped[CandidateRecord] = relationship(back_populates='screenings')
    feedback_summaries: Mapped[list['FeedbackSummaryRecord']] = relationship(back_populates='screening')

    @property
    def report(self) -> dict:
        return json.loads(self.report_payload)


class FeedbackSummaryRecord(Base):
    __tablename__ = 'feedback_summaries'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    screening_id: Mapped[int] = mapped_column(ForeignKey('screenings.id'))
    raw_feedback: Mapped[str] = mapped_column(Text)
    summary_payload: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    screening: Mapped[ScreeningRecord] = relationship(back_populates='feedback_summaries')

    @property
    def summary(self) -> dict:
        return json.loads(self.summary_payload)


REQUIRED_COLUMNS: dict[str, set[str]] = {
    'jobs': {'id', 'title', 'raw_description', 'structured_payload', 'created_at'},
    'candidates': {'id', 'name', 'source_filename', 'raw_resume_text', 'structured_payload', 'profile_text', 'embedding_payload', 'created_at'},
    'knowledge_documents': {'id', 'name', 'category', 'raw_text', 'metadata_payload', 'created_at'},
    'knowledge_chunks': {'id', 'document_id', 'chunk_index', 'chunk_text', 'metadata_payload', 'embedding_payload', 'lexical_hint', 'created_at'},
    'screenings': {'id', 'job_id', 'candidate_id', 'decision', 'score', 'report_payload', 'created_at'},
    'feedback_summaries': {'id', 'screening_id', 'raw_feedback', 'summary_payload', 'created_at'},
}


def _sqlite_schema_incompatible() -> bool:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    required_tables = set(REQUIRED_COLUMNS)
    if not required_tables.issubset(existing_tables):
        return bool(existing_tables)

    for table_name, expected_columns in REQUIRED_COLUMNS.items():
        existing_columns = {column['name'] for column in inspector.get_columns(table_name)}
        if not expected_columns.issubset(existing_columns):
            return True
    return False


def init_db() -> None:
    if settings.database_url.startswith('sqlite') and _sqlite_schema_incompatible():
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
