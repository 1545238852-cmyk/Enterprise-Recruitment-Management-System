import Link from 'next/link'
import { apiGet } from '@/lib/api'
import { Candidate, DashboardMetrics, Job, KnowledgeDocument, Screening } from '@/lib/types'
import { safeList, safeText } from '@/lib/display'

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
          <h2 className="hero-title">把招聘流程放到一个页面里，少切系统，少做重复整理。</h2>
          <p className="hero-text">
            这个系统会帮你整理岗位说明、录入简历、推荐更合适的候选人，并保留每次筛选的依据，方便团队协作和复盘。
          </p>
          <div className="hero-actions">
            <Link className="button" href="/jobs">
              去新增岗位
            </Link>
            <Link className="button subtle" href="/candidates">
              去录入候选人
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">今天可以先做这 3 步</div>
          <div className="step-list">
            <div className="step-item">
              <strong>1. 录入岗位</strong>
              <span>填写岗位说明，系统会自动整理重点要求。</span>
            </div>
            <div className="step-item">
              <strong>2. 录入简历</strong>
              <span>支持粘贴内容或上传文件，快速形成候选人档案。</span>
            </div>
            <div className="step-item">
              <strong>3. 发起推荐</strong>
              <span>系统会给出排序结果、匹配原因和后续筛选建议。</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card accent-blue">
          <div className="stat-label">当前岗位</div>
          <div className="stat-value">{metrics?.jobs ?? 0}</div>
          <div className="stat-help">已录入并可用于推荐的人才需求</div>
        </article>
        <article className="stat-card accent-green">
          <div className="stat-label">候选人</div>
          <div className="stat-value">{metrics?.candidates ?? 0}</div>
          <div className="stat-help">系统已整理好的候选人档案</div>
        </article>
        <article className="stat-card accent-gold">
          <div className="stat-label">招聘资料</div>
          <div className="stat-value">{metrics?.knowledge_documents ?? 0}</div>
          <div className="stat-help">面试规范、岗位标准和常用资料</div>
        </article>
        <article className="stat-card accent-slate">
          <div className="stat-label">筛选记录</div>
          <div className="stat-value">{metrics?.screenings ?? 0}</div>
          <div className="stat-help">已沉淀的筛选结果和判断依据</div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">系统会怎么帮你做推荐</h3>
              <p className="card-subtitle">不是只看一个关键词，而是把多个信息放在一起判断。</p>
            </div>
          </div>
          <div className="feature-grid">
            <div className="feature-item">
              <strong>看岗位重点</strong>
              <p>自动识别必备技能、经验要求、关键词和岗位职责。</p>
            </div>
            <div className="feature-item">
              <strong>看候选人经历</strong>
              <p>结合工作年限、项目经验、技能和当前岗位做匹配。</p>
            </div>
            <div className="feature-item">
              <strong>看招聘资料</strong>
              <p>把面试标准、岗位说明和团队资料作为辅助参考。</p>
            </div>
          </div>
          <div className="divider" />
          <div className="kv"><span>平均推荐分</span><strong>{metrics?.average_match_score ?? 0}</strong></div>
          <div className="kv"><span>已推荐候选人</span><strong>{metrics?.recommended_candidates ?? 0}</strong></div>
          <div className="kv"><span>已完成筛选</span><strong>{metrics?.screenings ?? 0}</strong></div>
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">适合谁来用</h3>
              <p className="card-subtitle">页面文案和功能都尽量做成业务视角，不需要技术背景也能理解。</p>
            </div>
          </div>
          <div className="table-list">
            <div className="list-item plain">
              <strong>招聘专员</strong>
              <div className="small">快速录入岗位和简历，减少手工整理时间。</div>
            </div>
            <div className="list-item plain">
              <strong>业务面试官</strong>
              <div className="small">直接看到候选人为什么被推荐，以及建议追问的问题。</div>
            </div>
            <div className="list-item plain">
              <strong>招聘负责人</strong>
              <div className="small">统一查看岗位进度、筛选记录和系统推荐效果。</div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">最近岗位</h3>
              <p className="card-subtitle">最近录入的岗位会显示在这里，方便马上继续推荐。</p>
            </div>
            <Link className="text-link" href="/jobs">
              查看全部岗位
            </Link>
          </div>
          <div className="table-list">
            {jobs.slice(0, 4).map((job) => (
              <div className="list-item" key={job.id}>
                <div className="row-between start-on-mobile">
                  <strong>#{job.id} {safeText(job.title, '\u65e7\u5c97\u4f4d\u6570\u636e\u5f02\u5e38')}</strong>
                  <span className="badge">{job.structured_profile.role || '待整理'}</span>
                </div>
                <div className="small">重点技能：{job.structured_profile.must_have_skills.join('、') || '待补充'}</div>
              </div>
            ))}
            {jobs.length === 0 && <div className="empty">暂时还没有岗位数据，先去新增一个岗位吧。</div>}
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">最近筛选结果</h3>
              <p className="card-subtitle">每一次筛选都会保留结果，方便团队统一口径。</p>
            </div>
            <Link className="text-link" href="/screenings">
              查看筛选记录
            </Link>
          </div>
          <div className="table-list">
            {screenings.slice(0, 4).map((item) => (
              <div className="list-item" key={item.id}>
                <strong>筛选 #{item.id}</strong>
                <div className="small">岗位 {item.job_id} · 候选人 {item.candidate_id}</div>
                <div className="small">结果：{item.decision} · 评分 {item.score}</div>
              </div>
            ))}
            {screenings.length === 0 && <div className="empty">暂时还没有筛选记录。</div>}
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">候选人速览</h3>
              <p className="card-subtitle">快速查看最近录入的候选人背景。</p>
            </div>
            <Link className="text-link" href="/candidates">
              去管理候选人
            </Link>
          </div>
          <div className="table-list">
            {candidates.slice(0, 4).map((candidate) => (
              <div className="list-item" key={candidate.id}>
                <strong>#{candidate.id} {safeText(candidate.name, '\u65e7\u5019\u9009\u4eba\u6570\u636e\u5f02\u5e38')}</strong>
                <div className="small">{candidate.structured_profile.current_title || '岗位待整理'} · {candidate.structured_profile.skills.join('、') || '技能待补充'}</div>
              </div>
            ))}
            {candidates.length === 0 && <div className="empty">暂时还没有候选人。</div>}
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">资料库速览</h3>
              <p className="card-subtitle">把岗位标准、面试话术和内部规范放到一起管理。</p>
            </div>
            <Link className="text-link" href="/knowledge">
              去管理资料
            </Link>
          </div>
          <div className="table-list">
            {knowledge.slice(0, 4).map((doc) => (
              <div className="list-item" key={doc.id}>
                <strong>#{doc.id} {doc.name}</strong>
                <div className="small">{doc.category} · 可用片段 {doc.chunk_count}</div>
              </div>
            ))}
            {knowledge.length === 0 && <div className="empty">暂时还没有招聘资料。</div>}
          </div>
        </article>
      </section>
    </div>
  )
}
