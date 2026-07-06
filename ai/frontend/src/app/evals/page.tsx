import { apiGet } from '@/lib/api'
import { safeText } from '@/lib/display'
import { DashboardMetrics, RetrievalEvalResponse } from '@/lib/types'

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
          <span className="eyebrow-chip">评估报表</span>
          <h2 className="hero-title">评估报表</h2>
          <p className="hero-text">召回率、准确率、排序表现</p>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-label">评估范围</div>
          <div className="step-list">
            <div className="step-item">
              <strong>统计时间</strong>
              <span>{evals?.generated_at ? new Date(evals.generated_at).toLocaleString() : '-'}</span>
            </div>
            <div className="step-item">
              <strong>评估岗位</strong>
              <span>{evals?.total_jobs_evaluated ?? 0}</span>
            </div>
            <div className="step-item">
              <strong>候选人数</strong>
              <span>{evals?.total_candidates ?? 0}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card accent-blue">
          <div className="stat-label">首推命中率</div>
          <div className="stat-value">{evals?.summary.recall_at_1 ?? 0}</div>
          <div className="stat-help">当前值</div>
        </article>
        <article className="stat-card accent-green">
          <div className="stat-label">前3命中率</div>
          <div className="stat-value">{evals?.summary.recall_at_3 ?? 0}</div>
          <div className="stat-help">当前值</div>
        </article>
        <article className="stat-card accent-gold">
          <div className="stat-label">排序表现</div>
          <div className="stat-value">{evals?.summary.mrr ?? 0}</div>
          <div className="stat-help">当前值</div>
        </article>
        <article className="stat-card accent-slate">
          <div className="stat-label">平均匹配分</div>
          <div className="stat-value">{dashboard?.average_match_score ?? 0}</div>
          <div className="stat-help">当前值</div>
        </article>
      </section>

      <section className="grid two align-start">
        <article className="card">
          <div className="section-heading">
            <div>
              <h3 className="card-title">统计概览</h3>
            </div>
          </div>
          <div className="kv"><span>已评估岗位</span><strong>{evals?.total_jobs_evaluated ?? 0}</strong></div>
          <div className="kv"><span>候选人总数</span><strong>{evals?.total_candidates ?? 0}</strong></div>
          <div className="kv"><span>筛选记录</span><strong>{dashboard?.screenings ?? 0}</strong></div>
          <div className="kv"><span>资料数量</span><strong>{dashboard?.knowledge_documents ?? 0}</strong></div>
        </article>

        <article className="card soft-panel">
          <div className="section-heading">
            <div>
              <h3 className="card-title">策略备注</h3>
            </div>
          </div>
          <div className="table-list">
            {(evals?.strategy_notes ?? []).map((note) => (
              <div className="list-item elevated" key={note}>
                <div className="small">{note}</div>
              </div>
            ))}
            {!evals && <div className="empty">暂无数据</div>}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h3 className="card-title">岗位结果</h3>
          </div>
        </div>
        <div className="table-list">
          {evals?.cases.map((item) => (
            <div className="list-item elevated" key={item.job_id}>
              <div className="row-between start-on-mobile">
                <strong>岗位 #{item.job_id} · {safeText(item.job_title, '岗位数据异常')}</strong>
                <span className="badge">前3准确率 {item.precision_at_3}</span>
              </div>
              <div className="small">相关候选人：{item.relevant_candidate_ids.join(', ') || '无'}</div>
              <div className="small">推荐结果：{item.ranked_candidate_ids.join(', ') || '无'}</div>
              <div className="mini-grid">
                <div className="mini-kpi"><span>首推命中</span><strong>{item.recall_at_1}</strong></div>
                <div className="mini-kpi"><span>前3命中</span><strong>{item.recall_at_3}</strong></div>
                <div className="mini-kpi"><span>前5命中</span><strong>{item.recall_at_5}</strong></div>
                <div className="mini-kpi"><span>排序表现</span><strong>{item.mrr}</strong></div>
              </div>
            </div>
          ))}
          {!evals?.cases.length && <div className="empty">暂无评估数据</div>}
        </div>
      </section>
    </div>
  )
}
