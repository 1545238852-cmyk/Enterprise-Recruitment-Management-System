import type { Metadata } from 'next'
import TopNavigation from '@/components/top-navigation'
import './globals.css'

export const metadata: Metadata = {
  title: '智能招聘助手',
  description: '帮助招聘团队快速管理岗位、简历、推荐和筛选流程。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <header className="site-header">
            <div className="site-header-inner">
              <div className="brand-block">
                <div className="brand-mark">IRA</div>
                <div>
                  <p className="brand-kicker">招聘工作台</p>
                  <h1 className="brand-title">智能招聘助手</h1>
                  <p className="brand-subtitle">
                    用更简单的方式管理岗位、候选人和筛选建议，让招聘团队更快做决定。
                  </p>
                </div>
              </div>

              <TopNavigation />

              <div className="header-status">
                <span className="status-dot" />
                <div>
                  <strong>系统在线</strong>
                  <span>可继续录入岗位与候选人</span>
                </div>
              </div>
            </div>
          </header>

          <main className="content">
            <div className="page-shell">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
