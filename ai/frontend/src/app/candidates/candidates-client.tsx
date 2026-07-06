"use client"

import { useEffect, useState } from 'react'
import { apiDelete, apiGetOrThrow, apiPost, apiUpload } from '@/lib/api'
import { looksBrokenText, safeList, safeText } from '@/lib/display'
import { Candidate } from '@/lib/types'

const copy = {
  pageTag: '\u5019\u9009\u4eba\u7ba1\u7406',
  pageTitle: '\u5148\u628a\u7b80\u5386\u6574\u7406\u6210\u7edf\u4e00\u6863\u6848\uff0c\u540e\u9762\u7684\u63a8\u8350\u548c\u7b5b\u9009\u624d\u4f1a\u66f4\u7a33\u3002',
  pageText: '\u8fd9\u4e00\u9875\u652f\u6301\u4e24\u79cd\u5f55\u5165\u65b9\u5f0f\uff1a\u76f4\u63a5\u7c98\u8d34\u7b80\u5386\u5185\u5bb9\uff0c\u6216\u8005\u4e0a\u4f20\u5df2\u6709\u6587\u4ef6\u3002\u4e0b\u9762\u7684\u5019\u9009\u4eba\u5217\u8868\u5df2\u7ecf\u6539\u6210\u70b9\u51fb\u5c55\u5f00\u5f0f\uff0c\u4e0d\u4f1a\u518d\u6574\u9875\u4e71\u6ed1\u3002',
  guideTitle: '\u4f60\u53ef\u4ee5\u8fd9\u6837\u4f7f\u7528',
  pasteWay: '\u65b9\u5f0f\u4e00\uff1a\u76f4\u63a5\u7c98\u8d34',
  pasteWayDesc: '\u9002\u5408\u4e34\u65f6\u6536\u5230\u7684\u6587\u672c\u7b80\u5386\uff0c\u5f55\u5165\u6700\u5feb\u3002',
  uploadWay: '\u65b9\u5f0f\u4e8c\uff1a\u4e0a\u4f20\u6587\u4ef6',
  uploadWayDesc: '\u9002\u5408\u771f\u5b9e\u62db\u8058\u573a\u666f\u91cc\u7684 PDF\u3001DOCX\u3001TXT \u6587\u4ef6\u3002',
  oldDataTitle: '\u65e7\u6570\u636e\u63d0\u9192',
  oldDataDesc: '\u5982\u679c\u770b\u5230\u201c\u65e7\u5019\u9009\u4eba\u6570\u636e\u5f02\u5e38\u201d\uff0c\u8bf4\u660e\u90a3\u6761\u65e7\u6570\u636e\u4e4b\u524d\u5df2\u7ecf\u88ab\u5b58\u574f\u4e86\uff0c\u76f4\u63a5\u5220\u6389\u91cd\u5efa\u5373\u53ef\u3002',
  pasteCard: '\u7c98\u8d34\u7b80\u5386\u5f55\u5165',
  pasteCardDesc: '\u628a\u5019\u9009\u4eba\u7684\u7b80\u5386\u5185\u5bb9\u8d34\u8fdb\u6765\uff0c\u7cfb\u7edf\u4f1a\u81ea\u52a8\u6574\u7406\u6210\u7edf\u4e00\u6863\u6848\u3002',
  firstWay: '\u7b2c\u4e00\u79cd\u65b9\u5f0f',
  resumeContent: '\u7b80\u5386\u5185\u5bb9',
  resumePlaceholder: '\u8bf7\u7c98\u8d34\u5019\u9009\u4eba\u7684\u7b80\u5386\u6587\u672c',
  creating: '\u5f55\u5165\u4e2d...',
  create: '\u4fdd\u5b58\u5019\u9009\u4eba',
  uploadCard: '\u4e0a\u4f20\u6587\u4ef6\u5f55\u5165',
  uploadCardDesc: '\u652f\u6301\u4e0a\u4f20\u7b80\u5386\u6587\u4ef6\uff0c\u9002\u5408\u76f4\u63a5\u5904\u7406\u73b0\u6210\u7684\u5019\u9009\u4eba\u8d44\u6599\u3002',
  secondWay: '\u7b2c\u4e8c\u79cd\u65b9\u5f0f',
  chooseFile: '\u9009\u62e9\u6587\u4ef6',
  uploadHint: '\u652f\u6301 PDF\u3001DOC\u3001DOCX\u3001TXT\u3002\u4e0a\u4f20\u540e\u7cfb\u7edf\u4f1a\u81ea\u52a8\u62bd\u53d6\u6587\u672c\u5e76\u6574\u7406\u7b80\u5386\u3002',
  uploading: '\u4e0a\u4f20\u4e2d...',
  upload: '\u4e0a\u4f20\u5e76\u5f55\u5165',
  listTitle: '\u5019\u9009\u4eba\u5217\u8868',
  listDesc: '\u6539\u6210\u70b9\u51fb\u5c55\u5f00\u67e5\u770b\u8be6\u60c5\uff0c\u4fe1\u606f\u66f4\u6e05\u695a\uff0c\u4e5f\u4e0d\u4f1a\u6ee1\u5c4f\u5806\u7740\u8dd1\u3002',
  refreshing: '\u5237\u65b0\u4e2d...',
  refresh: '\u5237\u65b0\u5217\u8868',
  loadFailedPrefix: '\u5019\u9009\u4eba\u5217\u8868\u52a0\u8f7d\u5931\u8d25\uff1a',
  backendHint: '\u5982\u679c\u4f60\u662f\u5728\u672c\u5730\u8fd0\u884c\uff0c\u8bf7\u786e\u8ba4\u540e\u7aef\u670d\u52a1\u5df2\u7ecf\u542f\u52a8\u5728 8001 \u7aef\u53e3\u3002',
  brokenCandidate: '\u65e7\u5019\u9009\u4eba\u6570\u636e\u5f02\u5e38',
  pendingRole: '\u5c97\u4f4d\u5f85\u6574\u7406',
  expand: '\u70b9\u51fb\u5c55\u5f00',
  yearsExp: '\u5e74\u7ecf\u9a8c',
  brokenWarn: '\u8fd9\u662f\u4e00\u6761\u65e7\u7684\u5f02\u5e38\u5019\u9009\u4eba\u6570\u636e\uff0c\u5185\u5bb9\u91cc\u5df2\u7ecf\u88ab\u5b58\u6210\u95ee\u53f7\u4e86\uff0c\u5efa\u8bae\u76f4\u63a5\u5220\u9664\u540e\u91cd\u65b0\u5f55\u5165\u3002',
  education: '\u5b66\u5386\uff1a',
  location: '\u5730\u70b9\uff1a',
  fallback: '\u5f85\u8865\u5145',
  sourceFile: '\u6765\u6e90\u6587\u4ef6\uff1a',
  highlights: '\u4eae\u70b9\uff1a',
  none: '\u6682\u65e0',
  risks: '\u9700\u8981\u5173\u6ce8\uff1a',
  projects: '\u9879\u76ee\u7ecf\u5386\uff1a',
  projectNameBroken: '\u9879\u76ee\u540d\u79f0\u5f02\u5e38',
  roleFallback: '\u89d2\u8272\u5f85\u8865\u5145',
  deleting: '\u5220\u9664\u4e2d...',
  delete: '\u5220\u9664\u5019\u9009\u4eba',
  empty: '\u6682\u65f6\u8fd8\u6ca1\u6709\u5019\u9009\u4eba\u6570\u636e\uff0c\u5148\u5f55\u5165\u4e00\u4efd\u7b80\u5386\u5427\u3002',
  loading: '\u6b63\u5728\u52a0\u8f7d\u5019\u9009\u4eba\u5217\u8868...',
  chooseResumeFile: '\u8bf7\u5148\u9009\u62e9\u7b80\u5386\u6587\u4ef6\u3002',
  createDone: '\u5019\u9009\u4eba\u5df2\u5f55\u5165\uff0c\u7cfb\u7edf\u5df2\u81ea\u52a8\u6574\u7406\u7b80\u5386\u5185\u5bb9\u3002',
  createFailed: '\u5019\u9009\u4eba\u5f55\u5165\u5931\u8d25',
  uploadDone: '\u7b80\u5386\u6587\u4ef6\u5df2\u4e0a\u4f20\u5e76\u5f55\u5165\u6210\u529f\u3002',
  uploadFailed: '\u6587\u4ef6\u4e0a\u4f20\u5931\u8d25',
  deleteDone: '\u5019\u9009\u4eba\u5df2\u5220\u9664\u3002',
  deleteFailed: '\u5220\u9664\u5019\u9009\u4eba\u5931\u8d25',
  deleteConfirmPrefix: '\u786e\u8ba4\u5220\u9664\u5019\u9009\u4eba\u300c',
  deleteConfirmSuffix: '\u300d\u5417\uff1f\u5173\u8054\u7684\u7b5b\u9009\u8bb0\u5f55\u4e5f\u4f1a\u4e00\u8d77\u5220\u9664\u3002',
} as const

const initialText = [
  '\u738b\u4e94',
  '5\u5e74\u5de5\u4f5c\u7ecf\u9a8c\uff0c\u73b0\u4efb AI \u5e94\u7528\u5de5\u7a0b\u5e08\u3002',
  '\u719f\u6089 Python\u3001FastAPI\u3001\u667a\u80fd\u95ee\u7b54\u3001\u81ea\u52a8\u5316\u52a9\u624b\u3001Docker\u3001PostgreSQL\u3002',
  '\u4e3b\u5bfc\u8fc7\u77e5\u8bc6\u5e93\u95ee\u7b54\u7cfb\u7edf\u3001\u667a\u80fd\u62db\u8058\u5e73\u53f0\u548c\u641c\u7d22\u63a8\u8350\u670d\u52a1\u5f00\u53d1\u3002',
].join('\n')

type DeleteResponse = {
  success: boolean
  deleted_id: number
}

type CandidatesClientPageProps = {
  initialCandidates: Candidate[]
  initialError: string
}

export default function CandidatesClientPage({ initialCandidates, initialError }: CandidatesClientPageProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [resumeText, setResumeText] = useState(initialText)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(initialCandidates.length === 0 && !initialError)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [loadError, setLoadError] = useState(initialError)
  const [message, setMessage] = useState('')

  async function loadCandidates() {
    setLoading(true)
    setLoadError('')

    try {
      const data = await apiGetOrThrow<Candidate[]>('/candidates')
      setCandidates(data)
    } catch (error) {
      setCandidates([])
      setLoadError(error instanceof Error ? error.message : '\u5019\u9009\u4eba\u5217\u8868\u52a0\u8f7d\u5931\u8d25')
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
    setSubmitting(true)
    setMessage('')

    try {
      await apiPost<Candidate>('/candidates/text', { resume_text: resumeText })
      setMessage(copy.createDone)
      setResumeText(initialText)
      await loadCandidates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.createFailed)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) {
      setMessage(copy.chooseResumeFile)
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiUpload<Candidate>('/candidates/upload', formData)
      setMessage(copy.uploadDone)
      setFile(null)
      const fileInput = document.getElementById('resume-file-input') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
      await loadCandidates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.uploadFailed)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(candidateId: number, candidateName: string) {
    const ok = window.confirm(`${copy.deleteConfirmPrefix}${candidateName}${copy.deleteConfirmSuffix}`)
    if (!ok) return

    setDeletingId(candidateId)
    setMessage('')

    try {
      await apiDelete<DeleteResponse>(`/candidates/${candidateId}`)
      setMessage(copy.deleteDone)
      await loadCandidates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.deleteFailed)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <span className="eyebrow-chip">{copy.pageTag}</span>
          <h2 className="hero-title">{copy.pageTitle}</h2>
          <p className="hero-text">{copy.pageText}</p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">{copy.guideTitle}</div>
          <div className="step-list">
            <div className="step-item">
              <strong>{copy.pasteWay}</strong>
              <span>{copy.pasteWayDesc}</span>
            </div>
            <div className="step-item">
              <strong>{copy.uploadWay}</strong>
              <span>{copy.uploadWayDesc}</span>
            </div>
            <div className="step-item">
              <strong>{copy.oldDataTitle}</strong>
              <span>{copy.oldDataDesc}</span>
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
              <h3 className="card-title">{copy.pasteCard}</h3>
              <p className="card-subtitle">{copy.pasteCardDesc}</p>
            </div>
            <span className="badge">{copy.firstWay}</span>
          </div>

          <form className="form-grid" onSubmit={handleCreate}>
            <div>
              <label className="label">{copy.resumeContent}</label>
              <textarea
                className="textarea xl"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder={copy.resumePlaceholder}
              />
            </div>
            <div className="actions">
              <button className="button" disabled={submitting} type="submit">
                {submitting ? copy.creating : copy.create}
              </button>
            </div>
          </form>
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">{copy.uploadCard}</h3>
              <p className="card-subtitle">{copy.uploadCardDesc}</p>
            </div>
            <span className="badge">{copy.secondWay}</span>
          </div>

          <form className="form-grid" onSubmit={handleUpload}>
            <div>
              <label className="label">{copy.chooseFile}</label>
              <input
                id="resume-file-input"
                className="input"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="hint">{copy.uploadHint}</div>
            </div>
            <div className="actions">
              <button className="button secondary" disabled={uploading} type="submit">
                {uploading ? copy.uploading : copy.upload}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h3 className="card-title">{copy.listTitle}</h3>
            <p className="card-subtitle">{copy.listDesc}</p>
          </div>
          <button className="button subtle" onClick={() => void loadCandidates()} type="button" disabled={loading}>
            {loading ? copy.refreshing : copy.refresh}
          </button>
        </div>

        <div className="accordion-list">
          {loadError && (
            <div className="empty error-box">
              {copy.loadFailedPrefix}{loadError}
              <div className="small">{copy.backendHint}</div>
            </div>
          )}

          {candidates.map((candidate) => {
            const displayName = safeText(candidate.name, copy.brokenCandidate)
            const displayTitle = safeText(candidate.structured_profile.current_title, copy.pendingRole)
            const safeSkills = safeList(candidate.structured_profile.skills)
            const safeStrengths = safeList(candidate.structured_profile.strengths)
            const safeRisks = safeList(candidate.structured_profile.risk_flags)
            const hasBrokenData = looksBrokenText(candidate.name) || looksBrokenText(candidate.raw_resume_text)

            return (
              <details className="accordion-item" key={candidate.id}>
                <summary className="accordion-summary">
                  <div>
                    <strong>#{candidate.id} {displayName}</strong>
                    <div className="small">{displayTitle}</div>
                  </div>
                  <div className="accordion-meta">
                    <span className="badge">{candidate.structured_profile.years_experience} {copy.yearsExp}</span>
                    <span className="accordion-arrow">{copy.expand}</span>
                  </div>
                </summary>

                <div className="accordion-body">
                  {hasBrokenData && <div className="inline-warning">{copy.brokenWarn}</div>}
                  <div className="score-pills">
                    <span className="score-pill">{copy.education}{safeText(candidate.structured_profile.education, copy.fallback)}</span>
                    <span className="score-pill">{copy.location}{safeText(candidate.structured_profile.location, copy.fallback)}</span>
                    {candidate.source_filename && <span className="score-pill">{copy.sourceFile}{candidate.source_filename}</span>}
                  </div>
                  <div className="tag-row">
                    {(safeSkills.length > 0 ? safeSkills : [copy.fallback]).map((skill) => <span className="tag" key={skill}>{skill}</span>)}
                  </div>
                  <div className="small top-gap">{copy.highlights}{safeStrengths.length > 0 ? safeStrengths.join('\u3001') : copy.none}</div>
                  {safeRisks.length > 0 && <div className="small">{copy.risks}{safeRisks.join('\u3001')}</div>}
                  {candidate.structured_profile.projects.length > 0 && (
                    <div className="top-gap">
                      <div className="small"><strong>{copy.projects}</strong></div>
                      <ul className="bullet-list compact-list">
                        {candidate.structured_profile.projects.slice(0, 3).map((project) => {
                          const highlights = safeList(project.highlights)

                          return (
                            <li key={`${candidate.id}-${project.name}`}>
                              <strong>{safeText(project.name, copy.projectNameBroken)}</strong>
                              {project.role ? ` \u00b7 ${safeText(project.role, copy.roleFallback)}` : ''}
                              {highlights.length > 0 ? `\uff1a${highlights.join('\uff1b')}` : ''}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="actions compact">
                    <button className="button danger" onClick={() => void handleDelete(candidate.id, displayName)} type="button" disabled={deletingId === candidate.id}>
                      {deletingId === candidate.id ? copy.deleting : copy.delete}
                    </button>
                  </div>
                </div>
              </details>
            )
          })}

          {!loading && !loadError && candidates.length === 0 && <div className="empty">{copy.empty}</div>}
          {loading && <div className="empty">{copy.loading}</div>}
        </div>
      </section>
    </div>
  )
}
