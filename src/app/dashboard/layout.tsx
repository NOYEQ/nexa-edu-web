import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GraduationCap, LayoutDashboard, Users, BookOpen, CreditCard, LogOut, Bell } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import SidebarNavLink from '@/components/sidebar-nav-link'

async function signOut() {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
  const { redirect } = await import('next/navigation')
  redirect('/login')
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, first_name')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || profile?.first_name || user.email?.split('@')[0] || 'User'
  const userRole = profile?.role || 'student'
  const displayRole = userRole.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f0f0ff 100%)' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50">
        {/* Glass sidebar */}
        <div className="flex flex-col h-full m-3 rounded-2xl border border-white/60 shadow-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }}>
          
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-800">Nexa-Edu</span>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Admin Portal</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3">Main Menu</p>
            <SidebarNavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Overview" />
            <SidebarNavLink href="/dashboard/classes" icon={<BookOpen className="h-4 w-4" />} label="Classes" />
            <SidebarNavLink href="/dashboard/students" icon={<Users className="h-4 w-4" />} label="Students" />
            <SidebarNavLink href="/dashboard/teachers" icon={<GraduationCap className="h-4 w-4" />} label="Teachers" />
            
            <div className="pt-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3">Finance</p>
              <SidebarNavLink href="/dashboard/payments" icon={<CreditCard className="h-4 w-4" />} label="Payments" />
            </div>
          </nav>

          {/* User profile at bottom */}
          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                <p className="text-xs text-blue-500 truncate">{displayRole}</p>
              </div>
            </div>
            <form action={signOut} className="mt-2">
              <button type="submit" className="w-full flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:pl-[268px]">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-6 md:px-8 border-b border-white/60"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)' }}>
          <div className="md:hidden flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-slate-800">Nexa-Edu</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-colors">
              <Bell className="h-4 w-4 text-slate-500" />
            </button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
