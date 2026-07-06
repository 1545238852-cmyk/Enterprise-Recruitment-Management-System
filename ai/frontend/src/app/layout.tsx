import type { Metadata } from 'next'
import TopNavigation from '@/components/top-navigation'
import './globals.css'

export const metadata: Metadata = {
  title: '招聘管理系统',
  description: '岗位、候选人、资料库与筛选记录',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <header className="site-header">
            <div className="site-header-inner">
              <div className="brand-block">
                <div className="brand-mark">ATS</div>
                <div>
                  <p className="brand-kicker">Recruiting</p>
                  <h1 className="brand-title">招聘管理系统</h1>
                </div>
              </div>

              <TopNavigation />

              <div className="header-status">
                <span className="status-dot" />
                <div>
                  <strong>在线</strong>
                  <span>正常</span>
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
