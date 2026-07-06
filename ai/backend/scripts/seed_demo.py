from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.db import CandidateRecord, JobRecord, KnowledgeDocumentRecord, SessionLocal, init_db
from backend.app.llm import HeuristicRecruitingLLM
from backend.app.schemas import CandidateCreateRequest, JobCreateRequest, KnowledgeIngestRequest
from backend.app.services.recruitment import RecruitmentPlatformService

SAMPLE_DIR = ROOT / 'backend' / 'sample_data'


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
      if db.query(JobRecord).count() or db.query(CandidateRecord).count() or db.query(KnowledgeDocumentRecord).count():
          print('Database already contains demo data or existing records. Skip seeding.')
          return

      service = RecruitmentPlatformService(db=db, llm=HeuristicRecruitingLLM())

      job_text = (SAMPLE_DIR / 'job_ai_engineer.txt').read_text(encoding='utf-8')
      resume_text = (SAMPLE_DIR / 'resume_candidate_zhangsan.txt').read_text(encoding='utf-8')
      guide_text = (SAMPLE_DIR / 'knowledge_interview_guide.txt').read_text(encoding='utf-8')
      playbook_text = (SAMPLE_DIR / 'knowledge_hiring_playbook.txt').read_text(encoding='utf-8')
      rag_text = (SAMPLE_DIR / 'knowledge_rag_quality.txt').read_text(encoding='utf-8')

      service.create_job(JobCreateRequest(title='AI 应用开发工程师', description=job_text))
      service.create_candidate(CandidateCreateRequest(resume_text=resume_text, source_filename='resume_candidate_zhangsan.txt'))
      service.create_candidate(CandidateCreateRequest(
          resume_text='李四\n6年经验\n现任后端 / AI 平台工程师\n熟悉 Python、FastAPI、RAG、LangGraph、Docker、PostgreSQL、Redis\n主导企业知识库、智能问答和招聘平台项目，负责召回排序与服务部署。',
          source_filename='resume_candidate_lisi.txt',
      ))
      service.ingest_knowledge(KnowledgeIngestRequest(name='面试评估指南', category='interview_guide', content=guide_text))
      service.ingest_knowledge(KnowledgeIngestRequest(name='招聘 Playbook', category='playbook', content=playbook_text))
      service.ingest_knowledge(KnowledgeIngestRequest(name='RAG 质量优化', category='faq', content=rag_text))
      print('Demo data seeded successfully.')
    finally:
      db.close()


if __name__ == '__main__':
    main()
