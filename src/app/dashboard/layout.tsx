import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  LogOut,
  Bell,
  Sparkles,
  Search,
  Building2,
  ShieldCheck,
  BarChart3,
  Crown,
  UserCheck,
} from 'lucide-react'
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, institution_id')
    .eq('id', user.id)
    .maybeSingle()

  const isSuperAdmin = profile?.role === 'super_admin' || user.email === 'institute@noyeq.com'
  const userName = profile?.full_name || (isSuperAdmin ? 'Master Admin' : user.email?.split('@')[0] || 'User')
  const userRole = profile?.role || 'institution'
  const displayRole = isSuperAdmin ? 'Platform Admin' : userRole.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen w-full bg-slate-50/70">
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50">
        <div className="flex flex-col h-full bg-white border-r border-slate-200/80 shadow-sm">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-md shrink-0 ${
              isSuperAdmin
                ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-purple-200'
                : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-200'
            }`}>
              {isSuperAdmin ? (
                <Crown className="h-5 w-5 text-amber-300" />
              ) : (
                <GraduationCap className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="overflow-hidden">
              <span className="text-base font-bold text-slate-900 tracking-tight block">Nexa-Edu</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest block ${
                isSuperAdmin ? 'text-indigo-600' : 'text-blue-600'
              }`}>
                {displayRole}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {/* Platform Master Admin Section */}
            {isSuperAdmin && (
              <div className="mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between px-3 mb-2">
                  <p className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    Platform Admin
                  </p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                    MASTER
                  </span>
                </div>
                <div className="space-y-1">
                  <SidebarNavLink
                    href="/dashboard/admin"
                    icon={<LayoutDashboard className="h-4 w-4" />}
                    label="Control Hub"
                  />
                  <SidebarNavLink
                    href="/dashboard/admin/institutions"
                    icon={<Building2 className="h-4 w-4" />}
                    label="Institutes & Tiers"
                  />
                  <SidebarNavLink
                    href="/dashboard/admin/teachers"
                    icon={<UserCheck className="h-4 w-4" />}
                    label="Teachers Directory"
                  />
                  <SidebarNavLink
                    href="/dashboard/admin/reports"
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Usage & Reports"
                  />
                </div>
              </div>
            )}

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              {isSuperAdmin ? 'Operations' : 'Main Menu'}
            </p>
            <SidebarNavLink
              href="/dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Overview"
            />
            <SidebarNavLink
              href="/dashboard/classes"
              icon={<BookOpen className="h-4 w-4" />}
              label="Classes & Batches"
            />
            <SidebarNavLink
              href="/dashboard/students"
              icon={<Users className="h-4 w-4" />}
              label="Students Roster"
            />
            <SidebarNavLink
              href="/dashboard/teachers"
              icon={<GraduationCap className="h-4 w-4" />}
              label="Teachers & Staff"
            />

            <div className="pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
                Finances
              </p>
              <SidebarNavLink
                href="/dashboard/payments"
                icon={<CreditCard className="h-4 w-4" />}
                label="Fee Payments"
              />
            </div>
          </nav>

          {/* User Profile Card at Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-sm">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
                <p className="text-[11px] text-blue-600 font-medium truncate">{displayRole}</p>
              </div>
            </div>

            <form action={signOut} className="mt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-600 hover:text-red-600 transition-colors py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-6 md:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-xs">
          {/* Mobile Brand */}
          <div className="md:hidden flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Nexa-Edu</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium bg-slate-50 text-slate-600 border-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Connected to Supabase
            </Badge>
            {isSuperAdmin && (
              <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs border-0 shadow-xs flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-amber-300" />
                Platform Master Admin
              </Badge>
            )}
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center gap-3">
            <button
              title="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{userName}</p>
                <p className="text-[10px] text-slate-400 font-medium">{displayRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}
