import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  BookOpen,
  CreditCard,
  GraduationCap,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, institution_id')
    .eq('id', user?.id || '')
    .maybeSingle()

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Educator'
  const roleName = (profile?.role || 'institution').replace(/_/g, ' ')

  // Fetch counts from real tables
  const [classesRes, studentsRes, enrollmentsRes, teachersRes, upcomingClassesRes] = await Promise.all([
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('class_students').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['teacher', 'institution_teacher', 'solo_teacher']),
    supabase
      .from('classes')
      .select('id, name, subject, grade, schedule_day, schedule_time, fee, class_students(id)')
      .limit(5)
      .order('created_at', { ascending: false }),
  ])

  const stats = [
    {
      title: 'Total Students',
      value: studentsRes.count ?? 0,
      icon: <Users className="h-5 w-5" />,
      color: 'from-blue-600 to-indigo-600',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100',
      href: '/dashboard/students',
      label: 'Registered Roster',
    },
    {
      title: 'Active Classes',
      value: classesRes.count ?? 0,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'from-violet-600 to-purple-600',
      bg: 'bg-violet-50',
      textColor: 'text-violet-600',
      borderColor: 'border-violet-100',
      href: '/dashboard/classes',
      label: 'Scheduled Batches',
    },
    {
      title: 'Teaching Staff',
      value: teachersRes.count ?? 0,
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'from-emerald-600 to-teal-600',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
      href: '/dashboard/teachers',
      label: 'Active Instructors',
    },
    {
      title: 'Class Enrollments',
      value: enrollmentsRes.count ?? 0,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-100',
      href: '/dashboard/classes',
      label: 'Active Seats',
    },
  ]

  const upcomingClasses = upcomingClassesRes.data || []

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-7 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-200">
        <div
          className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full opacity-10 bg-white"
          style={{ filter: 'blur(30px)' }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-[11px] font-semibold uppercase tracking-wider">
                {roleName} Overview
              </Badge>
              <span className="text-blue-200 text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Live Sync Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {userName.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Here is your tuition operational summary. Manage class timetables, monitor student enrollments, and track fee collection.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/classes"
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <BookOpen className="h-4 w-4" />
              Manage Classes
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="group">
            <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} ${stat.textColor} border ${stat.borderColor}`}
                  >
                    {stat.icon}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{stat.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Grid: Recent Classes & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Snapshot (2 cols) */}
        <Card className="lg:col-span-2 border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Active Classes & Schedules
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Overview of tuition batches and student seats</p>
            </div>
            <Link
              href="/dashboard/classes"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All ({classesRes.count ?? 0})
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingClasses.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingClasses.map((cls: any) => {
                  const enrolled = cls.class_students?.length ?? 0
                  return (
                    <div
                      key={cls.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{cls.name}</p>
                          <p className="text-xs text-slate-400">
                            {cls.subject} • {cls.grade}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end text-right">
                          <Badge variant="outline" className="text-[11px] font-semibold text-slate-700">
                            {cls.schedule_day}
                          </Badge>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {cls.schedule_time}
                          </span>
                        </div>

                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 text-xs font-semibold px-2.5 py-1">
                          {enrolled} Students
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No classes created yet.</p>
                <Link
                  href="/dashboard/classes"
                  className="mt-2 inline-block text-blue-600 font-semibold"
                >
                  Create your first class
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Mobile Sync Card (1 col) */}
        <div className="space-y-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Quick Navigation</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/classes"
                className="flex items-center justify-between p-3 rounded-xl bg-violet-50/60 hover:bg-violet-100/70 text-violet-900 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-violet-600" />
                  Manage Classes & Batches
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-violet-400" />
              </Link>

              <Link
                href="/dashboard/students"
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  View Enrolled Students
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-blue-400" />
              </Link>

              <Link
                href="/dashboard/teachers"
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  Assign & View Teachers
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-emerald-400" />
              </Link>

              <Link
                href="/dashboard/payments"
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 text-xs font-semibold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  Review Fee Payments
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
              </Link>
            </div>
          </Card>

          <Card className="border border-slate-200/80 shadow-xs bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Mobile App Sync</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All classes, enrollments, and tuition schedules updated here reflect immediately on students' and teachers' mobile apps in real-time.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
