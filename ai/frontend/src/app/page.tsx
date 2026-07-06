import Link from 'next/link'
import { apiGet } from '@/lib/api'
import { safeText } from '@/lib/display'
import { Candidate, DashboardMetrics, Job, KnowledgeDocument, Screening } from '@/lib/types'

async function getDashboardData() {
  const [metrics, jobs, candidates, knowledge, screenings] = await Promise.all([
    apiGet<DashboardMetrics>('/dashboard'),
    apiGet<Job[]>('/jobs'),
    apiGet<Candidate[]>('/candidates'),
    apiGet<KnowledgeDocument[]>('/knowledge'),
    apiGet<Screening[]>('/screenings'),
  ])

  return {
    metrics,
    jobs: jobs ?? [],
    candidates: candidates ?? [],
    knowledge: knowledge ?? [],
    screenings: screenings ?? [],
  }
}

export default async function DashboardPage() {
  const { metrics, jobs, candidates, knowledge, screenings } = await getDashboardData()

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow-chip">总览</span>
          <h2 className="hero-title">招聘总览</h2>
          <p className="hero-text">岗位、候选人、资料库、筛选记录</p>
          <div className="hero-actions">
            <Link className="button" href="/jobs">
              新增岗位
            </Link>
            <Link className="button subtle" href="/candidates">
              新增候选人
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">当前数据</div>
          <div className="step-list">
            <div className="step-item">
              <strong>岗位数量</strong>
              <span>{metrics?.jobs ?? 0}</span>
            </div>
            <div className="step-item">
              <strong>候选人数</strong>
              <span>{metrics?.candidates ?? 0}</span>
            </div>
            <div className="step-item">
              <strong>筛选记录</strong>
              <span>{metrics?.screenings ?? 0}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card accent-blue">
          <div className="stat-label">岗位数量</div>
          <div className="stat-value">{metrics?.jobs ?? 0}</div>
          <div className="stat-help">当前总数</div>
        </article>
        <article className="stat-card accent-green">
          <div className="stat-label">候选人数</div>
          <div className="stat-value">{metrics?.candidates ?? 0}</div>
          <div className="stat-help">当前总数</div>
        </article>
        <article className="stat-card accent-gold">
          <div className="stat-label">资料数量</div>
          <div className="stat-value">{metrics?.knowledge_documents ?? 0}</div>
          <div className="stat-help">当前总数</div>
        </article>
        <article className="stat-card accent-slate">
          <div className="stat-label">筛选记录</div>
          <div className="stat-value">{metrics?.screenings ?? 0}</div>
          <div className="stat-help">当前总数</div>
        </article>
      </section>

      <section className="grid two align-start">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">业务概览</h3>
            </div>
          </div>
          <div className="kv"><span>平均匹配分</span><strong>{metrics?.average_match_score ?? 0}</strong></div>
          <div className="kv"><span>推荐人次</span><strong>{metrics?.recommended_candidates ?? 0}</strong></div>
          <div className="kv"><span>最近岗位</span><strong>{jobs[0] ? `#${jobs[0].id}` : '-'}</strong></div>
          <div className="kv"><span>最近候选人</span><strong>{candidates[0] ? `#${candidates[0].id}` : '-'}</strong></div>
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">最近活动</h3>
            </div>
          </div>
          <div className="table-list">
            {jobs.slice(0, 2).map((job) => (
              <div className="list-item plain" key={`job-${job.id}`}>
                <strong>岗位 #{job.id}</strong>
                <div className="small">{safeText(job.title, '岗位数据异常')}</div>
              </div>
            ))}
            {candidates.slice(0, 2).map((candidate) => (
              <div className="list-item plain" key={`candidate-${candidate.id}`}>
                <strong>候选人 #{candidate.id}</strong>
                <div className="small">{safeText(candidate.name, '候选人数据异常')}</div>
              </div>
            ))}
            {screenings.slice(0, 2).map((item) => (
              <div className="list-item plain" key={`screening-${item.id}`}>
                <strong>筛选 #{item.id}</strong>
                <div className="small">岗位 {item.job_id} · 候选人 {item.candidate_id}</div>
              </div>
            ))}
            {jobs.length === 0 && candidates.length === 0 && screenings.length === 0 && (
              <div className="empty">暂无数据</div>
            )}
          </div>
        </article>
      </section>

      <section className="grid two align-start">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">岗位列表</h3>
            </div>
            <Link className="text-link" href="/jobs">
              查看全部
            </Link>
          </div>
          <div className="table-list">
            {jobs.slice(0, 4).map((job) => (
              <div className="list-item" key={job.id}>
                <div className="row-between start-on-mobile">
                  <strong>#{job.id} {safeText(job.title, '岗位数据异常')}</strong>
                  <span className="badge">{safeText(job.structured_profile.role, '待补充')}</span>
                </div>
                <div className="small">必备技能：{job.structured_profile.must_have_skills.join('、') || '待补充'}</div>
              </div>
            ))}
            {jobs.length === 0 && <div className="empty">暂无岗位</div>}
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">候选人列表</h3>
            </div>
            <Link className="text-link" href="/candidates">
              查看全部
            </Link>
          </div>
          <div className="table-list">
            {candidates.slice(0, 4).map((candidate) => (
              <div className="list-item" key={candidate.id}>
                <div className="row-between start-on-mobile">
                  <strong>#{candidate.id} {safeText(candidate.name, '候选人数据异常')}</strong>
                  <span className="badge">{candidate.structured_profile.years_experience} 年</span>
                </div>
                <div className="small">当前岗位：{safeText(candidate.structured_profile.current_title, '待补充')}</div>
              </div>
            ))}
            {candidates.length === 0 && <div className="empty">暂无候选人</div>}
          </div>
        </article>
      </section>

      <section className="grid two align-start">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">资料列表</h3>
            </div>
            <Link className="text-link" href="/knowledge">
              查看全部
            </Link>
          </div>
          <div className="table-list">
            {knowledge.slice(0, 4).map((doc) => (
              <div className="list-item" key={doc.id}>
                <div className="row-between start-on-mobile">
                  <strong>#{doc.id} {doc.name}</strong>
                  <span className="badge">{doc.category}</span>
                </div>
                <div className="small">片段数：{doc.chunk_count}</div>
              </div>
            ))}
            {knowledge.length === 0 && <div className="empty">暂无资料</div>}
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">筛选记录</h3>
            </div>
            <Link className="text-link" href="/screenings">
              查看全部
            </Link>
          </div>
          <div className="table-list">
            {screenings.slice(0, 4).map((item) => (
              <div className="list-item" key={item.id}>
                <div className="row-between start-on-mobile">
                  <strong>筛选 #{item.id}</strong>
                  <span className="badge">{item.score} 分</span>
                </div>
                <div className="small">岗位 {item.job_id} · 候选人 {item.candidate_id}</div>
              </div>
            ))}
            {screenings.length === 0 && <div className="empty">暂无筛选记录</div>}
          </div>
        </article>
      </section>
    </div>
  )
}
