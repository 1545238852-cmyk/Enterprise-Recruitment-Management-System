from app.llm import HeuristicRecruitingLLM
from app.schemas import StructuredCandidateProfile, StructuredJobProfile


def test_heuristic_job_and_resume_parsing():
    llm = HeuristicRecruitingLLM()
    job = llm.parse_job('AI 应用开发工程师', '3年以上 Python 和 RAG 经验，熟悉 Agent 和 FastAPI，本科及以上。')
    candidate = llm.parse_resume('张三\n4年经验\n熟悉 Python、FastAPI、RAG、Agent\n负责企业知识库项目开发。')
    assert 'Python' in job.must_have_skills
    assert candidate.name == '张三'
    assert 'RAG' in candidate.skills


def test_match_analysis_score_range():
    llm = HeuristicRecruitingLLM()
    job = StructuredJobProfile(
        role='AI 应用开发工程师',
        summary='test',
        must_have_skills=['Python', 'RAG', 'Agent'],
        preferred_skills=['LangGraph'],
        responsibilities=[],
        soft_skills=[],
        min_years_experience=3,
        education_requirement='本科及以上',
        location_requirement='不限',
        keywords=['Python', 'RAG', 'Agent'],
    )
    candidate = StructuredCandidateProfile(
        name='张三',
        current_title='AI应用工程师',
        years_experience=4,
        education='本科',
        location='上海',
        expected_salary=None,
        skills=['Python', 'RAG', 'Agent'],
        industries=[],
        strengths=['具备大模型应用落地相关经验'],
        projects=[],
        risk_flags=[],
    )
    analysis = llm.analyze_match(job, candidate, [])
    assert 0 <= analysis.match_score <= 100
    assert analysis.recommendation in {'淘汰', '待定', '建议一面', '建议二面'}
