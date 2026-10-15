'use client'

import React, { useState, useTransition } from 'react'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Crown,
  Zap,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  InstitutionUsage,
  TeacherUsage,
  TierType,
  updateInstitutionTier,
  updateTeacherTier
} from '../actions'

interface ReportsClientProps {
  institutions: InstitutionUsage[]
  teachers: TeacherUsage[]
  totalFeeVolume: number
}

export default function ReportsClient({ institutions, teachers, totalFeeVolume }: ReportsClientProps) {
  const [instList, setInstList] = useState<InstitutionUsage[]>(institutions)
  const [teacherList, setTeacherList] = useState<TeacherUsage[]>(teachers)
  const [activeTab, setActiveTab] = useState<'all' | 'institutions' | 'teachers'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | TierType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'warning' | 'exceeded'>('all')
  const [isPending, startTransition] = useTransition()

  // Quick upgrade modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [upgradeTarget, setUpgradeTarget] = useState<{ id: string; name: string; type: 'institution' | 'teacher'; currentTier: TierType } | null>(null)
  const [selectedTier, setSelectedTier] = useState<TierType>('pro')
  const [actionError, setActionError] = useState<string | null>(null)

  // Combine rows for unified reporting ledger
  interface LedgerItem {
    id: string
    name: string
    category: 'Institution' | 'Solo Teacher' | 'Institution Teacher'
    rawType: 'institution' | 'teacher'
    associated: string
    tier: TierType
    classesCount: number
    maxClasses: number
    studentsCount: number
    maxStudents: number
    feeVolume: number
    utilizationRate: number
    status: 'healthy' | 'warning' | 'exceeded'
  }

  const combinedLedger: LedgerItem[] = [
    ...instList.map(inst => ({
      id: inst.id,
      name: inst.name,
      category: 'Institution' as const,
      rawType: 'institution' as const,
      associated: inst.ownerName + ' (' + inst.ownerEmail + ')',
      tier: inst.tier,
      classesCount: inst.classesCount,
      maxClasses: inst.maxClasses,
      studentsCount: inst.studentsCount,
      maxStudents: inst.maxStudents,
      feeVolume: inst.feeVolume,
      utilizationRate: inst.utilizationRate,
      status: inst.status,
    })),
    ...teacherList.map(t => ({
      id: t.id,
      name: t.name,
      category: (t.role === 'solo_teacher' ? 'Solo Teacher' : 'Institution Teacher') as any,
      rawType: 'teacher' as const,
      associated: t.institutionName,
      tier: t.tier,
      classesCount: t.classesCount,
      maxClasses: t.maxClasses,
      studentsCount: t.studentsCount,
      maxStudents: t.maxStudents,
      feeVolume: t.feeVolume,
      utilizationRate: t.utilizationRate,
      status: t.status,
    })),
  ]

  const filteredItems = combinedLedger.filter(item => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'institutions' && item.rawType === 'institution') ||
      (activeTab === 'teachers' && item.rawType === 'teacher')

    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.associated.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTier = tierFilter === 'all' || item.tier === tierFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesTab && matchesQuery && matchesTier && matchesStatus
  })

  // Executive KPI summary calculations
  const totalClassesAcross = instList.reduce((acc, curr) => acc + curr.classesCount, 0)
  const totalStudentsAcross = instList.reduce((acc, curr) => acc + curr.studentsCount, 0)
  const exceededCount = combinedLedger.filter(i => i.status === 'exceeded').length
  const warningCount = combinedLedger.filter(i => i.status === 'warning').length

  const handleOpenUpgrade = (item: LedgerItem) => {
    setUpgradeTarget({
      id: item.id,
      name: item.name,
      type: item.rawType,
      currentTier: item.tier
    })
    setSelectedTier(item.tier === 'free' ? 'pro' : 'unlimited')
    setActionError(null)
    setUpgradeModalOpen(true)
  }

  const handleSaveUpgrade = () => {
    if (!upgradeTarget) return
    setActionError(null)

    startTransition(async () => {
      let res: { success?: boolean; error?: string }
      if (upgradeTarget.type === 'institution') {
        res = await updateInstitutionTier(upgradeTarget.id, selectedTier)
        if (!res.error) {
          setInstList(prev =>
            prev.map(inst =>
              inst.id === upgradeTarget.id
                ? {
                    ...inst,
                    tier: selectedTier,
                    maxClasses: selectedTier === 'free' ? 1 : 999999,
                    maxStudents: selectedTier === 'free' ? 5 : selectedTier === 'pro' ? 100 : 999999,
                    status: inst.studentsCount > (selectedTier === 'free' ? 5 : selectedTier === 'pro' ? 100 : 999999) ? 'exceeded' : 'healthy'
                  }
                : inst
            )
          )
        }
      } else {
        res = await updateTeacherTier(upgradeTarget.id, selectedTier)
        if (!res.error) {
          setTeacherList(prev =>
            prev.map(t =>
              t.id === upgradeTarget.id
                ? {
                    ...t,
                    tier: selectedTier,
                    maxClasses: selectedTier === 'free' ? 1 : 999999,
                    maxStudents: selectedTier === 'free' ? 5 : selectedTier === 'pro' ? 100 : 999999,
                    status: t.studentsCount > (selectedTier === 'free' ? 5 : selectedTier === 'pro' ? 100 : 999999) ? 'exceeded' : 'healthy'
                  }
                : t
            )
          )
        }
      }

      if (res.error) {
        setActionError(res.error)
      } else {
        setUpgradeModalOpen(false)
      }
    })
  }

  // Export to CSV functionality
  const handleExportCSV = () => {
    const headers = ['Entity Name', 'Category', 'Affiliation / Owner', 'Tier', 'Classes Active', 'Classes Limit', 'Students Enrolled', 'Students Limit', 'Utilization %', 'Fee Volume (LKR)', 'Status']
    const rows = filteredItems.map(item => [
      '"' + item.name.replace(/"/g, '""') + '" ',
      '"' + item.category + '" ',
      '"' + item.associated.replace(/"/g, '""') + '" ',
      item.tier.toUpperCase(),
      item.classesCount,
      item.maxClasses > 9999 ? 'Unlimited' : item.maxClasses,
      item.studentsCount,
      item.maxStudents > 9999 ? 'Unlimited' : item.maxStudents,
      item.tier === 'unlimited' ? 'Uncapped' : item.utilizationRate + '%',
      item.feeVolume,
      item.status.toUpperCase()
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'nexa_edu_usage_report_' + new Date().toISOString().split('T')[0] + '.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Master Analytics
            </Badge>
            <span className="text-xs text-slate-400">Platform Usage & Capacity Audit</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform Usage & Activity Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live audit of how each tuition institute and teacher utilizes classes, student rosters, and subscription quotas.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="h-10 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs self-start md:self-auto"
        >
          <Download className="h-4 w-4 mr-1.5 text-blue-600" />
          Export Report (CSV)
        </Button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
              Live
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{totalClassesAcross}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Platform Classes Created</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active tuition schedules</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[11px] font-bold">
              Enrolled
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{totalStudentsAcross}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Total Student Seats</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all tuition batches</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
              Monthly
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            LKR {totalFeeVolume.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Class Fee Volume</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Monthly turnover managed</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px] font-bold">
              Capacity
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{exceededCount + warningCount}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Capacity Warnings</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{exceededCount} exceeded, {warningCount} near limit</p>
        </Card>
      </div>

      {/* View Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Entity Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all ' + (
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            All Entities ({combinedLedger.length})
          </button>
          <button
            onClick={() => setActiveTab('institutions')}
            className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all ' + (
              activeTab === 'institutions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Institutes ({instList.length})
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all ' + (
              activeTab === 'teachers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Teachers ({teacherList.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>

          <Select value={tierFilter} onValueChange={val => setTierFilter(val as any)}>
            <SelectTrigger className="h-9 text-xs w-[120px] bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="unlimited">Unlimited</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={val => setStatusFilter(val as any)}>
            <SelectTrigger className="h-9 text-xs w-[140px] bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="healthy">Optimal</SelectItem>
              <SelectItem value="warning">Near Capacity</SelectItem>
              <SelectItem value="exceeded">Quota Exceeded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ledger Table */}
      <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Entity / User</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Tier</th>
                <th className="p-4">Classes Load</th>
                <th className="p-4">Students Capacity</th>
                <th className="p-4">Monthly Volume</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => {
                  const isExceeded = item.status === 'exceeded'
                  const isNearLimit = item.status === 'warning'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Association */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className={'h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ' + (
                            item.rawType === 'institution'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-violet-50 text-violet-600'
                          )}>
                            {item.rawType === 'institution' ? (
                              <Building2 className="h-4 w-4" />
                            ) : (
                              <GraduationCap className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{item.associated}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px] font-semibold text-slate-600">
                          {item.category}
                        </Badge>
                      </td>

                      {/* Tier Badge */}
                      <td className="p-4">
                        {item.tier === 'unlimited' && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-[10px] px-2 py-0.5 border-0">
                            <Crown className="h-2.5 w-2.5 mr-1" />
                            UNLIMITED
                          </Badge>
                        )}
                        {item.tier === 'pro' && (
                          <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 border-0">
                            <Zap className="h-2.5 w-2.5 mr-1" />
                            PRO
                          </Badge>
                        )}
                        {item.tier === 'free' && (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[10px] font-semibold">
                            FREE
                          </Badge>
                        )}
                      </td>

                      {/* Classes Load */}
                      <td className="p-4 font-mono font-medium text-slate-700">
                        <span className={item.classesCount > item.maxClasses ? 'text-red-600 font-bold' : 'text-slate-800'}>
                          {item.classesCount}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          /{item.maxClasses > 9999 ? '∞' : item.maxClasses}
                        </span>
                      </td>

                      {/* Students Capacity */}
                      <td className="p-4 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={isExceeded ? 'text-red-600 font-bold' : 'text-slate-700 font-medium'}>
                              {item.studentsCount} / {item.maxStudents > 9999 ? '∞' : item.maxStudents}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {item.tier === 'unlimited' ? 'Uncapped' : item.utilizationRate + '%'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={'h-1.5 rounded-full ' + (
                                isExceeded
                                  ? 'bg-red-500'
                                  : isNearLimit
                                  ? 'bg-amber-500'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                              )}
                              style={{
                                width: (item.tier === 'unlimited' ? Math.min(100, Math.max(10, item.studentsCount * 5)) : Math.min(100, item.utilizationRate)) + '%'
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Fee Volume */}
                      <td className="p-4 font-semibold text-slate-800">
                        LKR {item.feeVolume.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isExceeded && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            Over Quota
                          </Badge>
                        )}
                        {isNearLimit && !isExceeded && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            At Risk
                          </Badge>
                        )}
                        {!isExceeded && !isNearLimit && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Optimal
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => handleOpenUpgrade(item)}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg"
                        >
                          <Crown className="h-3 w-3 mr-1 text-indigo-600" />
                          Change Tier
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No records found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upgrade Modal */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Crown className="h-5 w-5 text-indigo-600" />
              Quick Plan Adjustment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Instantly resolve quota limits for <strong className="text-slate-800">{upgradeTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {actionError}
            </div>
          )}

          <div className="space-y-4 py-2">
            <Label className="text-xs font-semibold text-slate-700">Select Plan Tier</Label>
            <div className="grid grid-cols-1 gap-2.5">
              <div
                onClick={() => setSelectedTier('free')}
                className={'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ' + (
                  selectedTier === 'free' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-slate-200 bg-white'
                )}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">Free Plan</p>
                  <p className="text-xs text-slate-500">1 Class • Max 5 Students</p>
                </div>
                {selectedTier === 'free' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
              </div>

              <div
                onClick={() => setSelectedTier('pro')}
                className={'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ' + (
                  selectedTier === 'pro' ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/20' : 'border-slate-200 bg-white'
                )}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900">Pro Plan</p>
                    <Badge className="bg-violet-600 text-white text-[10px]">Recommended</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Unlimited Classes • Max 100 Students</p>
                </div>
                {selectedTier === 'pro' && <CheckCircle2 className="h-5 w-5 text-violet-600" />}
              </div>

              <div
                onClick={() => setSelectedTier('unlimited')}
                className={'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ' + (
                  selectedTier === 'unlimited' ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20' : 'border-slate-200 bg-white'
                )}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900">Unlimited Enterprise</p>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px]">Enterprise</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Unlimited Classes • Unlimited Students</p>
                </div>
                {selectedTier === 'unlimited' && <CheckCircle2 className="h-5 w-5 text-amber-600" />}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUpgradeModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveUpgrade}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Apply Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
