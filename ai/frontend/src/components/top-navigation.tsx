'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BriefcaseBusiness, DatabaseZap, FileSearch, LayoutDashboard, UsersRound } from 'lucide-react'

const nav = [
  { href: '/', label: '总览', icon: LayoutDashboard },
  { href: '/jobs', label: '岗位', icon: BriefcaseBusiness },
  { href: '/candidates', label: '候选人', icon: UsersRound },
  { href: '/knowledge', label: '资料库', icon: DatabaseZap },
  { href: '/screenings', label: '筛选记录', icon: FileSearch },
  { href: '/evals', label: '效果分析', icon: BarChart3 },
]

export default function TopNavigation() {
  const pathname = usePathname()

  return (
    <nav className="nav-list" aria-label="主导航">
      {nav.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href

        return (
          <Link
            className={`nav-item ${active ? 'active' : ''}`}
            key={item.href}
            href={item.href}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
