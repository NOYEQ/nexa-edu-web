'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarNavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
}

export default function SidebarNavLink({ href, icon, label }: SidebarNavLinkProps) {
  const pathname = usePathname()
  const isActive =
    pathname === href ||
    (href !== '/dashboard' && href !== '/dashboard/admin' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
        {icon}
      </span>
      {label}
    </Link>
  )
}
