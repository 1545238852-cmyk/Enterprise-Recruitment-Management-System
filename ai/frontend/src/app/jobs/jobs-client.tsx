'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGetOrThrow, apiPost, getPublicApiBase } from '@/lib/api'
import { safeList, safeText, looksBrokenText } from '@/lib/display'
import { CandidateRecallResponse, Job } from '@/lib/types'

const initialForm = {
  title: '智能招聘助手开发工程师',
  description:
    '负责招聘助手平台功能开发和接口联调，要求 3 年以上 Python 经验，熟悉 FastAPI、模型接入、资料检索、候选人匹配和项目部署流程。',
}

const apiBaseLabel = getPublicApiBase()
const buildMark = '前端体验版 22:05'

type JobsClientPageProps = {
  initialJobs: Job[]
  initialError: string
}

type DeleteResponse = {
  success: boolean
  deleted_id: number
}

export default function JobsClientPage({ initialJobs, initialError }: JobsClientPageProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [loading, setLoading] = useState(initialJobs.length === 0 && !initialError)
  const [loadError, setLoadError] = useState(initialError)
  const [submitting, setSubmitting] = useState(false)
  const [recallingId, setRecallingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(initialForm)
  const [recallResult, setRecallResult] = useState<CandidateRecallResponse | null>(null)

  async function loadJobs() {
    setLoading(true)
    setLoadError('')

    try {
      const data = await apiGetOrThrow<Job[]>('/jobs')
      setJobs(data)
    } catch (error) {
      setJobs([])
      setLoadError(error instanceof Error ? error.message : '岗位列表加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialJobs.length === 0 && !initialError) {
      void loadJobs()
    }
  }, [initialJobs.length, initialError])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      await apiPost<Job>('/jobs', form)
      setMessage('岗位已保存，系统已自动整理岗位重点。')
      setForm(initialForm)
      await loadJobs()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '岗位保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRecall(jobId: number) {
    setRecallingId(jobId)
    setMessage('')
    try {
      const data = await apiPost<CandidateRecallResponse>(`/jobs/${jobId}/recall`)
      setRecallResult(data)
      setMessage('候选人推荐已生成，可以在右侧查看结果。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '推荐候选人失败')
    } finally {
      setRecallingId(null)
    }
  }

  async function handleDelete(jobId: number, title: string) {
    const ok = window.confirm(`确认删除岗位「${title}」吗？关联的筛选记录也会一起删除。`)
    if (!ok) return

    setDeletingId(jobId)
    setMessage('')
    try {
      await apiDelete<DeleteResponse>(`/jobs/${jobId}`)
      if (recallResult?.job_id === jobId) {
        setRecallResult(null)
      }
      setMessage('岗位已删除。')
      await loadJobs()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除岗位失败')
    } finally {
      setDeletingId(null)
    }
  }

  const selectedJob = useMemo(() => jobs.find((job) => job.id === recallResult?.job_id) ?? null, [jobs, recallResult])

  return (
    <div className="page-stack">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <span className="eyebrow-chip">岗位管理</span>
          <h2 className="hero-title">先把岗位录进去，系统才能更快帮你找人。</h2>
          <p className="hero-text">
            这一页主要做两件事：保存岗位说明，以及根据岗位内容一键推荐更合适的候选人。下面的岗位列表已经改成点击展开的下拉式，不会再乱滑。
          </p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">页面状态</div>
          <div className="step-list">
            <div className="step-item">
              <strong>当前前端版本</strong>
              <span>{buildMark}</span>
            </div>
            <div className="step-item">
              <strong>接口连接地址</strong>
              <span>{apiBaseLabel}</span>
            </div>
            <div className="step-item">
              <strong>旧数据提示</strong>
              <span>如果你看到“旧岗位数据异常”，说明那条旧数据之前已经被存坏了，直接删掉重建即可。</span>
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
        <article className="card" id="job-form">
          <div className="section-heading">
            <div>
              <h3 className="card-title">新增岗位</h3>
              <p className="card-subtitle">填写岗位名称和岗位说明，系统会自动整理重点要求。</p>
            </div>
            <span className="badge">第一步</span>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div>
              <label className="label">岗位名称</label>
              <input className="input" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">岗位说明</label>
              <textarea className="textarea" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="actions">
              <button className="button" disabled={submitting} type="submit">
                {submitting ? '保存中...' : '保存岗位'}
              </button>
            </div>
          </form>
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">保存后系统会做什么</h3>
              <p className="card-subtitle">不需要手工拆解岗位，系统会自动帮你整理。</p>
            </div>
          </div>
          <div className="feature-grid single-column">
            <div className="feature-item">
              <strong>整理岗位重点</strong>
              <p>拆出核心技能、工作年限、加分项和关键词。</p>
            </div>
            <div className="feature-item">
              <strong>生成推荐依据</strong>
              <p>后续推荐候选人时，会基于这些重点做排序和说明。</p>
            </div>
            <div className="feature-item">
              <strong>支持删除重建</strong>
              <p>旧的错误数据现在可以直接删除，重新录入新的岗位即可。</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid two align-start">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">岗位列表</h3>
              <p className="card-subtitle">现在改成点击展开查看详情，不再是大段平铺滚动。</p>
            </div>
            <button className="button subtle" disabled={loading} onClick={() => void loadJobs()} type="button">
              {loading ? '刷新中...' : '刷新列表'}
            </button>
          </div>

          <div className="accordion-list">
            {loadError && (
              <div className="empty error-box">
                岗位列表加载失败：{loadError}
                <div className="small">如果你是在本地运行，请确认后端服务已经启动在 8001 端口。</div>
              </div>
            )}

            {jobs.map((job) => {
              const displayTitle = safeText(job.title, '旧岗位数据异常')
              const displayRole = safeText(job.structured_profile.role, '待整理')
              const displaySummary = safeText(job.structured_profile.summary, '这条旧岗位数据内容异常，建议直接删除后重新录入。')
              const mustSkills = safeList(job.structured_profile.must_have_skills)
              const hasBrokenData = looksBrokenText(job.title) || looksBrokenText(job.raw_description)

              return (
                <details className="accordion-item" key={job.id}>
                  <summary className="accordion-summary">
                    <div>
                      <strong>#{job.id} {displayTitle}</strong>
                      <div className="small">岗位方向：{displayRole}</div>
                    </div>
                    <div className="accordion-meta">
                      <span className="badge">{job.llm_provider}</span>
                      <span className="accordion-arrow">展开</span>
                    </div>
                  </summary>

                  <div className="accordion-body">
                    {hasBrokenData && <div className="inline-warning">这是一条旧的异常数据，内容里已经被存成问号了，建议直接删除后重新建。</div>}
                    <div className="small">经验要求：{job.structured_profile.min_years_experience}+ 年</div>
                    <div className="small top-gap">岗位摘要：{displaySummary}</div>
                    <div className="tag-row">
                      {(mustSkills.length > 0 ? mustSkills : ['待补充']).map((skill) => <span className="tag" key={skill}>{skill}</span>)}
                    </div>
                    <div className="actions compact">
                      <button className="button secondary" onClick={() => void handleRecall(job.id)} type="button" disabled={recallingId === job.id}>
                        {recallingId === job.id ? '推荐中...' : '推荐候选人'}
                      </button>
                      <button className="button danger" onClick={() => void handleDelete(job.id, displayTitle)} type="button" disabled={deletingId === job.id}>
                        {deletingId === job.id ? '删除中...' : '删除岗位'}
                      </button>
                    </div>
                  </div>
                </details>
              )
            })}

            {!loading && !loadError && jobs.length === 0 && <div className="empty">暂无岗位数据，先新增一个岗位吧。</div>}
            {loading && <div className="empty">正在加载岗位列表...</div>}
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">推荐结果</h3>
              <p className="card-subtitle">点击“推荐候选人”后，这里会显示更合适的人选和推荐原因。</p>
            </div>
            <span className="badge">第二步</span>
          </div>

          {selectedJob && <div className="small">当前岗位：#{selectedJob.id} {safeText(selectedJob.title, '旧岗位数据异常')}</div>}

          <div className="table-list top-gap">
            {recallResult?.rankings.map((item, index) => (
              <div className="list-item elevated" key={item.candidate_id}>
                <div className="row-between start-on-mobile">
                  <strong>TOP {index + 1} · {safeText(item.candidate_name, '未识别候选人')}</strong>
                  <span className="badge">综合评分 {item.recall_score}</span>
                </div>
                <div className="score-pills">
                  <span className="score-pill">经验相关度 {item.vector_score}</span>
                  <span className="score-pill">关键词匹配 {item.lexical_score}</span>
                </div>
                <div className="small">推荐原因：{safeText(item.match_hint, '系统已完成排序，但这条说明内容异常。')}</div>
                <div className="tag-row">
                  {safeList(item.matched_skills).map((skill) => <span className="tag" key={skill}>{skill}</span>)}
                </div>
              </div>
            ))}
            {!recallResult && <div className="empty">请先从左侧岗位列表中展开一条岗位，然后点击“推荐候选人”。</div>}
          </div>
        </article>
      </section>
    </div>
  )
}
