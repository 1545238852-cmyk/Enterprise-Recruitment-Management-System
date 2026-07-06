'use client'

import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '@/components/confirm-dialog'
import { apiDelete, apiGetOrThrow, apiPost } from '@/lib/api'
import { looksBrokenText, safeList, safeText } from '@/lib/display'
import { CandidateRecallResponse, Job } from '@/lib/types'

const initialForm = {
  title: '后端开发工程师',
  description: '负责后台服务开发与接口维护，要求 3 年以上 Python 经验，熟悉 FastAPI、MySQL、Docker、日志监控与发布流程。',
}

type JobsClientPageProps = {
  initialJobs: Job[]
  initialError: string
}

type DeleteResponse = {
  success: boolean
  deleted_id: number
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function getJobStatus(job: Job) {
  if (looksBrokenText(job.title) || looksBrokenText(job.raw_description)) return '数据异常'
  if ((job.structured_profile.must_have_skills ?? []).length >= 3) return '已整理'
  return '待补充'
}

export default function JobsClientPage({ initialJobs, initialError }: JobsClientPageProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [loading, setLoading] = useState(initialJobs.length === 0 && !initialError)
  const [loadError, setLoadError] = useState(initialError)
  const [submitting, setSubmitting] = useState(false)
  const [recallingId, setRecallingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<number | null>(initialJobs[0]?.id ?? null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(initialForm)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'title'>('latest')
  const [pendingDelete, setPendingDelete] = useState<Job | null>(null)
  const [recallResult, setRecallResult] = useState<CandidateRecallResponse | null>(null)

  async function loadJobs() {
    setLoading(true)
    setLoadError('')

    try {
      const data = await apiGetOrThrow<Job[]>('/jobs')
      setJobs(data)
      setSelectedJobId((prev) => (data.some((job) => job.id === prev) ? prev : (data[0]?.id ?? null)))
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
      setMessage('岗位已保存')
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
      setMessage('推荐结果已更新')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '推荐失败')
    } finally {
      setRecallingId(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return

    setDeletingId(pendingDelete.id)
    setMessage('')
    try {
      await apiDelete<DeleteResponse>(`/jobs/${pendingDelete.id}`)
      if (recallResult?.job_id === pendingDelete.id) {
        setRecallResult(null)
      }
      setMessage('岗位已删除')
      setPendingDelete(null)
      await loadJobs()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  const roleOptions = useMemo(() => {
    const values = Array.from(new Set(jobs.map((job) => safeText(job.structured_profile.role, '待补充')).filter(Boolean)))
    return values.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    const next = jobs.filter((job) => {
      const role = safeText(job.structured_profile.role, '待补充')
      const text = [
        job.title,
        role,
        ...(job.structured_profile.must_have_skills ?? []),
        ...(job.structured_profile.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase()

      const matchKeyword = keyword ? text.includes(keyword) : true
      const matchRole = roleFilter === 'all' ? true : role === roleFilter
      return matchKeyword && matchRole
    })

    return [...next].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'zh-CN')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [jobs, roleFilter, searchKeyword, sortBy])

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId(null)
      return
    }
    if (!filteredJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0].id)
    }
  }, [filteredJobs, selectedJobId])

  const selectedJob = useMemo(
    () => filteredJobs.find((job) => job.id === selectedJobId) ?? jobs.find((job) => job.id === selectedJobId) ?? null,
    [filteredJobs, jobs, selectedJobId],
  )

  const currentRecallRankings = recallResult?.job_id === selectedJob?.id ? (recallResult?.rankings ?? []) : []
  const readyJobs = useMemo(() => jobs.filter((job) => getJobStatus(job) === '已整理').length, [jobs])
  const brokenJobs = useMemo(() => jobs.filter((job) => getJobStatus(job) === '数据异常').length, [jobs])

  return (
    <div className="page-stack">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <span className="eyebrow-chip">岗位</span>
          <h2 className="hero-title">岗位管理</h2>
          <p className="hero-text">岗位列表、岗位详情、推荐结果</p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">岗位概览</div>
          <div className="step-list">
            <div className="step-item">
              <strong>岗位数量</strong>
              <span>{jobs.length}</span>
            </div>
            <div className="step-item">
              <strong>已整理</strong>
              <span>{readyJobs}</span>
            </div>
            <div className="step-item">
              <strong>数据异常</strong>
              <span>{brokenJobs}</span>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <section className="card notice-card">
          <div className="notice-text">{message}</div>
        </section>
      )}

      <section className="summary-grid compact-summary">
        <article className="summary-card">
          <span>岗位总数</span>
          <strong>{jobs.length}</strong>
        </article>
        <article className="summary-card">
          <span>筛选结果</span>
          <strong>{currentRecallRankings.length}</strong>
        </article>
        <article className="summary-card">
          <span>当前筛选</span>
          <strong>{filteredJobs.length}</strong>
        </article>
        <article className="summary-card">
          <span>最新更新</span>
          <strong>{jobs[0] ? `#${jobs[0].id}` : '-'}</strong>
        </article>
      </section>

      <section className="grid two align-start ats-main-grid">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">新增岗位</h3>
              <p className="card-subtitle">岗位名称、岗位说明</p>
            </div>
          </div>

          <form className="form-grid dense-form" onSubmit={handleSubmit}>
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

        <article className="card detail-card sticky-panel">
          <div className="section-heading compact-heading">
            <div>
              <h3 className="card-title">岗位详情</h3>
            </div>
            {selectedJob && <span className={`status-chip ${getJobStatus(selectedJob) === '数据异常' ? 'danger' : getJobStatus(selectedJob) === '已整理' ? 'success' : 'warning'}`}>{getJobStatus(selectedJob)}</span>}
          </div>

          {!selectedJob && <div className="empty">请选择岗位</div>}
          {selectedJob && (
            <>
              <div className="detail-title-row">
                <div>
                  <strong className="detail-title">#{selectedJob.id} {safeText(selectedJob.title, '岗位数据异常')}</strong>
                  <div className="small">岗位方向：{safeText(selectedJob.structured_profile.role, '待补充')}</div>
                </div>
              </div>

              <div className="meta-grid">
                <div className="meta-item"><span>经验要求</span><strong>{selectedJob.structured_profile.min_years_experience}+ 年</strong></div>
                <div className="meta-item"><span>创建时间</span><strong>{formatDate(selectedJob.created_at)}</strong></div>
                <div className="meta-item"><span>学历要求</span><strong>{safeText(selectedJob.structured_profile.education_requirement, '待补充')}</strong></div>
                <div className="meta-item"><span>工作地点</span><strong>{safeText(selectedJob.structured_profile.location_requirement, '待补充')}</strong></div>
              </div>

              {getJobStatus(selectedJob) === '数据异常' && <div className="inline-warning">该岗位数据异常</div>}

              <div className="detail-section">
                <div className="detail-label">岗位摘要</div>
                <div className="small detail-text">{safeText(selectedJob.structured_profile.summary, '内容异常')}</div>
              </div>

              <div className="detail-section">
                <div className="detail-label">必备技能</div>
                <div className="tag-row">
                  {(safeList(selectedJob.structured_profile.must_have_skills).length > 0 ? safeList(selectedJob.structured_profile.must_have_skills) : ['待补充']).map((skill) => (
                    <span className="tag" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">加分项</div>
                <div className="tag-row muted-tags">
                  {(safeList(selectedJob.structured_profile.preferred_skills).length > 0 ? safeList(selectedJob.structured_profile.preferred_skills) : ['暂无']).map((skill) => (
                    <span className="tag neutral" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">关键词</div>
                <div className="small detail-text">{safeList(selectedJob.structured_profile.keywords).join('、') || '暂无'}</div>
              </div>

              <div className="actions compact">
                <button className="button secondary" onClick={() => void handleRecall(selectedJob.id)} type="button" disabled={recallingId === selectedJob.id}>
                  {recallingId === selectedJob.id ? '生成中...' : '开始推荐'}
                </button>
                <button className="button danger" onClick={() => setPendingDelete(selectedJob)} type="button" disabled={deletingId === selectedJob.id}>
                  {deletingId === selectedJob.id ? '删除中...' : '删除岗位'}
                </button>
              </div>
            </>
          )}
        </article>
      </section>

      <section className="grid two align-start ats-main-grid">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">岗位列表</h3>
              <p className="card-subtitle">搜索、筛选、排序</p>
            </div>
            <button className="button subtle" disabled={loading} onClick={() => void loadJobs()} type="button">
              {loading ? '刷新中...' : '刷新列表'}
            </button>
          </div>

          <div className="toolbar-grid">
            <input
              className="input"
              placeholder="搜索岗位 / 技能"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <select className="select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">全部岗位方向</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'latest' | 'title')}>
              <option value="latest">按创建时间</option>
              <option value="title">按岗位名称</option>
            </select>
          </div>

          {loadError && (
            <div className="empty error-box top-gap">
              岗位列表加载失败：{loadError}
            </div>
          )}

          <div className="data-table top-gap">
            <div className="table-head four-col">
              <span>岗位</span>
              <span>岗位方向</span>
              <span>状态</span>
              <span>创建时间</span>
            </div>
            <div className="table-body">
              {filteredJobs.map((job) => {
                const status = getJobStatus(job)
                const active = selectedJobId === job.id

                return (
                  <button
                    className={`table-row four-col ${active ? 'active' : ''}`}
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    type="button"
                  >
                    <div>
                      <strong>#{job.id} {safeText(job.title, '岗位数据异常')}</strong>
                      <div className="small">{safeList(job.structured_profile.must_have_skills).slice(0, 3).join('、') || '待补充'}</div>
                    </div>
                    <span>{safeText(job.structured_profile.role, '待补充')}</span>
                    <span className={`status-chip inline ${status === '数据异常' ? 'danger' : status === '已整理' ? 'success' : 'warning'}`}>{status}</span>
                    <span>{formatDate(job.created_at)}</span>
                  </button>
                )
              })}
              {!loading && !loadError && filteredJobs.length === 0 && <div className="empty">暂无岗位</div>}
              {loading && <div className="empty">正在加载...</div>}
            </div>
          </div>
        </article>

        <article className="card detail-card">
          <div className="section-heading compact-heading">
            <div>
              <h3 className="card-title">推荐结果</h3>
            </div>
            {selectedJob && <span className="badge">当前岗位 #{selectedJob.id}</span>}
          </div>

          {!selectedJob && <div className="empty">请选择岗位</div>}
          {selectedJob && currentRecallRankings.length === 0 && <div className="empty">暂无结果</div>}
          {selectedJob && currentRecallRankings.length > 0 && (
            <div className="table-list dense-list">
              {currentRecallRankings.map((item, index) => (
                <div className="list-item elevated compact-item" key={item.candidate_id}>
                  <div className="row-between start-on-mobile">
                    <strong>TOP {index + 1} · {safeText(item.candidate_name, '未识别')}</strong>
                    <span className="badge">综合评分 {item.recall_score}</span>
                  </div>
                  <div className="score-pills compact-pills">
                    <span className="score-pill">经验得分 {item.vector_score}</span>
                    <span className="score-pill">关键词 {item.lexical_score}</span>
                  </div>
                  <div className="small detail-text">匹配说明：{safeText(item.match_hint, '内容异常')}</div>
                  <div className="tag-row">
                    {safeList(item.matched_skills).map((skill) => <span className="tag" key={skill}>{skill}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="删除岗位"
        content={pendingDelete ? `岗位：${safeText(pendingDelete.title, '岗位数据异常')}` : ''}
        confirmLabel="确认删除"
        danger
        busy={Boolean(pendingDelete && deletingId === pendingDelete.id)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

