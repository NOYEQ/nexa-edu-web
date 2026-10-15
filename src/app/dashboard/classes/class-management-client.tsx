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
} from 'lucide-react'

type ClassManagementClientProps = {
  initialClasses: ClassItem[]
  teachers: TeacherItem[]
  allStudents: StudentOption[]
  isInstitution: boolean
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
}: ClassManagementClientProps) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses)
  const [search, setSearch] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')

  // Modals state
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)

  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false)
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<ClassItem | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Calculations
  const totalClasses = classes.length
  const totalEnrollments = classes.reduce((sum, c) => sum + (c.class_students?.length ?? 0), 0)
  const estimatedRevenue = classes.reduce((sum, c) => {
    const students = c.class_students?.length ?? 0
    return sum + (c.fee || 0) * students
  }, 0)

  // Filtering
  const filteredClasses = classes.filter((cls) => {
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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Classes & Batches</h1>
            <Badge className="bg-violet-100 text-violet-800 border-0 text-xs px-2.5 py-0.5 font-semibold">
              Live Sync
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Create, schedule, assign teachers, and manage student enrollments.
          </p>
        </div>

        <Button
          onClick={handleCreateClick}
          className="h-10 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-violet-200 transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Class
        </Button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Classes</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalClasses}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrollments</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalEnrollments}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Potential</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                LKR {estimatedRevenue.toLocaleString()}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search classes, subjects, grades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-0 focus-visible:bg-white text-xs"
          />
        </div>

        {/* Day Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
            (day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
                  selectedDay === day
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {day === 'all' ? 'All Days' : day.substring(0, 3)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Classes Table */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">
            All Classes ({filteredClasses.length})
          </CardTitle>
          <span className="text-xs text-slate-400">Click student count to manage roster</span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600 text-xs pl-6">Class & Subject</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Grade</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Schedule</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Enrolled</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Fee Structure</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Assigned Teacher</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => {
                  const studentCount = cls.class_students?.length ?? 0
                  const dayClass = dayColors[cls.schedule_day] || 'bg-slate-100 text-slate-700'
                  const teacherName = cls.assigned_teacher?.full_name || 'Solo Direct'

                  return (
                    <TableRow key={cls.id} className="hover:bg-violet-50/20 transition-colors">
                      {/* Name & Subject */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{cls.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{cls.subject}</p>
                          </div>
                        </div>
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
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border w-fit ${dayClass}`}
                          >
                            {cls.schedule_day}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {cls.schedule_time}
                          </span>
                        </div>
                      </TableCell>

                      {/* Students (Clickable to manage) */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleManageStudents(cls)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors group cursor-pointer text-xs font-semibold"
                          title="Click to view and enroll students"
                        >
                          <Users className="h-3.5 w-3.5 text-blue-600" />
                          <span>{studentCount} Students</span>
                          <span className="text-[10px] text-blue-500 group-hover:underline">Manage</span>
                        </button>
                      </TableCell>

                      {/* Fee */}
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800">
                          LKR {Number(cls.fee).toLocaleString()}
                          <span className="text-[11px] text-slate-400 font-normal ml-1">
                            / {cls.fee_type === 'per_session' ? 'session' : 'month'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Assigned Teacher */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-700 font-medium">{teacherName}</span>
                        </div>
                      </TableCell>

                      {/* Action dropdown */}
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => handleManageStudents(cls)}
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <Users className="h-3.5 w-3.5 text-blue-600" />
                              Manage Students
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditClick(cls)}
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-600" />
                              Edit Class Details
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
                      {search ? 'Try clearing your search or day filters' : 'Get started by creating your first tuition class.'}
                    </p>
                    {!search && (
                      <Button
                        onClick={handleCreateClick}
                        className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-xs"
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

      {/* Class Create / Edit Dialog */}
      <ClassDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        initialData={editingClass}
        teachers={teachers}
        isInstitution={isInstitution}
        onSuccess={() => {
          // Trigger a lightweight soft reload or state update
          window.location.reload()
        }}
      />

      {/* Class Students & Enrollment Dialog */}
      <ClassStudentsDialog
        open={studentsDialogOpen}
        onOpenChange={setStudentsDialogOpen}
        classItem={selectedClassForStudents}
        allStudents={allStudents}
        onEnrollmentChanged={() => {
          // Re-sync parent
          window.location.reload()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Delete Class?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-700">{classToDelete?.name}</span>? 
              This will remove all associated schedule records and student enrollments for this class. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="text-xs h-9"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
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
