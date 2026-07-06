import { apiGet } from '@/lib/api'
import { DashboardMetrics, RetrievalEvalResponse } from '@/lib/types'
import { safeText } from '@/lib/display'

async function getEvalData() {
  const [evals, dashboard] = await Promise.all([
    apiGet<RetrievalEvalResponse>('/evals/retrieval'),
    apiGet<DashboardMetrics>('/dashboard'),
  ])
  return { evals, dashboard }
}

export default async function EvalsPage() {
  const { evals, dashboard } = await getEvalData()

  return (
    <div className="page-stack">
      <section className="hero-card compact-hero">
        <div className="hero-copy">
          <span className="eyebrow-chip">效果分析</span>
          <h2 className="hero-title">不仅要能推荐，还要知道推荐得准不准。</h2>
          <p className="hero-text">
            这一页主要用来观察系统推荐效果。数字越高，说明系统越容易把更合适的候选人排在前面，也更适合写进简历和项目汇报里。
          </p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">怎么看这页数据</div>
          <div className="step-list">
            <div className="step-item">
              <strong>首推命中率</strong>
              <span>系统排第一的人，是否就是最合适的人。</span>
            </div>
            <div className="step-item">
              <strong>前 3 名命中率</strong>
              <span>系统前几名里，是否包含真正合适的候选人。</span>
            </div>
            <div className="step-item">
              <strong>排序表现</strong>
              <span>合适的人整体是否被排在更靠前的位置。</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card accent-blue">
          <div className="stat-label">首推命中率</div>
          <div className="stat-value">{evals?.summary.recall_at_1 ?? 0}</div>
          <div className="stat-help">系统排在第一位的人选，命中理想候选人的比例</div>
        </article>
        <article className="stat-card accent-green">
          <div className="stat-label">前 3 名命中率</div>
          <div className="stat-value">{evals?.summary.recall_at_3 ?? 0}</div>
          <div className="stat-help">系统前 3 个推荐里命中合适人选的比例</div>
        </article>
        <article className="stat-card accent-gold">
          <div className="stat-label">排序表现</div>
          <div className="stat-value">{evals?.summary.mrr ?? 0}</div>
          <div className="stat-help">合适候选人出现在靠前位置的稳定程度</div>
        </article>
        <article className="stat-card accent-slate">
          <div className="stat-label">平均推荐分</div>
          <div className="stat-value">{dashboard?.average_match_score ?? 0}</div>
          <div className="stat-help">当前系统对候选人整体匹配度的平均判断</div>
        </article>
      </section>

      <section className="grid two align-start">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">统计概览</h3>
              <p className="card-subtitle">这些数据能帮助你判断当前推荐逻辑是否靠谱。</p>
            </div>
          </div>
          <div className="kv"><span>已评估岗位</span><strong>{evals?.total_jobs_evaluated ?? 0}</strong></div>
          <div className="kv"><span>候选人总数</span><strong>{evals?.total_candidates ?? 0}</strong></div>
          <div className="kv"><span>筛选记录</span><strong>{dashboard?.screenings ?? 0}</strong></div>
          <div className="kv"><span>招聘资料数</span><strong>{dashboard?.knowledge_documents ?? 0}</strong></div>
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">优化建议</h3>
              <p className="card-subtitle">如果你后面继续迭代，这些点也可以直接写进项目亮点。</p>
            </div>
          </div>
          <div className="table-list">
            {(evals?.strategy_notes ?? []).map((note) => (
              <div className="list-item elevated" key={note}>
                <div className="small">{note}</div>
              </div>
            ))}
            {!evals && <div className="empty">统计接口暂时没有返回数据。</div>}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h3 className="card-title">按岗位查看结果</h3>
            <p className="card-subtitle">可以直接看到每个岗位的理想候选人和系统推荐结果，方便后续继续优化。</p>
          </div>
        </div>
        <div className="table-list">
          {evals?.cases.map((item) => (
            <div className="list-item elevated" key={item.job_id}>
              <div className="row-between start-on-mobile">
                <strong>岗位 #{item.job_id} · {safeText(item.job_title, '\u65e7\u5c97\u4f4d\u6570\u636e\u5f02\u5e38')}</strong>
                <span className="badge">前 3 名准确度 {item.precision_at_3}</span>
              </div>
              <div className="small">理想候选人 ID：{item.relevant_candidate_ids.join(', ') || '无'}</div>
              <div className="small">系统推荐 ID：{item.ranked_candidate_ids.join(', ') || '无'}</div>
              <div className="mini-grid">
                <div className="mini-kpi"><span>首推命中</span><strong>{item.recall_at_1}</strong></div>
                <div className="mini-kpi"><span>前3命中</span><strong>{item.recall_at_3}</strong></div>
                <div className="mini-kpi"><span>前5命中</span><strong>{item.recall_at_5}</strong></div>
                <div className="mini-kpi"><span>排序表现</span><strong>{item.mrr}</strong></div>
              </div>
            </div>
          ))}
          {!evals?.cases.length && <div className="empty">请先录入岗位和候选人，系统才会生成统计结果。</div>}
        </div>
      </section>
    </div>
  )
}
