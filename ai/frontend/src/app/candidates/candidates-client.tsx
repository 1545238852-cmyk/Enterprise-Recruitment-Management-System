'use client'

import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '@/components/confirm-dialog'
import { apiDelete, apiGetOrThrow, apiPost, apiUpload } from '@/lib/api'
import { looksBrokenText, safeList, safeText } from '@/lib/display'
import { Candidate } from '@/lib/types'

const initialResume = `张晨
后端开发工程师
5年工作经验

技能：Python、FastAPI、MySQL、Redis、Docker
经历：负责招聘系统、审批系统与数据接口开发。`

type CandidatesClientPageProps = {
  initialCandidates: Candidate[]
  initialError: string
}

type DeleteResponse = {
  success: boolean
  deleted_id: number
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function getCandidateStatus(candidate: Candidate) {
  if (looksBrokenText(candidate.name) || looksBrokenText(candidate.raw_resume_text)) return '数据异常'
  if ((candidate.structured_profile.skills ?? []).length >= 3) return '已解析'
  return '待补充'
}

export default function CandidatesClientPage({ initialCandidates, initialError }: CandidatesClientPageProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [loading, setLoading] = useState(initialCandidates.length === 0 && !initialError)
  const [loadError, setLoadError] = useState(initialError)
  const [resumeText, setResumeText] = useState(initialResume)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(initialCandidates[0]?.id ?? null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'file' | 'text'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'experience'>('latest')
  const [pendingDelete, setPendingDelete] = useState<Candidate | null>(null)
  const [message, setMessage] = useState('')

  async function loadCandidates() {
    setLoading(true)
    setLoadError('')

    try {
      const data = await apiGetOrThrow<Candidate[]>('/candidates')
      setCandidates(data)
      setSelectedCandidateId((prev) => (data.some((candidate) => candidate.id === prev) ? prev : (data[0]?.id ?? null)))
    } catch (error) {
      setCandidates([])
      setLoadError(error instanceof Error ? error.message : '候选人列表加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCandidates.length === 0 && !initialError) {
      void loadCandidates()
    }
  }, [initialCandidates.length, initialError])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreating(true)
    setMessage('')

    try {
      await apiPost<Candidate>('/candidates/text', { resume_text: resumeText })
      setMessage('候选人已保存')
      setResumeText(initialResume)
      await loadCandidates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败')
    } finally {
      setCreating(false)
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!uploadFile) {
      setMessage('请选择简历文件')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      await apiUpload<Candidate>('/candidates/upload', formData)
      setMessage('上传完成')
      setUploadFile(null)
      await loadCandidates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return

    setDeletingId(pendingDelete.id)
    setMessage('')

    try {
      await apiDelete<DeleteResponse>(`/candidates/${pendingDelete.id}`)
      setMessage('候选人已删除')
      setPendingDelete(null)
      await loadCandidates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredCandidates = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    const next = candidates.filter((candidate) => {
      const sourceType = candidate.source_filename ? 'file' : 'text'
      const text = [
        candidate.name,
        candidate.structured_profile.current_title,
        ...(candidate.structured_profile.skills ?? []),
        ...(candidate.structured_profile.strengths ?? []),
      ]
        .join(' ')
        .toLowerCase()

      const matchKeyword = keyword ? text.includes(keyword) : true
      const matchSource = sourceFilter === 'all' ? true : sourceType === sourceFilter
      return matchKeyword && matchSource
    })

    return [...next].sort((a, b) => {
      if (sortBy === 'experience') {
        return b.structured_profile.years_experience - a.structured_profile.years_experience
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [candidates, searchKeyword, sourceFilter, sortBy])

  useEffect(() => {
    if (filteredCandidates.length === 0) {
      setSelectedCandidateId(null)
      return
    }
    if (!filteredCandidates.some((candidate) => candidate.id === selectedCandidateId)) {
      setSelectedCandidateId(filteredCandidates[0].id)
    }
  }, [filteredCandidates, selectedCandidateId])

  const selectedCandidate = useMemo(
    () => filteredCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null,
    [filteredCandidates, candidates, selectedCandidateId],
  )

  const fileResumeCount = useMemo(
    () => candidates.filter((candidate) => Boolean(candidate.source_filename)).length,
    [candidates],
  )
  const textResumeCount = candidates.length - fileResumeCount
  const parsedCount = useMemo(() => candidates.filter((candidate) => getCandidateStatus(candidate) === '已解析').length, [candidates])
  const brokenCount = useMemo(() => candidates.filter((candidate) => getCandidateStatus(candidate) === '数据异常').length, [candidates])

  return (
    <div className="page-stack">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <span className="eyebrow-chip">候选人</span>
          <h2 className="hero-title">候选人管理</h2>
          <p className="hero-text">候选人列表、简历录入、候选人详情</p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">候选人概览</div>
          <div className="step-list">
            <div className="step-item">
              <strong>候选人数</strong>
              <span>{candidates.length}</span>
            </div>
            <div className="step-item">
              <strong>已解析</strong>
              <span>{parsedCount}</span>
            </div>
            <div className="step-item">
              <strong>数据异常</strong>
              <span>{brokenCount}</span>
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
          <span>候选人数</span>
          <strong>{candidates.length}</strong>
        </article>
        <article className="summary-card">
          <span>文件简历</span>
          <strong>{fileResumeCount}</strong>
        </article>
        <article className="summary-card">
          <span>文本录入</span>
          <strong>{textResumeCount}</strong>
        </article>
        <article className="summary-card">
          <span>当前筛选</span>
          <strong>{filteredCandidates.length}</strong>
        </article>
      </section>

      <section className="grid two align-start ats-main-grid">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">文本录入</h3>
              <p className="card-subtitle">简历内容</p>
            </div>
          </div>
          <form className="form-grid dense-form" onSubmit={handleCreate}>
            <div>
              <label className="label">简历内容</label>
              <textarea className="textarea xl" value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
            </div>
            <div className="actions">
              <button className="button" disabled={creating} type="submit">
                {creating ? '保存中...' : '保存候选人'}
              </button>
            </div>
          </form>
        </article>

        <article className="card detail-card sticky-panel">
          <div className="section-heading compact-heading">
            <div>
              <h3 className="card-title">文件上传</h3>
            </div>
            <span className="badge">PDF / DOC / DOCX / TXT</span>
          </div>
          <form className="form-grid dense-form" onSubmit={handleUpload}>
            <div>
              <label className="label">选择文件</label>
              <input
                className="input"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
              />
            </div>
            <div className="small">当前文件：{uploadFile?.name ?? '未选择'}</div>
            <div className="actions">
              <button className="button secondary" disabled={uploading} type="submit">
                {uploading ? '上传中...' : '上传并保存'}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="grid two align-start ats-main-grid">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">候选人列表</h3>
              <p className="card-subtitle">搜索、来源、排序</p>
            </div>
            <button className="button subtle" onClick={() => void loadCandidates()} type="button" disabled={loading}>
              {loading ? '刷新中...' : '刷新列表'}
            </button>
          </div>

          <div className="toolbar-grid">
            <input
              className="input"
              placeholder="搜索姓名 / 技能 / 岗位"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <select className="select" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as 'all' | 'file' | 'text')}>
              <option value="all">全部来源</option>
              <option value="file">文件简历</option>
              <option value="text">文本录入</option>
            </select>
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'latest' | 'experience')}>
              <option value="latest">按创建时间</option>
              <option value="experience">按经验年限</option>
            </select>
          </div>

          {loadError && (
            <div className="empty error-box top-gap">
              候选人列表加载失败：{loadError}
            </div>
          )}

          <div className="data-table top-gap">
            <div className="table-head four-col">
              <span>候选人</span>
              <span>当前岗位</span>
              <span>状态</span>
              <span>经验</span>
            </div>
            <div className="table-body">
              {filteredCandidates.map((candidate) => {
                const status = getCandidateStatus(candidate)
                const active = selectedCandidateId === candidate.id

                return (
                  <button
                    className={`table-row four-col ${active ? 'active' : ''}`}
                    key={candidate.id}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    type="button"
                  >
                    <div>
                      <strong>#{candidate.id} {safeText(candidate.name, '候选人数据异常')}</strong>
                      <div className="small">{safeList(candidate.structured_profile.skills).slice(0, 3).join('、') || '待补充'}</div>
                    </div>
                    <span>{safeText(candidate.structured_profile.current_title, '待补充')}</span>
                    <span className={`status-chip inline ${status === '数据异常' ? 'danger' : status === '已解析' ? 'success' : 'warning'}`}>{status}</span>
                    <span>{candidate.structured_profile.years_experience} 年</span>
                  </button>
                )
              })}
              {!loading && !loadError && filteredCandidates.length === 0 && <div className="empty">暂无候选人</div>}
              {loading && <div className="empty">正在加载...</div>}
            </div>
          </div>
        </article>

        <article className="card detail-card">
          <div className="section-heading compact-heading">
            <div>
              <h3 className="card-title">候选人详情</h3>
            </div>
            {selectedCandidate && <span className={`status-chip ${getCandidateStatus(selectedCandidate) === '数据异常' ? 'danger' : getCandidateStatus(selectedCandidate) === '已解析' ? 'success' : 'warning'}`}>{getCandidateStatus(selectedCandidate)}</span>}
          </div>

          {!selectedCandidate && <div className="empty">请选择候选人</div>}
          {selectedCandidate && (
            <>
              <div className="detail-title-row">
                <div>
                  <strong className="detail-title">#{selectedCandidate.id} {safeText(selectedCandidate.name, '候选人数据异常')}</strong>
                  <div className="small">{safeText(selectedCandidate.structured_profile.current_title, '待补充')}</div>
                </div>
              </div>

              <div className="meta-grid">
                <div className="meta-item"><span>经验年限</span><strong>{selectedCandidate.structured_profile.years_experience} 年</strong></div>
                <div className="meta-item"><span>创建时间</span><strong>{formatDate(selectedCandidate.created_at)}</strong></div>
                <div className="meta-item"><span>学历</span><strong>{safeText(selectedCandidate.structured_profile.education, '待补充')}</strong></div>
                <div className="meta-item"><span>地点</span><strong>{safeText(selectedCandidate.structured_profile.location, '待补充')}</strong></div>
              </div>

              {getCandidateStatus(selectedCandidate) === '数据异常' && <div className="inline-warning">该候选人数据异常</div>}

              <div className="detail-section">
                <div className="detail-label">技能</div>
                <div className="tag-row">
                  {(safeList(selectedCandidate.structured_profile.skills).length > 0 ? safeList(selectedCandidate.structured_profile.skills) : ['待补充']).map((skill) => (
                    <span className="tag" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">亮点</div>
                <div className="small detail-text">{safeList(selectedCandidate.structured_profile.strengths).join('、') || '暂无'}</div>
              </div>

              <div className="detail-section">
                <div className="detail-label">关注项</div>
                <div className="small detail-text">{safeList(selectedCandidate.structured_profile.risk_flags).join('、') || '暂无'}</div>
              </div>

              <div className="detail-section">
                <div className="detail-label">来源文件</div>
                <div className="small detail-text">{selectedCandidate.source_filename || '文本录入'}</div>
              </div>

              <div className="detail-section">
                <div className="detail-label">项目经历</div>
                {selectedCandidate.structured_profile.projects.length === 0 && <div className="small detail-text">暂无</div>}
                {selectedCandidate.structured_profile.projects.length > 0 && (
                  <div className="stack-list">
                    {selectedCandidate.structured_profile.projects.slice(0, 4).map((project) => {
                      const highlights = safeList(project.highlights)

                      return (
                        <div className="stack-item" key={`${selectedCandidate.id}-${project.name}`}>
                          <strong>{safeText(project.name, '项目异常')}</strong>
                          <div className="small">{project.role ? safeText(project.role, '待补充') : '待补充'}</div>
                          <div className="small detail-text">{highlights.join('；') || '暂无'}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="actions compact">
                <button className="button danger" onClick={() => setPendingDelete(selectedCandidate)} type="button" disabled={deletingId === selectedCandidate.id}>
                  {deletingId === selectedCandidate.id ? '删除中...' : '删除候选人'}
                </button>
              </div>
            </>
          )}
        </article>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="删除候选人"
        content={pendingDelete ? `候选人：${safeText(pendingDelete.name, '候选人数据异常')}` : ''}
        confirmLabel="确认删除"
        danger
        busy={Boolean(pendingDelete && deletingId === pendingDelete.id)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

