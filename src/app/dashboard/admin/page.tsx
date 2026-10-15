import { fetchPlatformData } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Crown,
  Zap,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  Sliders,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const data = await fetchPlatformData()

  const freeTotal = data.tierDistribution.free
  const proTotal = data.tierDistribution.pro
  const unlimitedTotal = data.tierDistribution.unlimited
  const totalSubscribers = freeTotal + proTotal + unlimitedTotal

  const quotaIssuesCount =
    data.institutions.filter(i => i.status !== 'healthy').length +
    data.teachers.filter(t => t.status !== 'healthy').length

  return (
    <div className="space-y-6">
      {/* Platform Super Admin Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl p-7 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-indigo-900/40">
        <div
          className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full opacity-20 bg-indigo-500"
          style={{ filter: 'blur(50px)' }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-indigo-600/60 text-indigo-200 border border-indigo-400/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
                Platform Master Admin Profile
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1">
                <Crown className="h-3 w-3 text-amber-400" />
                Unlimited Access
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Platform Management & Operations Hub
            </h1>
            <p className="text-indigo-200/80 text-sm max-w-2xl leading-relaxed">
              Full administrative authority over all tuition institutions, teaching staff, class batches, and enrolled students. Monitor subscription tiers and live usage quotas across the ecosystem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard/admin/institutions"
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Building2 className="h-4 w-4 text-blue-600" />
              Manage Centers
            </Link>
            <Link
              href="/dashboard/admin/reports"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <BarChart3 className="h-4 w-4" />
              Usage Reports
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Platform Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/admin/institutions" className="group">
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Building2 className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{data.totalInstitutions}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Tuition Institutes</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Registered learning centers</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/teachers" className="group">
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{data.totalTeachers}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Teaching Staff</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Center instructors & solo</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/classes" className="group">
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <BookOpen className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{data.totalClasses}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Scheduled Classes</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Timetables & batches</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/students" className="group">
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">{data.totalStudents}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Enrolled Students</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Registered student profiles</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Subscription Tier Distribution & Capacity Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Distribution (1 col) */}
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              Subscription Tiers Allocation
            </h3>
            <Link
              href="/dashboard/admin/institutions"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Adjust
            </Link>
          </div>

          <div className="space-y-3">
            {/* Unlimited */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Unlimited Plan</p>
                  <p className="text-[10px] text-slate-500">Uncapped classes & students</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-amber-700">{unlimitedTotal}</span>
            </div>

            {/* Pro */}
            <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Pro Plan</p>
                  <p className="text-[10px] text-slate-500">Up to 100 students</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-violet-700">{proTotal}</span>
            </div>

            {/* Free */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Free Plan</p>
                  <p className="text-[10px] text-slate-500">1 class • 5 students</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-slate-700">{freeTotal}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Managed Entities</span>
            <span className="font-bold text-slate-800">{totalSubscribers}</span>
          </div>
        </Card>

        {/* Operational Overview & Quick Navigation (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                Administrative Command Portals
              </h3>
              <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
                Instant Navigation
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/dashboard/admin/institutions"
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-start gap-3 group"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Institutions Management
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Edit centers, adjust Free/Pro/Unlimited plans, and examine student caps.
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/admin/teachers"
                className="p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-3 group"
              >
                <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Teachers & Staff Directory
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-600 transition-colors" />
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    View all instructors across institutions, assign classes, and inspect plans.
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/admin/reports"
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-start gap-3 group"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Live Usage & Quota Reports
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Inspect who has maxed out their classes or students, and export CSV logs.
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/classes"
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex items-start gap-3 group"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    All Classes Master List
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Schedule, edit or delete classes for any center or instructor.
                  </p>
                </div>
              </Link>
            </div>
          </Card>

          {/* Quota Exceeded Alert Banner */}
          {quotaIssuesCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-amber-900">
                    {quotaIssuesCount} center(s) or instructor(s) at or exceeding plan quota
                  </h5>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Accounts on the Free or Pro tier have reached their student/class limits. Upgrade them to preserve uninterrupted mobile app sync.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/admin/reports"
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
              >
                Resolve
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
