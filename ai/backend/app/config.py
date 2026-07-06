from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / '.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    app_name: str = 'Intelligent Recruiting Assistant'
    app_env: str = 'development'
    api_prefix: str = '/api'
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'recruit_agent.db').as_posix()}"
    cors_origins: list[str] = Field(default_factory=lambda: ['http://localhost:3000', 'http://127.0.0.1:3000'])

    llm_provider: Literal['mock', 'openai', 'dify'] = 'mock'
    embedding_provider: Literal['auto', 'mock', 'openai'] = 'auto'
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_model: str = 'gpt-5.4-mini'
    embedding_model: str = 'text-embedding-3-small'

    dify_api_base: str | None = None
    dify_api_key: str | None = None
    dify_job_api_key: str | None = None
    dify_resume_api_key: str | None = None
    dify_match_api_key: str | None = None
    dify_interview_api_key: str | None = None
    dify_feedback_api_key: str | None = None

    retrieval_top_k: int = 6
    rerank_top_k: int = 8
    embedding_dimensions: int = 96
    chunk_size: int = 420
    chunk_overlap: int = 80

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors(cls, value):
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                return [item.strip() for item in value.split(',') if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
