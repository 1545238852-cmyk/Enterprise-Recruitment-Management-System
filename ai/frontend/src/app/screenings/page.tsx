'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '@/lib/api'
import { safeText } from '@/lib/display'
import { Candidate, FeedbackSummaryResponse, Job, Screening } from '@/lib/types'

function formatDecision(decision: string) {
  const mapping: Record<string, string> = {
    proceed: '进入下一轮',
    hold: '继续观察',
    reject: '暂不推进',
  }
  return mapping[decision] ?? decision
}

export default function ScreeningsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('')
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | ''>('')
  const [feedbackText, setFeedbackText] = useState('候选人表达清晰，项目经历扎实，建议进入下一轮，后续重点核实落地深度。')
  const [feedbackScreeningId, setFeedbackScreeningId] = useState<number | ''>('')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [latestSummary, setLatestSummary] = useState<FeedbackSummaryResponse | null>(null)

  async function loadAll() {
    setLoading(true)
    try {
      const [jobData, candidateData, screeningData] = await Promise.all([
        apiGet<Job[]>('/jobs'),
        apiGet<Candidate[]>('/candidates'),
        apiGet<Screening[]>('/screenings'),
      ])

      const nextJobs = jobData ?? []
      const nextCandidates = candidateData ?? []
      const nextScreenings = screeningData ?? []

      setJobs(nextJobs)
      setCandidates(nextCandidates)
      setScreenings(nextScreenings)

      if (!selectedJobId && nextJobs[0]) setSelectedJobId(nextJobs[0].id)
      if (!selectedCandidateId && nextCandidates[0]) setSelectedCandidateId(nextCandidates[0].id)
      if (!feedbackScreeningId && nextScreenings[0]) setFeedbackScreeningId(nextScreenings[0].id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate() {
    if (!selectedJobId || !selectedCandidateId) {
      setMessage('请选择岗位和候选人')
      return
    }

    setCreating(true)
    setMessage('')

    try {
      await apiPost<Screening>(`/screenings?job_id=${selectedJobId}&candidate_id=${selectedCandidateId}`)
      setMessage('筛选记录已生成')
      await loadAll()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '生成失败')
    } finally {
      setCreating(false)
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!feedbackScreeningId) {
      setMessage('请选择筛选记录')
      return
    }

    setSummarizing(true)
    setMessage('')

    try {
      const summary = await apiPost<FeedbackSummaryResponse>(`/screenings/${feedbackScreeningId}/feedback`, {
        feedback_text: feedbackText,
      })
      setLatestSummary(summary)
      setMessage('反馈已整理')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '整理失败')
    } finally {
      setSummarizing(false)
    }
  }

  const latestScreening = useMemo(() => screenings[0] ?? null, [screenings])

  return (
    <div className="page-stack">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <span className="eyebrow-chip">筛选记录</span>
          <h2 className="hero-title">筛选记录</h2>
          <p className="hero-text">发起筛选、反馈整理、历史记录</p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">当前数据</div>
          <div className="step-list">
            <div className="step-item">
              <strong>岗位数量</strong>
              <span>{jobs.length}</span>
            </div>
            <div className="step-item">
              <strong>候选人数</strong>
              <span>{candidates.length}</span>
            </div>
            <div className="step-item">
              <strong>记录数量</strong>
              <span>{screenings.length}</span>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <section className="card notice-card">
          <div className="notice-text">{message}</div>
        </section>
      )}

      <section className="grid two align-start">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">发起筛选</h3>
              <p className="card-subtitle">岗位、候选人</p>
            </div>
          </div>
          <div className="form-grid">
            <div>
              <label className="label">选择岗位</label>
              <select className="select" value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>#{job.id} {safeText(job.title, '岗位数据异常')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">选择候选人</label>
              <select className="select" value={selectedCandidateId} onChange={(e) => setSelectedCandidateId(e.target.value ? Number(e.target.value) : '')}>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>#{candidate.id} {safeText(candidate.name, '候选人数据异常')}</option>
                ))}
              </select>
            </div>
            <div className="actions">
              <button className="button" disabled={creating} onClick={() => void handleCreate()} type="button">
                {creating ? '生成中...' : '发起筛选'}
              </button>
              <button className="button subtle" onClick={() => void loadAll()} type="button" disabled={loading}>
                {loading ? '刷新中...' : '刷新数据'}
              </button>
            </div>
          </div>
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">反馈整理</h3>
              <p className="card-subtitle">筛选记录、面试反馈</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleFeedbackSubmit}>
            <div>
              <label className="label">选择记录</label>
              <select className="select" value={feedbackScreeningId} onChange={(e) => setFeedbackScreeningId(e.target.value ? Number(e.target.value) : '')}>
                {screenings.map((screening) => (
                  <option key={screening.id} value={screening.id}>
                    #{screening.id} · 岗位 {screening.job_id} / 候选人 {screening.candidate_id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">面试反馈</label>
              <textarea className="textarea" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
            </div>
            <div className="actions">
              <button className="button secondary" disabled={summarizing} type="submit">
                {summarizing ? '整理中...' : '整理反馈'}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="grid two align-start">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">最新结果</h3>
            </div>
          </div>

          {!latestScreening && <div className="empty">暂无筛选记录</div>}
          {latestScreening && (
            <div className="table-list">
              <div className="list-item elevated">
                <div className="row-between start-on-mobile">
                  <strong>筛选 #{latestScreening.id}</strong>
                  <span className="badge">{formatDecision(latestScreening.decision)} · {latestScreening.score} 分</span>
                </div>
                <div className="small">岗位 {latestScreening.job_id} / 候选人 {latestScreening.candidate_id}</div>
              </div>
              <div className="list-item elevated">
                <strong>匹配项</strong>
                <div className="small">{latestScreening.report.hard_screen.matched_requirements.join('、') || '暂无'}</div>
                <div className="small">缺失项：{latestScreening.report.hard_screen.missing_requirements.join('、') || '无'}</div>
              </div>
              <div className="list-item elevated">
                <strong>结果说明</strong>
                <div className="small">{latestScreening.report.match_analysis.summary || '暂无'}</div>
                <div className="small">关注项：{latestScreening.report.match_analysis.risk_points.join('、') || '无'}</div>
                <div className="small">结论：{latestScreening.report.match_analysis.recommendation || '暂无'}</div>
              </div>
              <div className="list-item elevated">
                <strong>面试问题</strong>
                <ul className="bullet-list compact-list">
                  {latestScreening.report.interview_plan.questions.map((q, index) => (
                    <li key={`${q.category}-${index}`}>
                      <strong>{q.category}</strong>：{q.question}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="list-item elevated">
                <strong>关联资料</strong>
                <ul className="bullet-list compact-list">
                  {latestScreening.report.retrieved_contexts.map((ctx, index) => (
                    <li key={`${ctx.document_name}-${index}`}>
                      {ctx.document_name} · {ctx.category} · 分数 {ctx.final_score}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">反馈结果</h3>
            </div>
          </div>
          {!latestSummary && <div className="empty">暂无反馈结果</div>}
          {latestSummary && (
            <div className="table-list">
              <div className="list-item elevated">
                <strong>技术亮点</strong>
                <div className="small">{latestSummary.summary.technical_strengths.join('、') || '暂无'}</div>
              </div>
              <div className="list-item elevated">
                <strong>关注项</strong>
                <div className="small">{latestSummary.summary.concerns.join('、') || '暂无'}</div>
              </div>
              <div className="list-item elevated">
                <strong>沟通表现</strong>
                <div className="small">{latestSummary.summary.communication_signal}</div>
              </div>
              <div className="list-item elevated">
                <strong>下一步</strong>
                <div className="small">{latestSummary.summary.next_step_recommendation}</div>
              </div>
              <div className="list-item elevated">
                <strong>结论</strong>
                <div className="small">{latestSummary.summary.final_summary}</div>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h3 className="card-title">历史记录</h3>
          </div>
        </div>
        <div className="table-list">
          {screenings.map((screening) => (
            <div className="list-item elevated" key={screening.id}>
              <div className="row-between start-on-mobile">
                <strong>#{screening.id} · 岗位 {screening.job_id} / 候选人 {screening.candidate_id}</strong>
                <span className="badge">{formatDecision(screening.decision)}</span>
              </div>
              <div className="score-pills">
                <span className="score-pill">评分 {screening.score}</span>
                <span className="score-pill">{new Date(screening.created_at).toLocaleString()}</span>
              </div>
              <div className="small">流程：{screening.report.workflow_log.join(' → ')}</div>
            </div>
          ))}
          {!loading && screenings.length === 0 && <div className="empty">暂无筛选记录</div>}
          {loading && <div className="empty">正在加载...</div>}
        </div>
      </section>
    </div>
  )
}
