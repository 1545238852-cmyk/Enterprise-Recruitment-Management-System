from __future__ import annotations

import json
import re
from typing import Any, Protocol, Type

import httpx
from openai import OpenAI
from pydantic import BaseModel, ValidationError

from .config import get_settings
from .prompts import (
    FEEDBACK_SYSTEM_PROMPT,
    INTERVIEW_SYSTEM_PROMPT,
    JD_SYSTEM_PROMPT,
    MATCH_SYSTEM_PROMPT,
    RESUME_SYSTEM_PROMPT,
)
from .schemas import (
    FeedbackSummary,
    InterviewPlan,
    MatchAnalysis,
    ProjectSummary,
    StructuredCandidateProfile,
    StructuredJobProfile,
)


class RecruitingLLM(Protocol):
    provider_name: str

    def parse_job(self, title: str | None, description: str) -> StructuredJobProfile: ...
    def parse_resume(self, resume_text: str) -> StructuredCandidateProfile: ...
    def analyze_match(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, retrieved_contexts: list[str], hard_screen_notes: list[str] | None = None) -> MatchAnalysis: ...
    def generate_interview_plan(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, analysis: MatchAnalysis) -> InterviewPlan: ...
    def summarize_feedback(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, feedback_text: str) -> FeedbackSummary: ...



class OpenAIRecruitingLLM:
    provider_name = 'openai'

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.openai_api_key:
            raise ValueError('LLM_PROVIDER=openai but OPENAI_API_KEY is missing.')
        self.model = settings.openai_model
        self.base_url = (settings.openai_base_url or '').rstrip('/') or None
        self.client = OpenAI(api_key=settings.openai_api_key, base_url=self.base_url)
        self.use_chat_json_mode = self.base_url is not None

    def _extract_message_text(self, message: Any) -> str:
        content = getattr(message, 'content', None)
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                    continue
                text_value = getattr(item, 'text', None)
                if isinstance(text_value, str):
                    parts.append(text_value)
                    continue
                if isinstance(item, dict):
                    if isinstance(item.get('text'), str):
                        parts.append(item['text'])
                    elif item.get('type') == 'text' and isinstance(item.get('value'), str):
                        parts.append(item['value'])
            return '\n'.join(part.strip() for part in parts if part and part.strip()).strip()
        return ''

    def _extract_json_string(self, text: str) -> str:
        payload = text.strip()
        if payload.startswith('```'):
            payload = re.sub(r'^```(?:json)?\s*', '', payload)
            payload = re.sub(r'\s*```$', '', payload)
            payload = payload.strip()
        if payload.startswith('{') or payload.startswith('['):
            return payload
        start_candidates = [idx for idx in (payload.find('{'), payload.find('[')) if idx != -1]
        if not start_candidates:
            return payload
        start_idx = min(start_candidates)
        end_char = '}' if payload[start_idx] == '{' else ']'
        end_idx = payload.rfind(end_char)
        if end_idx == -1 or end_idx < start_idx:
            return payload[start_idx:]
        return payload[start_idx:end_idx + 1]

    def _parse_with_responses(self, system_prompt: str, user_prompt: str, schema_type: Type[BaseModel]):
        response = self.client.responses.parse(
            model=self.model,
            input=user_prompt,
            instructions=system_prompt,
            text_format=schema_type,
            temperature=0.2,
        )
        if response.output_parsed is None:
            raise ValueError('Model did not return structured output.')
        return response.output_parsed

    def _parse_with_chat_json(self, system_prompt: str, user_prompt: str, schema_type: Type[BaseModel]):
        schema_json = json.dumps(schema_type.model_json_schema(), ensure_ascii=False, indent=2)
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    'role': 'system',
                    'content': (
                        f'{system_prompt}\n\n'
                        'Return strict JSON only. The output must match the given JSON schema. '
                        'Do not use markdown fences. Do not add explanation text. Do not add extra fields.'
                    ),
                },
                {
                    'role': 'user',
                    'content': (
                        f'JSON schema:\n{schema_json}\n\n'
                        f'Input:\n{user_prompt}\n\n'
                        'Return JSON now.'
                    ),
                },
            ],
            response_format={'type': 'json_object'},
            temperature=0.2,
        )
        if not completion.choices:
            raise ValueError('Model returned no choices.')
        message = completion.choices[0].message
        text = self._extract_message_text(message)
        if not text:
            raise ValueError('Model returned empty content.')
        payload = self._extract_json_string(text)
        parsed = json.loads(payload)
        return schema_type.model_validate(parsed)

    def _parse(self, system_prompt: str, user_prompt: str, schema_type: Type[BaseModel]):
        if self.use_chat_json_mode:
            return self._parse_with_chat_json(system_prompt, user_prompt, schema_type)
        return self._parse_with_responses(system_prompt, user_prompt, schema_type)

    def parse_job(self, title: str | None, description: str) -> StructuredJobProfile:
        prompt = f"""Job title: {title or 'Not provided'}

Job description:
{description}"""
        return self._parse(JD_SYSTEM_PROMPT, prompt, StructuredJobProfile)

    def parse_resume(self, resume_text: str) -> StructuredCandidateProfile:
        prompt = f"""Candidate resume:
{resume_text}"""
        return self._parse(RESUME_SYSTEM_PROMPT, prompt, StructuredCandidateProfile)

    def analyze_match(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, retrieved_contexts: list[str], hard_screen_notes: list[str] | None = None) -> MatchAnalysis:
        hard_screen_notes = hard_screen_notes or []
        prompt = f"""Job profile:
{job.model_dump_json(indent=2, ensure_ascii=False)}

Candidate profile:
{candidate.model_dump_json(indent=2, ensure_ascii=False)}

Hard screen notes:
{json.dumps(hard_screen_notes, ensure_ascii=False, indent=2)}

Retrieved contexts:
{json.dumps(retrieved_contexts, ensure_ascii=False, indent=2)}"""
        return self._parse(MATCH_SYSTEM_PROMPT, prompt, MatchAnalysis)

    def generate_interview_plan(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, analysis: MatchAnalysis) -> InterviewPlan:
        prompt = f"""Job profile:
{job.model_dump_json(indent=2, ensure_ascii=False)}

Candidate profile:
{candidate.model_dump_json(indent=2, ensure_ascii=False)}

Match analysis:
{analysis.model_dump_json(indent=2, ensure_ascii=False)}"""
        return self._parse(INTERVIEW_SYSTEM_PROMPT, prompt, InterviewPlan)

    def summarize_feedback(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, feedback_text: str) -> FeedbackSummary:
        prompt = f"""Job profile:
{job.model_dump_json(indent=2, ensure_ascii=False)}

Candidate profile:
{candidate.model_dump_json(indent=2, ensure_ascii=False)}

Interview feedback:
{feedback_text}"""
        return self._parse(FEEDBACK_SYSTEM_PROMPT, prompt, FeedbackSummary)

class DifyRecruitingLLM:
    provider_name = 'dify'
    TASK_KEY_FIELDS = {
        'job': 'dify_job_api_key',
        'resume': 'dify_resume_api_key',
        'match': 'dify_match_api_key',
        'interview': 'dify_interview_api_key',
        'feedback': 'dify_feedback_api_key',
    }

    def __init__(self) -> None:
        self.settings = get_settings()
        if not self.settings.dify_api_base:
            raise ValueError('LLM_PROVIDER=dify but DIFY_API_BASE is missing.')
        self.base_url = self.settings.dify_api_base.rstrip('/')

    def _headers_for_task(self, task_name: str) -> dict[str, str]:
        field_name = self.TASK_KEY_FIELDS[task_name]
        api_key = getattr(self.settings, field_name) or self.settings.dify_api_key
        if not api_key:
            raise ValueError(
                f'Missing Dify API key for task {task_name}. Set {field_name.upper()} or the shared DIFY_API_KEY.'
            )
        return {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}

    def _parse_output_candidate(self, candidate: Any, output_model: Type[BaseModel]):
        if candidate is None:
            raise ValueError('empty candidate')
        if isinstance(candidate, output_model):
            return candidate
        if isinstance(candidate, dict):
            return output_model.model_validate(candidate)
        if isinstance(candidate, str):
            text = candidate.strip()
            if not text:
                raise ValueError('empty string candidate')
            if text.startswith('```'):
                text = re.sub(r'^```(?:json)?\s*', '', text)
                text = re.sub(r'\s*```$', '', text)
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return output_model.model_validate(parsed)
        raise ValueError('unsupported candidate shape')

    def _coerce_output(self, outputs: Any, output_model: Type[BaseModel]):
        candidates: list[Any] = [outputs]
        if isinstance(outputs, dict):
            priority_keys = ['result', 'json', 'data', 'output', 'structured_output', 'answer', 'text']
            for key in priority_keys:
                if key in outputs:
                    candidates.append(outputs[key])
            candidates.extend(outputs.values())

        last_error: Exception | None = None
        for candidate in candidates:
            try:
                return self._parse_output_candidate(candidate, output_model)
            except (ValueError, ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
                continue

        preview = str(outputs)
        if len(preview) > 400:
            preview = preview[:400] + '...'
        raise ValueError(f'Dify output cannot be parsed into {output_model.__name__}: {preview}') from last_error

    def _run_workflow(self, task_name: str, inputs: dict[str, Any], output_model: Type[BaseModel]):
        payload = {
            'inputs': inputs,
            'response_mode': 'blocking',
            'user': 'recruiting-agent',
        }
        response = httpx.post(
            f'{self.base_url}/workflows/run',
            headers=self._headers_for_task(task_name),
            json=payload,
            timeout=90,
        )
        response.raise_for_status()
        data = response.json()
        workflow_data = data.get('data') if isinstance(data, dict) else None
        if isinstance(workflow_data, dict):
            status = workflow_data.get('status')
            if status in {'failed', 'stopped'}:
                raise ValueError(f'Dify workflow failed: {workflow_data.get("error") or status}')
            outputs = workflow_data.get('outputs')
        else:
            outputs = None
        outputs = outputs or (data.get('outputs') if isinstance(data, dict) else None) or {}
        return self._coerce_output(outputs, output_model)

    def parse_job(self, title: str | None, description: str) -> StructuredJobProfile:
        return self._run_workflow('job', {'title': title or '', 'description': description}, StructuredJobProfile)

    def parse_resume(self, resume_text: str) -> StructuredCandidateProfile:
        return self._run_workflow('resume', {'resume_text': resume_text}, StructuredCandidateProfile)

    def analyze_match(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, retrieved_contexts: list[str], hard_screen_notes: list[str] | None = None) -> MatchAnalysis:
        return self._run_workflow(
            'match',
            {
                'job': job.model_dump(),
                'candidate': candidate.model_dump(),
                'retrieved_contexts': retrieved_contexts,
                'hard_screen_notes': hard_screen_notes or [],
            },
            MatchAnalysis,
        )

    def generate_interview_plan(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, analysis: MatchAnalysis) -> InterviewPlan:
        return self._run_workflow(
            'interview',
            {'job': job.model_dump(), 'candidate': candidate.model_dump(), 'analysis': analysis.model_dump()},
            InterviewPlan,
        )

    def summarize_feedback(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, feedback_text: str) -> FeedbackSummary:
        return self._run_workflow(
            'feedback',
            {'job': job.model_dump(), 'candidate': candidate.model_dump(), 'feedback_text': feedback_text},
            FeedbackSummary,
        )


class HeuristicRecruitingLLM:
    provider_name = 'mock'
    YEAR_PATTERN = re.compile(r'(\d+(?:\.\d+)?)\s*年')

    def parse_job(self, title: str | None, description: str) -> StructuredJobProfile:
        must_have = self._extract_keywords(description, ['Python', 'Java', 'SQL', 'FastAPI', 'RAG', 'Agent', 'LLM', 'Docker', 'Kubernetes'])
        preferred = self._extract_keywords(description, ['LangGraph', 'LangChain', '向量检索', '微服务', '数据分析', '大模型'])
        years = self._extract_years(description)
        return StructuredJobProfile(
            role=title or 'AI 应用开发工程师',
            summary=description[:220],
            must_have_skills=must_have,
            preferred_skills=preferred,
            responsibilities=[line.strip(' -1234567890.') for line in description.splitlines() if line.strip()][:6],
            soft_skills=[item for item in ['沟通能力', '自驱力', '团队协作'] if item in description],
            min_years_experience=years,
            education_requirement='本科及以上' if '本科' in description else '不限',
            location_requirement='不限',
            keywords=list(dict.fromkeys(must_have + preferred)),
        )

    def parse_resume(self, resume_text: str) -> StructuredCandidateProfile:
        skills = self._extract_keywords(resume_text, ['Python', 'FastAPI', 'SQL', 'RAG', 'Agent', 'LangChain', 'LangGraph', 'Redis', 'MySQL', 'PostgreSQL', 'Docker'])
        projects = self._extract_projects(resume_text, skills)
        return StructuredCandidateProfile(
            name=self._guess_name(resume_text),
            current_title='AI应用工程师' if 'AI' in resume_text or '大模型' in resume_text else '后端工程师',
            years_experience=float(self._extract_years(resume_text)),
            education='本科' if '本科' in resume_text else '未知',
            location='未知',
            skills=skills,
            industries=[item for item in ['SaaS', '电商', '金融', '教育'] if item in resume_text],
            strengths=self._strengths(resume_text, skills),
            projects=projects,
            risk_flags=self._risks(resume_text),
        )

    def analyze_match(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, retrieved_contexts: list[str], hard_screen_notes: list[str] | None = None) -> MatchAnalysis:
        hard_screen_notes = hard_screen_notes or []
        blob = ' '.join(candidate.skills + candidate.strengths + [p.name + ' ' + ' '.join(p.highlights) for p in candidate.projects]).lower()
        matched = [skill for skill in job.must_have_skills if skill.lower() in blob]
        missing = [skill for skill in job.must_have_skills if skill.lower() not in blob]
        preferred_hit = [skill for skill in job.preferred_skills if skill.lower() in blob]
        score = 48 + len(matched) * 10 + len(preferred_hit) * 4 + min(int(candidate.years_experience), 6) * 2 - len(missing) * 6
        score = max(20, min(97, score))
        if score >= 82:
            recommendation = '建议二面'
        elif score >= 68:
            recommendation = '建议一面'
        elif score >= 50:
            recommendation = '待定'
        else:
            recommendation = '淘汰'
        citations = [context[:120] for context in retrieved_contexts[:3]]
        return MatchAnalysis(
            match_score=score,
            matched_points=[f'命中技能：{item}' for item in matched] + [f'加分项：{item}' for item in preferred_hit],
            missing_points=missing,
            risk_points=list(dict.fromkeys(candidate.risk_flags + hard_screen_notes))[:6],
            recommendation=recommendation,
            interview_focus=[f'{item} 的真实项目经验' for item in missing[:3]] + candidate.strengths[:2],
            summary='候选人具备一定相关背景，建议结合检索证据和项目深度进行人工复核。',
            citations=citations,
        )

    def generate_interview_plan(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, analysis: MatchAnalysis) -> InterviewPlan:
        questions = []
        for focus in analysis.interview_focus[:4]:
            questions.append({'category': 'risk_validation', 'question': f'请展开说明：{focus}。', 'why_it_matters': '验证候选人的真实掌握程度。'})
        for project in candidate.projects[:2]:
            questions.append({'category': 'project_deep_dive', 'question': f'在项目《{project.name}》中，你的关键设计决策是什么？', 'why_it_matters': '验证个人贡献与设计能力。'})
        return InterviewPlan(overall_goal='确认候选人的真实经验、关键技能深度与岗位适配度。', questions=questions[:6])

    def summarize_feedback(self, job: StructuredJobProfile, candidate: StructuredCandidateProfile, feedback_text: str) -> FeedbackSummary:
        strengths = ['项目表达较完整'] if '清晰' in feedback_text or '扎实' in feedback_text else ['具备一定相关经验']
        concerns = ['部分关键问题回答不够扎实'] if any(token in feedback_text for token in ['模糊', '欠缺', '答不上来']) else []
        if '下一轮' in feedback_text or '推荐' in feedback_text:
            next_step = '建议进入下一轮'
        elif 'offer' in feedback_text.lower():
            next_step = '建议发 offer'
        elif '淘汰' in feedback_text:
            next_step = '淘汰'
        else:
            next_step = '待定'
        communication = '沟通表达较好。' if '表达清晰' in feedback_text or '沟通顺畅' in feedback_text else '沟通情况需结合更多记录综合判断。'
        return FeedbackSummary(
            technical_strengths=strengths,
            concerns=concerns,
            communication_signal=communication,
            next_step_recommendation=next_step,
            final_summary='已完成结构化总结，请结合招聘优先级和面试官意见做最终决策。',
        )

    def _extract_keywords(self, text: str, items: list[str]) -> list[str]:
        text_lower = text.lower()
        return [item for item in items if item.lower() in text_lower]

    def _extract_years(self, text: str) -> int:
        match = self.YEAR_PATTERN.search(text)
        return int(float(match.group(1))) if match else 0

    def _guess_name(self, text: str) -> str:
        first = next((line.strip() for line in text.splitlines() if line.strip()), '未知候选人')
        return first[:20]

    def _extract_projects(self, text: str, skills: list[str]) -> list[ProjectSummary]:
        lines = [line.strip(' -•\t') for line in text.splitlines() if line.strip()]
        project_lines = [line for line in lines if '项目' in line or '系统' in line or '平台' in line][:3]
        if not project_lines:
            project_lines = ['候选人代表项目']
        return [ProjectSummary(name=line[:40], role='核心开发', highlights=[line[:70]], tech_stack=skills[:5]) for line in project_lines]

    def _strengths(self, text: str, skills: list[str]) -> list[str]:
        strengths = []
        if 'RAG' in skills or 'Agent' in skills:
            strengths.append('具备大模型应用落地经验')
        if len({'Python', 'FastAPI', 'SQL'} & set(skills)) >= 2:
            strengths.append('具备后端服务与数据处理能力')
        if '项目' in text:
            strengths.append('有可深挖的项目经历')
        return strengths or ['具备基础技术背景']

    def _risks(self, text: str) -> list[str]:
        risks = []
        if len(text) < 180:
            risks.append('简历信息较少，需人工复核')
        if '负责' not in text and '主导' not in text:
            risks.append('个人贡献描述偏弱')
        return risks


def get_llm() -> RecruitingLLM:
    settings = get_settings()
    if settings.llm_provider == 'openai':
        return OpenAIRecruitingLLM()
    if settings.llm_provider == 'dify':
        return DifyRecruitingLLM()
    return HeuristicRecruitingLLM()
