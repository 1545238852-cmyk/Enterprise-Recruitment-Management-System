'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, apiUpload } from '@/lib/api'
import { KnowledgeDocument } from '@/lib/types'

const categoryOptions = [
  { value: 'job_standard', label: '岗位标准' },
  { value: 'interview_guide', label: '面试说明' },
  { value: 'playbook', label: '流程文件' },
  { value: 'faq', label: '常见问答' },
  { value: 'other', label: '其他资料' },
]

const initialForm = {
  name: '面试流程说明 v1',
  category: 'interview_guide',
  content: '技术面试重点核实项目经历、岗位经验、协作方式与问题处理能力。',
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [form, setForm] = useState(initialForm)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = useState('playbook')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadDocuments() {
    setLoading(true)
    try {
      const data = await apiGet<KnowledgeDocument[]>('/knowledge')
      setDocuments(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDocuments()
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      await apiPost<KnowledgeDocument>('/knowledge', { ...form, metadata: { source: 'manual-ui' } })
      setMessage('资料已保存')
      setForm(initialForm)
      await loadDocuments()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!uploadFile) {
      setMessage('请选择资料文件')
      return
    }
    setUploading(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      const path = `/knowledge/upload?category=${encodeURIComponent(uploadCategory)}`
      await apiUpload<KnowledgeDocument>(path, formData)
      setMessage('上传完成')
      setUploadFile(null)
      await loadDocuments()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const standardCount = useMemo(() => documents.filter((doc) => doc.category === 'job_standard').length, [documents])
  const guideCount = useMemo(() => documents.filter((doc) => doc.category === 'interview_guide').length, [documents])
  const processCount = useMemo(() => documents.filter((doc) => doc.category === 'playbook').length, [documents])

  return (
    <div className="page-stack">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <span className="eyebrow-chip">资料库</span>
          <h2 className="hero-title">资料库</h2>
          <p className="hero-text">岗位标准、面试说明、流程文件</p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">资料概览</div>
          <div className="step-list">
            <div className="step-item">
              <strong>资料总数</strong>
              <span>{documents.length}</span>
            </div>
            <div className="step-item">
              <strong>岗位标准</strong>
              <span>{standardCount}</span>
            </div>
            <div className="step-item">
              <strong>面试说明</strong>
              <span>{guideCount + processCount}</span>
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
              <h3 className="card-title">新增资料</h3>
              <p className="card-subtitle">资料名称、资料分类、资料内容</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleCreate}>
            <div className="grid two">
              <div>
                <label className="label">资料名称</label>
                <input className="input" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">资料分类</label>
                <select className="select" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">资料内容</label>
              <textarea className="textarea xl" value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} />
            </div>
            <div className="actions">
              <button className="button" disabled={submitting} type="submit">
                {submitting ? '保存中...' : '保存资料'}
              </button>
            </div>
          </form>
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">文件上传</h3>
              <p className="card-subtitle">PDF、DOC、DOCX、TXT、MD</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleUpload}>
            <div>
              <label className="label">资料分类</label>
              <select className="select" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">选择文件</label>
              <input className="input" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} type="file" accept=".pdf,.doc,.docx,.txt,.md" />
            </div>
            <div className="small">当前文件：{uploadFile?.name ?? '未选择'}</div>
            <div className="actions">
              <button className="button secondary" disabled={uploading} type="submit">
                {uploading ? '上传中...' : '上传资料'}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h3 className="card-title">资料列表</h3>
          </div>
          <button className="button subtle" onClick={() => void loadDocuments()} type="button" disabled={loading}>
            {loading ? '刷新中...' : '刷新列表'}
          </button>
        </div>
        <div className="table-list">
          {documents.map((doc) => (
            <div className="list-item elevated" key={doc.id}>
              <div className="row-between start-on-mobile">
                <strong>#{doc.id} {doc.name}</strong>
                <span className="badge">{categoryOptions.find((item) => item.value === doc.category)?.label ?? doc.category}</span>
              </div>
              <div className="score-pills">
                <span className="score-pill">片段数 {doc.chunk_count}</span>
                <span className="score-pill">创建时间 {new Date(doc.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {!loading && documents.length === 0 && <div className="empty">暂无资料</div>}
          {loading && <div className="empty">正在加载...</div>}
        </div>
      </section>
    </div>
  )
}
