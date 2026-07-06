'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '@/lib/api'
import { Candidate, FeedbackSummaryResponse, Job, Screening } from '@/lib/types'
import { safeText } from '@/lib/display'

function formatDecision(decision: string) {
  const mapping: Record<string, string> = {
    proceed: '建议进入下一轮',
    hold: '建议继续观察',
    reject: '暂不推荐推进',
  }
  return mapping[decision] ?? decision
}

export default function ScreeningsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('')
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | ''>('')
  const [feedbackText, setFeedbackText] = useState('候选人表达清晰，项目经历比较扎实，建议进入下一轮，后续重点了解实际落地能力。')
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
      setMessage('请先选择岗位和候选人。')
      return
    }

    setCreating(true)
    setMessage('')

    try {
      await apiPost<Screening>(`/screenings?job_id=${selectedJobId}&candidate_id=${selectedCandidateId}`)
      setMessage('筛选建议已生成，可以直接查看匹配情况和面试重点。')
      await loadAll()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '生成筛选建议失败')
    } finally {
      setCreating(false)
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!feedbackScreeningId) {
      setMessage('请先选择一条筛选记录。')
      return
    }

    setSummarizing(true)
    setMessage('')

    try {
      const summary = await apiPost<FeedbackSummaryResponse>(`/screenings/${feedbackScreeningId}/feedback`, {
        feedback_text: feedbackText,
      })
      setLatestSummary(summary)
      setMessage('面试反馈已整理完成。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '反馈整理失败')
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
          <h2 className="hero-title">让每一次筛选都有理由、有结论，也方便团队复盘。</h2>
          <p className="hero-text">
            这一页可以发起候选人筛选，也可以把面试官的原始反馈整理成统一格式。这样不管是招聘、业务面试官还是负责人，都能看懂结论和依据。
          </p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">页面里的两件事</div>
          <div className="step-list">
            <div className="step-item">
              <strong>先生成筛选建议</strong>
              <span>系统会输出匹配情况、风险点、面试重点和参考资料。</span>
            </div>
            <div className="step-item">
              <strong>再整理面试反馈</strong>
              <span>把零散反馈整理成统一结论，方便流转和沉淀。</span>
            </div>
            <div className="step-item">
              <strong>最后保留历史记录</strong>
              <span>后面复盘时，可以回看每次是如何做出判断的。</span>
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
              <p className="card-subtitle">选择岗位和候选人后，系统会自动生成一份筛选建议。</p>
            </div>
            <span className="badge">第一步</span>
          </div>
          <div className="form-grid">
            <div>
              <label className="label">选择岗位</label>
              <select className="select" value={selectedJobId} onChange={(e) => setSelectedJobId(Number(e.target.value))}>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>#{job.id} {safeText(job.title, '\u65e7\u5c97\u4f4d\u6570\u636e\u5f02\u5e38')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">选择候选人</label>
              <select className="select" value={selectedCandidateId} onChange={(e) => setSelectedCandidateId(Number(e.target.value))}>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>#{candidate.id} {safeText(candidate.name, '\u65e7\u5019\u9009\u4eba\u6570\u636e\u5f02\u5e38')}</option>
                ))}
              </select>
            </div>
            <div className="actions">
              <button className="button" disabled={creating} onClick={() => void handleCreate()} type="button">
                {creating ? '生成中...' : '生成筛选建议'}
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
              <h3 className="card-title">整理面试反馈</h3>
              <p className="card-subtitle">把面试官的原始反馈贴进来，系统会自动整理成统一格式。</p>
            </div>
            <span className="badge">第二步</span>
          </div>
          <form className="form-grid" onSubmit={handleFeedbackSubmit}>
            <div>
              <label className="label">选择筛选记录</label>
              <select className="select" value={feedbackScreeningId} onChange={(e) => setFeedbackScreeningId(Number(e.target.value))}>
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
              <h3 className="card-title">最新筛选建议</h3>
              <p className="card-subtitle">这里展示最近一次生成的筛选结果和判断依据。</p>
            </div>
          </div>
          {!latestScreening && <div className="empty">暂时还没有筛选记录，请先生成一条筛选建议。</div>}
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
                <strong>符合要求的点</strong>
                <div className="small">{latestScreening.report.hard_screen.matched_requirements.join('、') || '暂无'}</div>
                <div className="small">暂时欠缺：{latestScreening.report.hard_screen.missing_requirements.join('、') || '无'}</div>
              </div>
              <div className="list-item elevated">
                <strong>匹配说明</strong>
                <div className="small">{latestScreening.report.match_analysis.summary}</div>
                <div className="small">需要关注：{latestScreening.report.match_analysis.risk_points.join('、') || '无'}</div>
                <div className="small">建议结论：{latestScreening.report.match_analysis.recommendation || '暂无'}</div>
              </div>
              <div className="list-item elevated">
                <strong>建议重点追问</strong>
                <ul className="bullet-list compact-list">
                  {latestScreening.report.interview_plan.questions.map((q, index) => (
                    <li key={`${q.category}-${index}`}>
                      <strong>{q.category}</strong>：{q.question}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="list-item elevated">
                <strong>参考资料</strong>
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
              <h3 className="card-title">反馈整理结果</h3>
              <p className="card-subtitle">把零散反馈统一成更适合汇报和流转的结论。</p>
            </div>
          </div>
          {!latestSummary && <div className="empty">提交一段面试反馈后，这里会显示整理后的结论。</div>}
          {latestSummary && (
            <div className="table-list">
              <div className="list-item elevated">
                <strong>技术亮点</strong>
                <div className="small">{latestSummary.summary.technical_strengths.join('、') || '暂无'}</div>
              </div>
              <div className="list-item elevated">
                <strong>需要关注</strong>
                <div className="small">{latestSummary.summary.concerns.join('、') || '暂无'}</div>
              </div>
              <div className="list-item elevated">
                <strong>沟通表现</strong>
                <div className="small">{latestSummary.summary.communication_signal}</div>
              </div>
              <div className="list-item elevated">
                <strong>下一步建议</strong>
                <div className="small">{latestSummary.summary.next_step_recommendation}</div>
              </div>
              <div className="list-item elevated">
                <strong>总结</strong>
                <div className="small">{latestSummary.summary.final_summary}</div>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h3 className="card-title">历史筛选记录</h3>
            <p className="card-subtitle">所有筛选记录都会保留，方便后续复盘和优化推荐逻辑。</p>
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
                <span className="score-pill">推荐分 {screening.score}</span>
                <span className="score-pill">{new Date(screening.created_at).toLocaleString()}</span>
              </div>
              <div className="small">处理过程：{screening.report.workflow_log.join(' → ')}</div>
            </div>
          ))}
          {!loading && screenings.length === 0 && <div className="empty">暂时还没有筛选记录。</div>}
          {loading && <div className="empty">正在加载筛选记录...</div>}
        </div>
      </section>
    </div>
  )
}
