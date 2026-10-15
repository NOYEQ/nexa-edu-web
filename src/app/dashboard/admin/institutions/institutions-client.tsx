'use client'

import React, { useState, useTransition } from 'react'
import {
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Crown,
  Zap,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  InstitutionUsage,
  TierType,
  updateInstitutionTier,
  updateInstitutionDetails,
  createInstitution
} from '../actions'
import Link from 'next/link'

interface InstitutionsClientProps {
  initialInstitutions: InstitutionUsage[]
}

export default function InstitutionsClient({ initialInstitutions }: InstitutionsClientProps) {
  const [institutions, setInstitutions] = useState<InstitutionUsage[]>(initialInstitutions)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | TierType>('all')
  const [isPending, startTransition] = useTransition()

  // Tier change modal state
  const [tierModalOpen, setTierModalOpen] = useState(false)
  const [selectedInst, setSelectedInst] = useState<InstitutionUsage | null>(null)
  const [targetTier, setTargetTier] = useState<TierType>('pro')
  const [actionError, setActionError] = useState<string | null>(null)

  // Edit details modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')

  // Create new institution modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newInstName, setNewInstName] = useState('')

  // Filtered institutions
  const filtered = institutions.filter(inst => {
    const matchesQuery =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTier = tierFilter === 'all' || inst.tier === tierFilter
    return matchesQuery && matchesTier
  })

  // Tier metrics
  const freeCount = institutions.filter(i => i.tier === 'free').length
  const proCount = institutions.filter(i => i.tier === 'pro').length
  const unlimitedCount = institutions.filter(i => i.tier === 'unlimited').length

  const handleOpenTierModal = (inst: InstitutionUsage) => {
    setSelectedInst(inst)
    setTargetTier(inst.tier)
    setActionError(null)
    setTierModalOpen(true)
  }

  const handleSaveTier = () => {
    if (!selectedInst) return
    setActionError(null)

    startTransition(async () => {
      const res = await updateInstitutionTier(selectedInst.id, targetTier)
      if (res.error) {
        setActionError(res.error)
      } else {
        setInstitutions(prev =>
          prev.map(item =>
            item.id === selectedInst.id
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

  const handleOpenEditModal = (inst: InstitutionUsage) => {
    setSelectedInst(inst)
    setEditName(inst.name)
    setActionError(null)
    setEditModalOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedInst || !editName.trim()) return
    setActionError(null)

    startTransition(async () => {
      const res = await updateInstitutionDetails(selectedInst.id, editName.trim())
      if (res.error) {
        setActionError(res.error)
      } else {
        setInstitutions(prev =>
          prev.map(item =>
            item.id === selectedInst.id ? { ...item, name: editName.trim() } : item
          )
        )
        setEditModalOpen(false)
      }
    })
  }

  const handleCreateInstitution = () => {
    if (!newInstName.trim()) return
    setActionError(null)

    startTransition(async () => {
      const res = await createInstitution(newInstName.trim())
      if (res.error) {
        setActionError(res.error)
      } else if (res.data) {
        const newInst: InstitutionUsage = {
          id: res.data.id,
          name: res.data.name,
          createdAt: res.data.created_at,
          ownerId: res.data.owner_id,
          ownerName: 'Platform Super Admin',
          ownerEmail: 'institute@noyeq.com',
          tier: 'free',
          teachersCount: 0,
          classesCount: 0,
          maxClasses: 1,
          studentsCount: 0,
          maxStudents: 5,
          feeVolume: 0,
          utilizationRate: 0,
          status: 'healthy'
        }
        setInstitutions(prev => [newInst, ...prev])
        setCreateModalOpen(false)
        setNewInstName('')
      }
    })
  }

  const getTierBadge = (tier: TierType) => {
    switch (tier) {
      case 'unlimited':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold border-0 shadow-xs flex items-center gap-1 px-2.5 py-0.5">
            <Crown className="h-3 w-3" />
            UNLIMITED
          </Badge>
        )
      case 'pro':
        return (
          <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold border-0 shadow-xs flex items-center gap-1 px-2.5 py-0.5">
            <Zap className="h-3 w-3" />
            PRO PLAN
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-semibold px-2.5 py-0.5">
            FREE TIER
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Master Admin Control
            </Badge>
            <span className="text-xs text-slate-400">Platform-wide access</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutions & Tiers Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure tuition centers, upgrade or downgrade subscription tiers, and monitor quota limits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-blue-200"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Register New Institution
          </Button>
        </div>
      </div>

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
              All Centers
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{institutions.length}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Total Institutions</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active tuition platforms</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Crown className="h-5 w-5" />
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px] font-bold">
              Top Tier
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{unlimitedCount}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Unlimited Tier</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Unlimited classes & students</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Zap className="h-5 w-5" />
            </div>
            <Badge className="bg-violet-100 text-violet-800 border-0 text-[11px] font-bold">
              Growth
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{proCount}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Pro Tier</p>
          <p className="text-[11px] text-slate-400 mt-0.5">100 students limit</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
              Starter
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{freeCount}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Free Tier</p>
          <p className="text-[11px] text-slate-400 mt-0.5">5 students / 1 class max</p>
        </Card>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search institutions by name or owner..."
            className="pl-10 h-10 bg-slate-50 border-slate-200 text-xs rounded-xl focus-visible:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <Select
            value={tierFilter}
            onValueChange={val => setTierFilter(val as any)}
          >
            <SelectTrigger className="h-10 text-xs w-[160px] bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="Filter by Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="unlimited">Unlimited Tier</SelectItem>
              <SelectItem value="pro">Pro Tier</SelectItem>
              <SelectItem value="free">Free Tier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Institutions Directory List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length > 0 ? (
          filtered.map(inst => {
            const isExceeded = inst.status === 'exceeded'
            const isNearLimit = inst.status === 'warning'

            return (
              <Card
                key={inst.id}
                className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all bg-white rounded-2xl overflow-hidden"
              >
                <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Info */}
                  <div className="flex items-start gap-4 min-w-0 max-w-lg">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-200 shrink-0">
                      <Building2 className="h-6 w-6" />
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {inst.name}
                        </h3>
                        {getTierBadge(inst.tier)}
                        {isExceeded && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold">
                            Quota Exceeded
                          </Badge>
                        )}
                        {isNearLimit && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                            Near Capacity
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        Owner: <strong className="text-slate-700 font-semibold">{inst.ownerName}</strong> ({inst.ownerEmail})
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        ID: {inst.id} • Registered {new Date(inst.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Usage Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teachers</p>
                      <p className="text-base font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                        <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                        {inst.teachersCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classes</p>
                      <p className="text-base font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                        <BookOpen className="h-3.5 w-3.5 text-violet-600" />
                        {inst.classesCount}
                        <span className="text-xs text-slate-400 font-normal">
                          /{inst.maxClasses > 9999 ? '∞' : inst.maxClasses}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</p>
                      <p className="text-base font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        {inst.studentsCount}
                        <span className="text-xs text-slate-400 font-normal">
                          /{inst.maxStudents > 9999 ? '∞' : inst.maxStudents}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Volume</p>
                      <p className="text-base font-extrabold text-indigo-700 flex items-center gap-1 mt-0.5">
                        LKR {inst.feeVolume.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      onClick={() => handleOpenTierModal(inst)}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs font-semibold border-slate-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl"
                    >
                      <Crown className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                      Change Tier
                    </Button>

                    <Button
                      onClick={() => handleOpenEditModal(inst)}
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>

                    <Link
                      href={'/dashboard/classes?institution=' + inst.id}
                      className="inline-flex items-center justify-center h-9 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Classes
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>

                {/* Bottom Capacity Usage Progress Bar */}
                <div className="px-6 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3 w-full max-w-md">
                    <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                      Student Capacity:
                    </span>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={'h-2 rounded-full transition-all ' + (
                          isExceeded
                            ? 'bg-red-500'
                            : isNearLimit
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        )}
                        style={{
                          width: (inst.tier === 'unlimited' ? Math.min(100, Math.max(8, inst.studentsCount * 5)) : Math.min(100, inst.utilizationRate)) + '%'
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 shrink-0">
                      {inst.tier === 'unlimited' ? 'Uncapped' : inst.utilizationRate + '%'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {inst.tier === 'free'
                      ? 'Free tier restricted to 1 class & 5 students'
                      : inst.tier === 'pro'
                      ? 'Pro tier accommodates up to 100 students'
                      : 'Enterprise Unlimited tier active'}
                  </span>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Building2 className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No institutions match your filters</p>
            <p className="text-xs mt-1">Try clearing your search query or tier filters.</p>
          </div>
        )}
      </div>

      {/* Change Tier Dialog Modal */}
      <Dialog open={tierModalOpen} onOpenChange={setTierModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Crown className="h-5 w-5 text-indigo-600" />
              Update Subscription Tier
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify platform capabilities and limits for <strong className="text-slate-800">{selectedInst?.name}</strong>.
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
                {/* Free Card */}
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
                      <Badge variant="outline" className="text-[10px] text-slate-600">Default</Badge>
                    </div>
                    <p className="text-xs text-slate-500">1 Class • Max 5 Students</p>
                  </div>
                  {targetTier === 'free' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                </div>

                {/* Pro Card */}
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

                {/* Unlimited Card */}
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

          <DialogFooter className="gap-2 sm:gap-0">
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

      {/* Edit Institution Name Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Institution</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update official name and details for this center.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {actionError}
            </div>
          )}

          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold text-slate-700">Institution Name</Label>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="e.g. Apex Higher Education Center"
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={isPending || !editName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register New Institution Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Register New Institution
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new tuition institute profile on Nexa-Edu platform.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {actionError}
            </div>
          )}

          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold text-slate-700">Institution Name</Label>
            <Input
              value={newInstName}
              onChange={e => setNewInstName(e.target.value)}
              placeholder="e.g. Royal Academy Tuition"
              className="h-10 text-xs rounded-xl"
            />
            <p className="text-[11px] text-slate-400">
              Will be initially created under the platform super admin account and can be reassigned later.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateInstitution}
              disabled={isPending || !newInstName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Create Institution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
