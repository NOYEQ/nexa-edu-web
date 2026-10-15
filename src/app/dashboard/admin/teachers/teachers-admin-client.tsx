'use client'

import React, { useState, useTransition } from 'react'
import {
  GraduationCap,
  Users,
  BookOpen,
  Search,
  Filter,
  ShieldCheck,
  Crown,
  Zap,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  UserCheck
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  TeacherUsage,
  TierType,
  updateTeacherTier
} from '../actions'
import Link from 'next/link'

interface TeachersAdminClientProps {
  initialTeachers: TeacherUsage[]
}

export default function TeachersAdminClient({ initialTeachers }: TeachersAdminClientProps) {
  const [teachers, setTeachers] = useState<TeacherUsage[]>(initialTeachers)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | TierType>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'solo' | 'institution'>('all')
  const [isPending, startTransition] = useTransition()

  // Tier change modal state
  const [tierModalOpen, setTierModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherUsage | null>(null)
  const [targetTier, setTargetTier] = useState<TierType>('pro')
  const [actionError, setActionError] = useState<string | null>(null)

  // Filtered list
  const filtered = teachers.filter(t => {
    const matchesQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.institutionName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTier = tierFilter === 'all' || t.tier === tierFilter
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'solo' && t.role === 'solo_teacher') ||
      (typeFilter === 'institution' && t.role === 'institution_teacher')
    return matchesQuery && matchesTier && matchesType
  })

  const soloCount = teachers.filter(t => t.role === 'solo_teacher').length
  const instTeacherCount = teachers.filter(t => t.role !== 'solo_teacher').length
  const proCount = teachers.filter(t => t.tier === 'pro').length
  const unlimitedCount = teachers.filter(t => t.tier === 'unlimited').length

  const handleOpenTierModal = (teacher: TeacherUsage) => {
    setSelectedTeacher(teacher)
    setTargetTier(teacher.tier)
    setActionError(null)
    setTierModalOpen(true)
  }

  const handleSaveTier = () => {
    if (!selectedTeacher) return
    setActionError(null)

    startTransition(async () => {
      const res = await updateTeacherTier(selectedTeacher.id, targetTier)
      if (res.error) {
        setActionError(res.error)
      } else {
        setTeachers(prev =>
          prev.map(item =>
            item.id === selectedTeacher.id
              ? {
                  ...item,
                  tier: targetTier,
                  maxClasses: targetTier === 'free' ? 1 : 999999,
                  maxStudents: targetTier === 'free' ? 5 : targetTier === 'pro' ? 100 : 999999,
                  status:
                    item.studentsCount > (targetTier === 'free' ? 5 : targetTier === 'pro' ? 100 : 999999)
                      ? 'exceeded'
                      : 'healthy'
                }
              : item
          )
        )
        setTierModalOpen(false)
      }
    })
  }

  const getTierBadge = (tier: TierType) => {
    switch (tier) {
      case 'unlimited':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold border-0 text-[10px] px-2 py-0.5">
            <Crown className="h-3 w-3 mr-1" />
            UNLIMITED
          </Badge>
        )
      case 'pro':
        return (
          <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold border-0 text-[10px] px-2 py-0.5">
            <Zap className="h-3 w-3 mr-1" />
            PRO
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-semibold text-[10px] px-2 py-0.5">
            FREE
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Master Admin Control
            </Badge>
            <span className="text-xs text-slate-400">Platform Instructors</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Teachers Directory & Tier Allocation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review teacher roles across all centers, modify individual subscription tiers, and inspect teaching load.
          </p>
        </div>

        <Link
          href="/dashboard/teachers"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
        >
          <GraduationCap className="h-4 w-4 text-blue-600" />
          Standard Staff View
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500">Total Instructors</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{teachers.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all institutions & solo</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500">Institution Staff</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{instTeacherCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Employed by registered centers</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500">Solo / Independent</p>
          <p className="text-2xl font-black text-violet-600 mt-1">{soloCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Managing independent classes</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500">Paid Tiers (Pro/Unlimited)</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{proCount + unlimitedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Elevated subscription capacity</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search teacher by name, email, institute..."
            className="pl-10 h-10 bg-slate-50 border-slate-200 text-xs rounded-xl focus-visible:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={val => setTypeFilter(val as any)}>
            <SelectTrigger className="h-10 text-xs w-[140px] bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="institution">Institution Staff</SelectItem>
              <SelectItem value="solo">Solo Teacher</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={val => setTierFilter(val as any)}>
            <SelectTrigger className="h-10 text-xs w-[140px] bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="unlimited">Unlimited</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Teacher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? (
          filtered.map(teacher => {
            const isExceeded = teacher.status === 'exceeded'
            const isNearLimit = teacher.status === 'warning'

            return (
              <Card
                key={teacher.id}
                className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all bg-white rounded-2xl p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{teacher.name}</h4>
                        <p className="text-xs text-slate-400 truncate">{teacher.email}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {getTierBadge(teacher.tier)}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Affiliation:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[170px]">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {teacher.institutionName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Classes Assigned:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-violet-600" />
                        {teacher.classesCount}
                        <span className="text-slate-400 font-normal">
                          /{teacher.maxClasses > 9999 ? '∞' : teacher.maxClasses}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Active Students:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Users className="h-3 w-3 text-emerald-600" />
                        {teacher.studentsCount}
                        <span className="text-slate-400 font-normal">
                          /{teacher.maxStudents > 9999 ? '∞' : teacher.maxStudents}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Class Revenue:</span>
                      <span className="font-bold text-indigo-700">
                        LKR {teacher.feeVolume.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Quota warnings */}
                  {isExceeded && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Student/class quota exceeded
                    </div>
                  )}
                  {isNearLimit && !isExceeded && (
                    <div className="mt-2 p-2 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Near plan maximum limit
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    onClick={() => handleOpenTierModal(teacher)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs font-semibold rounded-xl text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Crown className="h-3 w-3 mr-1 text-indigo-600" />
                    Change Tier
                  </Button>

                  <Link
                    href={'/dashboard/classes?teacher=' + teacher.id}
                    className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors"
                  >
                    Classes
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <GraduationCap className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No teachers match your filters</p>
          </div>
        )}
      </div>

      {/* Change Tier Modal */}
      <Dialog open={tierModalOpen} onOpenChange={setTierModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Crown className="h-5 w-5 text-indigo-600" />
              Update Teacher Tier
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify plan tier for instructor <strong className="text-slate-800">{selectedTeacher?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {actionError}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Select Plan Tier</Label>
              <div className="grid grid-cols-1 gap-2.5">
                <div
                  onClick={() => setTargetTier('free')}
                  className={'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ' + (
                    targetTier === 'free'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Free Plan</span>
                    </div>
                    <p className="text-xs text-slate-500">1 Class • Max 5 Students</p>
                  </div>
                  {targetTier === 'free' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                </div>

                <div
                  onClick={() => setTargetTier('pro')}
                  className={'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ' + (
                    targetTier === 'pro'
                      ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Pro Plan</span>
                      <Badge className="bg-violet-600 text-white text-[10px] font-bold">Popular</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Unlimited Classes • Max 100 Students</p>
                  </div>
                  {targetTier === 'pro' && <CheckCircle2 className="h-5 w-5 text-violet-600" />}
                </div>

                <div
                  onClick={() => setTargetTier('unlimited')}
                  className={'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ' + (
                    targetTier === 'unlimited'
                      ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Unlimited Plan</span>
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold">Enterprise</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Unlimited Classes • Unlimited Students</p>
                  </div>
                  {targetTier === 'unlimited' && <CheckCircle2 className="h-5 w-5 text-amber-600" />}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTierModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveTier}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Confirm Plan Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
