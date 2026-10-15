'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import ClassDialog, { ClassItem, TeacherItem } from './class-dialog'
import ClassStudentsDialog, { StudentOption } from './class-students-dialog'
import { deleteClass } from './actions'
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  Clock,
  DollarSign,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Loader2,
  Calendar,
  Building2,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

type ClassManagementClientProps = {
  initialClasses: ClassItem[]
  teachers: TeacherItem[]
  allStudents: StudentOption[]
  isInstitution: boolean
  userRole?: string
  registeredInstitutes?: Array<{ id: string; name: string }>
}

const dayColors: Record<string, string> = {
  Monday: 'bg-blue-50 text-blue-700 border-blue-200',
  Tuesday: 'bg-violet-50 text-violet-700 border-violet-200',
  Wednesday: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Thursday: 'bg-amber-50 text-amber-700 border-amber-200',
  Friday: 'bg-orange-50 text-orange-700 border-orange-200',
  Saturday: 'bg-rose-50 text-rose-700 border-rose-200',
  Sunday: 'bg-pink-50 text-pink-700 border-pink-200',
}

export default function ClassManagementClient({
  initialClasses,
  teachers,
  allStudents,
  isInstitution,
  userRole = 'solo_teacher',
  registeredInstitutes = [],
}: ClassManagementClientProps) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses)
  const [search, setSearch] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'solo' | 'institutes'>('all')

  // Modals state
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)

  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false)
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<ClassItem | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Segregate solo vs institute classes
  const soloClasses = classes.filter((c) => !c.institution_id || !c.institutions?.name)
  const instituteClasses = classes.filter((c) => c.institution_id && c.institutions?.name)

  const isTeacherUser = userRole === 'solo_teacher' || userRole === 'teacher' || userRole === 'institution_teacher'
  const isHybridTeacher = isTeacherUser && soloClasses.length > 0 && instituteClasses.length > 0
  const isSoloOnly = isTeacherUser && soloClasses.length > 0 && instituteClasses.length === 0

  // Calculations
  const totalClasses = classes.length
  const totalEnrollments = classes.reduce((sum, c) => sum + (c.class_students?.length ?? 0), 0)
  const estimatedRevenue = classes.reduce((sum, c) => {
    const students = c.class_students?.length ?? 0
    return sum + (c.fee || 0) * students
  }, 0)

  // Filter classes based on active tab
  let displayedPool = classes
  if (activeTab === 'solo') {
    displayedPool = soloClasses
  } else if (activeTab === 'institutes') {
    displayedPool = instituteClasses
  }

  // Filtering by search and day
  const filteredClasses = displayedPool.filter((cls) => {
    const q = search.toLowerCase()
    const matchesQuery =
      cls.name.toLowerCase().includes(q) ||
      cls.subject.toLowerCase().includes(q) ||
      cls.grade.toLowerCase().includes(q) ||
      (cls.institutions?.name && cls.institutions.name.toLowerCase().includes(q)) ||
      (cls.assigned_teacher?.full_name && cls.assigned_teacher.full_name.toLowerCase().includes(q))

    const matchesDay = selectedDay === 'all' || cls.schedule_day === selectedDay
    return matchesQuery && matchesDay
  })

  // Group institute classes by institute for the institute view
  const instituteGroups = registeredInstitutes.map((inst) => {
    const instClasses = instituteClasses.filter(
      (c) => c.institution_id === inst.id || (c.institutions as any)?.id === inst.id
    )
    return {
      institute: inst,
      classes: instClasses,
      totalStudents: instClasses.reduce((acc, c) => acc + (c.class_students?.length ?? 0), 0),
    }
  })

  function handleCreateClick() {
    setEditingClass(null)
    setClassDialogOpen(true)
  }

  function handleEditClick(cls: ClassItem) {
    setEditingClass(cls)
    setClassDialogOpen(true)
  }

  function handleManageStudents(cls: ClassItem) {
    setSelectedClassForStudents(cls)
    setStudentsDialogOpen(true)
  }

  function handleDeleteClick(cls: ClassItem) {
    setClassToDelete(cls)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!classToDelete) return
    setDeleting(true)
    const res = await deleteClass(classToDelete.id)
    setDeleting(false)
    if (res.success) {
      setClasses((prev) => prev.filter((c) => c.id !== classToDelete.id))
      setDeleteDialogOpen(false)
      setClassToDelete(null)
    } else {
      alert(res.error || 'Failed to delete class')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Classes & Batches</h1>
            {isTeacherUser && (
              <Badge className="bg-purple-100 text-purple-800 border-0 text-xs px-2.5 py-0.5 font-semibold">
                {isHybridTeacher
                  ? 'Hybrid Teacher (Solo & Institutes)'
                  : isSoloOnly
                  ? 'Solo Class Management'
                  : 'Institution Teacher'}
              </Badge>
            )}
            {!isTeacherUser && (
              <Badge className="bg-violet-100 text-violet-800 border-0 text-xs px-2.5 py-0.5 font-semibold">
                Live Cloud Sync
              </Badge>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {isTeacherUser
              ? 'Manage your solo classes, view registered institutes, inspect student rosters, and track class days attendance.'
              : 'Create, schedule, assign teachers, and manage student enrollments across all batches.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreateClick}
            className="h-10 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-violet-200 transition-all hover:shadow-lg rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSoloOnly ? 'Create Solo Class' : 'Create New Class'}
          </Button>
        </div>
      </div>

      {/* Role / Context Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Classes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {classes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('solo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'solo'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
          <span>My Solo Classes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-700 text-purple-200">
            {soloClasses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('institutes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'institutes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-blue-500" />
          <span>Affiliated Institutes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-700 text-blue-200">
            {registeredInstitutes.length > 0 ? registeredInstitutes.length : instituteClasses.length}
          </span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {activeTab === 'solo' ? 'Solo Classes' : activeTab === 'institutes' ? 'Institute Batches' : 'Total Classes'}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{displayedPool.length}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrollments</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {displayedPool.reduce((acc, c) => acc + (c.class_students?.length ?? 0), 0)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Revenue</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                LKR {displayedPool.reduce((sum, c) => sum + (c.fee || 0) * (c.class_students?.length ?? 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AFFILIATED INSTITUTES GROUPED VIEW (When activeTab === 'institutes') */}
      {activeTab === 'institutes' && instituteGroups.length > 0 && (
        <div className="space-y-6">
          {instituteGroups.map((group) => (
            <Card key={group.institute.id} className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 px-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      {group.institute.name}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Registered Institute • {group.classes.length} Classes Assigned • {group.totalStudents} Enrolled Students
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                  Registered Instructor
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/40">
                      <TableHead className="text-xs font-semibold text-slate-600 pl-6">Class Name & Subject</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Grade</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Schedule</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Enrolled Students</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 text-right pr-6">Class Hub</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.classes.length > 0 ? (
                      group.classes.map((cls) => {
                        const studentCount = cls.class_students?.length ?? 0
                        const dayClass = dayColors[cls.schedule_day] || 'bg-slate-100 text-slate-700'
                        return (
                          <TableRow key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <p className="font-bold text-slate-900 text-xs">{cls.name}</p>
                              <p className="text-[11px] text-slate-500">{cls.subject}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-semibold bg-slate-50">
                                {cls.grade}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${dayClass}`}>
                                {cls.schedule_day} at {cls.schedule_time}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-bold text-slate-800">
                                {studentCount} Enrolled
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button
                                size="sm"
                                onClick={() => handleManageStudents(cls)}
                                className="h-8 px-3 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl"
                              >
                                <Users className="h-3.5 w-3.5 mr-1 text-blue-600" />
                                Roster & Attendance
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-400">
                          No classes assigned in this institution yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search classes, subjects, grades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-0 focus-visible:bg-white text-xs rounded-xl"
          />
        </div>

        {/* Day Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
            (day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedDay === day
                    ? 'bg-violet-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {day === 'all' ? 'All Days' : day.substring(0, 3)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Classes Table (Displays for 'all', 'solo', or 'institutes' if no grouping) */}
      <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              {activeTab === 'solo'
                ? `Solo Classes (${filteredClasses.length})`
                : activeTab === 'institutes'
                ? `Institute Batches (${filteredClasses.length})`
                : `All Classes (${filteredClasses.length})`}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Click "Class Hub" to inspect enrolled students, add by phone, and view class days attendance summary
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
                <TableHead className="font-semibold text-slate-600 text-xs pl-6">Class & Subject</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Affiliation</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Grade</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Schedule</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Enrolled</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Fee</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right pr-6">Class Hub & Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => {
                  const studentCount = cls.class_students?.length ?? 0
                  const dayClass = dayColors[cls.schedule_day] || 'bg-slate-100 text-slate-700'
                  const isSolo = !cls.institution_id || !cls.institutions?.name
                  const instName = cls.institutions?.name || 'Solo Direct'

                  return (
                    <TableRow key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Subject */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 ${
                            isSolo
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-600'
                              : 'bg-gradient-to-br from-blue-600 to-teal-600'
                          }`}>
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{cls.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{cls.subject}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Affiliation Badge */}
                      <TableCell>
                        {isSolo ? (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Solo Class
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                            <Building2 className="h-3 w-3 mr-1" />
                            {instName}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Grade */}
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-semibold bg-slate-50">
                          {cls.grade}
                        </Badge>
                      </TableCell>

                      {/* Schedule */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border w-fit ${dayClass}`}>
                            {cls.schedule_day}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {cls.schedule_time}
                          </span>
                        </div>
                      </TableCell>

                      {/* Students */}
                      <TableCell>
                        <span className="text-xs font-bold text-slate-800">
                          {studentCount} Students
                        </span>
                      </TableCell>

                      {/* Fee */}
                      <TableCell>
                        <div className="text-xs font-bold text-slate-900">
                          LKR {Number(cls.fee).toLocaleString()}
                          <span className="text-[11px] text-slate-400 font-normal ml-1">
                            / {cls.fee_type === 'per_session' ? 'session' : 'mo'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Action buttons & dropdown */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleManageStudents(cls)}
                            className="h-8 px-3 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl"
                            title="Open Class Hub: Enrolled students, phone enrollment, and class days attendance"
                          >
                            <Users className="h-3.5 w-3.5 mr-1 text-blue-600" />
                            Class Hub
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500 cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                              <DropdownMenuItem
                                onClick={() => handleManageStudents(cls)}
                                className="text-xs cursor-pointer flex items-center gap-2"
                              >
                                <Users className="h-3.5 w-3.5 text-blue-600" />
                                Student Roster & Add
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClick(cls)}
                                className="text-xs cursor-pointer flex items-center gap-2"
                              >
                                <Pencil className="h-3.5 w-3.5 text-slate-600" />
                                Edit Class Schedule
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(cls)}
                                className="text-xs cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Class
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center text-slate-400">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-base font-semibold text-slate-700">No classes found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search
                        ? 'Try clearing your search or day filters'
                        : activeTab === 'solo'
                        ? 'You have not created any solo classes yet. Click below to add one.'
                        : 'Get started by creating your first tuition class.'}
                    </p>
                    {!search && (
                      <Button
                        onClick={handleCreateClick}
                        className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-xl"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Create Class
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Class Dialog */}
      <ClassDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        initialData={editingClass}
        teachers={teachers}
        isInstitution={isInstitution}
        onSuccess={() => {
          window.location.reload()
        }}
      />

      {/* Class Students & Enrollment Dialog (Class Hub) */}
      <ClassStudentsDialog
        open={studentsDialogOpen}
        onOpenChange={setStudentsDialogOpen}
        classItem={selectedClassForStudents}
        allStudents={allStudents}
        onEnrollmentChanged={() => {
          window.location.reload()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Delete Class Confirmation
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete{' '}
              <strong className="text-slate-800">{classToDelete?.name}</strong>? All associated schedules and enrollments will be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="h-10 rounded-xl bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Class'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
