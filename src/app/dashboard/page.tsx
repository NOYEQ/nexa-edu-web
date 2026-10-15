import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, CreditCard, GraduationCap, TrendingUp, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, first_name')
    .eq('id', user!.id)
    .single()

  const userName = profile?.full_name || profile?.first_name || 'User'

  const [classesRes, studentsRes, enrollmentsRes, teachersRes] = await Promise.all([
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('class_students').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).in('role', ['teacher', 'institution_teacher', 'solo_teacher']),
  ])

  const stats = [
    {
      title: 'Total Students',
      value: studentsRes.count ?? 0,
      icon: <Users className="h-5 w-5" />,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
      href: '/dashboard/students',
    },
    {
      title: 'Active Classes',
      value: classesRes.count ?? 0,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      textColor: 'text-violet-600',
      href: '/dashboard/classes',
    },
    {
      title: 'Total Teachers',
      value: teachersRes.count ?? 0,
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      href: '/dashboard/teachers',
    },
    {
      title: 'Total Enrollments',
      value: enrollmentsRes.count ?? 0,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      textColor: 'text-amber-600',
      href: '/dashboard/payments',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl p-8"
        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
        <h1 className="text-3xl font-bold text-white">Good morning, {userName.split(' ')[0]}! 👋</h1>
        <p className="text-blue-100 mt-2 text-base">Here's what's happening with Nexa-Edu today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.textColor}`}>
                    {stat.icon}
                  </div>
                  <ArrowUpRight className={`h-4 w-4 ${stat.textColor} opacity-0 group-hover:opacity-100`} />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.title}</p>
                </div>
                <div className={`mt-4 h-1 w-full rounded-full bg-gradient-to-r ${stat.color} opacity-20`} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick links grid */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-white md:col-span-2">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-semibold text-slate-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Manage Students', href: '/dashboard/students', color: 'bg-blue-600' },
                { label: 'Manage Classes', href: '/dashboard/classes', color: 'bg-violet-600' },
                { label: 'Manage Teachers', href: '/dashboard/teachers', color: 'bg-emerald-600' },
                { label: 'View Payments', href: '/dashboard/payments', color: 'bg-amber-600' },
              ].map(action => (
                <Link key={action.href} href={action.href}
                  className={`flex items-center gap-3 p-4 rounded-xl text-white text-sm font-medium ${action.color} hover:opacity-90 transition-opacity shadow-sm`}>
                  <ArrowUpRight className="h-4 w-4" />
                  {action.label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div>
              <GraduationCap className="h-10 w-10 text-blue-200 mb-4" />
              <h3 className="font-bold text-xl">Nexa-Edu Web</h3>
              <p className="text-blue-200 text-sm mt-2">Your unified admin portal for managing every aspect of your tuition business.</p>
            </div>
            <div className="mt-6 text-xs text-blue-300">
              All changes sync to the mobile app in real-time.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
