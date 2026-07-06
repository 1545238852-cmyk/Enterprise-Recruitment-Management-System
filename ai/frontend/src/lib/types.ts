export type DashboardMetrics = {
  jobs: number
  candidates: number
  knowledge_documents: number
  screenings: number
  recommended_candidates: number
  average_match_score: number
}

export type Job = {
  id: number
  title: string
  raw_description: string
  structured_profile: {
    role: string
    summary: string
    must_have_skills: string[]
    preferred_skills: string[]
    responsibilities: string[]
    soft_skills: string[]
    min_years_experience: number
    education_requirement: string
    location_requirement: string
    keywords: string[]
  }
  created_at: string
  llm_provider: string
}

export type Candidate = {
  id: number
  name: string
  source_filename?: string | null
  raw_resume_text: string
  structured_profile: {
    name: string
    current_title: string
    skills: string[]
    strengths: string[]
    years_experience: number
    education: string
    location: string
    industries: string[]
    risk_flags: string[]
    projects: { name: string; role: string; highlights: string[]; tech_stack: string[] }[]
  }
  created_at: string
  llm_provider: string
}

export type KnowledgeDocument = {
  id: number
  name: string
  category: string
  chunk_count: number
  created_at: string
}

export type CandidateRecallResponse = {
  job_id: number
  query: string
  rankings: {
    candidate_id: number
    candidate_name: string
    recall_score: number
    vector_score: number
    lexical_score: number
    match_hint: string
    matched_skills: string[]
  }[]
}

export type Screening = {
  id: number
  job_id: number
  candidate_id: number
  decision: string
  score: number
  created_at: string
  report: {
    workflow_log: string[]
    hard_screen: {
      passed: boolean
      matched_requirements: string[]
      missing_requirements: string[]
      notes: string[]
    }
    match_analysis: {
      match_score: number
      matched_points: string[]
      missing_points: string[]
      risk_points: string[]
      recommendation: string
      interview_focus: string[]
      citations: string[]
      summary: string
    }
    interview_plan: {
      overall_goal: string
      questions: { category: string; question: string; why_it_matters: string }[]
    }
    retrieved_contexts: { document_name: string; category: string; final_score: number; chunk_text: string }[]
  }
}

export type FeedbackSummaryResponse = {
  id: number
  screening_id: number
  raw_feedback: string
  created_at: string
  llm_provider: string
  summary: {
    technical_strengths: string[]
    concerns: string[]
    communication_signal: string
    next_step_recommendation: string
    final_summary: string
  }
}

export type RetrievalEvalResponse = {
  generated_at: string
  total_jobs_evaluated: number
  total_candidates: number
  dataset_type: string
  strategy_notes: string[]
  summary: {
    recall_at_1: number
    recall_at_3: number
    recall_at_5: number
    precision_at_3: number
    mrr: number
  }
  cases: {
    job_id: number
    job_title: string
    relevant_candidate_ids: number[]
    ranked_candidate_ids: number[]
    recall_at_1: number
    recall_at_3: number
    recall_at_5: number
    precision_at_3: number
    mrr: number
  }[]
}
