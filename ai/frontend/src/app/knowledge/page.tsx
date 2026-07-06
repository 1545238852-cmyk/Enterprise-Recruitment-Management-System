'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiUpload } from '@/lib/api'
import { KnowledgeDocument } from '@/lib/types'

const categoryOptions = [
  { value: 'job_standard', label: '岗位标准' },
  { value: 'interview_guide', label: '面试说明' },
  { value: 'playbook', label: '招聘流程' },
  { value: 'faq', label: '常见问答' },
  { value: 'other', label: '其他资料' },
]

const initialForm = {
  name: '面试流程说明 v1',
  category: 'interview_guide',
  content: '技术面试需要重点核实候选人的项目经历、岗位相关经验、协作方式和问题解决能力。',
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
      setMessage('资料已保存，系统已完成处理。')
      setForm(initialForm)
      await loadDocuments()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '资料保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!uploadFile) {
      setMessage('请先选择资料文件。')
      return
    }
    setUploading(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      const path = `/knowledge/upload?category=${encodeURIComponent(uploadCategory)}`
      await apiUpload<KnowledgeDocument>(path, formData)
      setMessage('资料文件已上传并保存成功。')
      setUploadFile(null)
      await loadDocuments()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '资料上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <span className="eyebrow-chip">资料库</span>
          <h2 className="hero-title">把招聘标准和常用说明放到一起，系统回答和筛选才更有依据。</h2>
          <p className="hero-text">
            这里可以统一保存岗位标准、面试说明、流程规范和常见问答。后续在推荐候选人、生成筛选建议和整理反馈时，系统都会参考这些资料。
          </p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">资料库的作用</div>
          <div className="step-list">
            <div className="step-item">
              <strong>统一口径</strong>
              <span>招聘团队、面试官和系统都参考同一份标准。</span>
            </div>
            <div className="step-item">
              <strong>增强推荐依据</strong>
              <span>不仅看简历关键词，也会结合你的内部资料来判断。</span>
            </div>
            <div className="step-item">
              <strong>支持持续沉淀</strong>
              <span>后面你可以不断补充模板、制度和问答内容。</span>
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
              <h3 className="card-title">手动新增资料</h3>
              <p className="card-subtitle">适合录入短内容，比如岗位标准、面试话术、流程说明等。</p>
            </div>
            <span className="badge">文本录入</span>
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
              <h3 className="card-title">上传已有文件</h3>
              <p className="card-subtitle">如果你已经有现成的岗位说明、题库或制度文档，也可以直接上传。</p>
            </div>
            <span className="badge">文件导入</span>
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
            <div className="small">当前文件：{uploadFile?.name ?? '尚未选择文件'}</div>
            <div className="actions">
              <button className="button secondary" disabled={uploading} type="submit">
                {uploading ? '上传中...' : '上传资料'}
              </button>
            </div>
          </form>
          <div className="divider" />
          <div className="feature-grid single-column">
            <div className="feature-item">
              <strong>系统会自动处理</strong>
              <p>上传后的资料会被拆分成可检索片段，用于后续 RAG 检索增强。</p>
            </div>
            <div className="feature-item">
              <strong>更适合真实项目展示</strong>
              <p>这部分能直接体现你做了知识库、检索增强和业务资料沉淀能力。</p>
            </div>
          </div>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h3 className="card-title">资料列表</h3>
            <p className="card-subtitle">系统会在推荐候选人、生成筛选建议和整理面试内容时参考这些资料。</p>
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
                <span className="score-pill">可用片段 {doc.chunk_count}</span>
                <span className="score-pill">创建时间 {new Date(doc.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {!loading && documents.length === 0 && <div className="empty">暂时还没有招聘资料，先录入一份面试说明或岗位标准吧。</div>}
          {loading && <div className="empty">正在加载资料列表...</div>}
        </div>
      </section>
    </div>
  )
}
