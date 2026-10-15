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
import StudentDialog, { StudentItem, ClassOption } from './student-dialog'
import { deleteStudent } from './actions'
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Phone,
  School,
  BookOpen,
  Calendar,
  Loader2,
  GraduationCap,
  Sparkles,
} from 'lucide-react'

type StudentsClientProps = {
  initialStudents: StudentItem[]
  classes: ClassOption[]
}

export default function StudentsClient({
  initialStudents,
  classes,
}: StudentsClientProps) {
  const [students, setStudents] = useState<StudentItem[]>(initialStudents)
  const [search, setSearch] = useState('')

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<StudentItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase()
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase()
    const serial = (s.serial_no || '').toLowerCase()
    const phone = s.phone_number || ''
    const school = (s.school || '').toLowerCase()
    const parent = (s.parent_name || '').toLowerCase()

    return (
      fullName.includes(q) ||
      serial.includes(q) ||
      phone.includes(q) ||
      school.includes(q) ||
      parent.includes(q)
    )
  })

  function handleCreateClick() {
    setEditingStudent(null)
    setDialogOpen(true)
  }

  function handleEditClick(student: StudentItem) {
    setEditingStudent(student)
    setDialogOpen(true)
  }

  function handleDeleteClick(student: StudentItem) {
    setStudentToDelete(student)
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!studentToDelete) return
    setDeleting(true)
    const res = await deleteStudent(studentToDelete.id)
    setDeleting(false)
    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id))
      setDeleteOpen(false)
      setStudentToDelete(null)
    } else {
      alert(res.error || 'Failed to delete student')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Directory</h1>
            <Badge className="bg-blue-100 text-blue-800 border-0 text-xs px-2.5 py-0.5 font-semibold">
              {students.length} Total
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Manage your registered student roster, serial numbers, and emergency contacts.
          </p>
        </div>

        <Button
          onClick={handleCreateClick}
          className="h-10 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-200 transition-all hover:shadow-lg"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Register Student
        </Button>
      </div>

      {/* Search and Action Filter */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, serial no, phone, school, parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-0 focus-visible:bg-white text-xs"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          Showing {filteredStudents.length} of {students.length} students
        </span>
      </div>

      {/* Students Table */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">
            All Registered Students
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600 text-xs pl-6">Student & School</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Serial No</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Contact</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Parent / Guardian</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Enrolled Classes</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student'
                  const initials = fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                  const enrolledClasses = student.class_students || []

                  return (
                    <TableRow key={student.id} className="hover:bg-blue-50/20 transition-colors">
                      {/* Name & School */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{fullName}</p>
                            {student.school ? (
                              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <School className="h-3 w-3" />
                                {student.school}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No school specified</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Serial No */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs font-mono font-semibold bg-slate-50 text-slate-700 border-slate-200"
                        >
                          {student.serial_no || '—'}
                        </Badge>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        {student.phone_number ? (
                          <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {student.phone_number}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Parent info */}
                      <TableCell>
                        {student.parent_name ? (
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{student.parent_name}</p>
                            {student.parent_phone && (
                              <p className="text-[11px] text-slate-400">{student.parent_phone}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Enrolled Classes */}
                      <TableCell>
                        {enrolledClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {enrolledClasses.slice(0, 2).map((ec, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100"
                              >
                                {ec.classes?.name || 'Class'}
                              </Badge>
                            ))}
                            {enrolledClasses.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-semibold self-center">
                                +{enrolledClasses.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-400 bg-slate-50">
                            Not Enrolled
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => handleEditClick(student)}
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-600" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(student)}
                              className="text-xs cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-base font-semibold text-slate-700">No students found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Try clearing your search query' : 'Register your first student to get started.'}
                    </p>
                    {!search && (
                      <Button
                        onClick={handleCreateClick}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Register Student
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Dialog */}
      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingStudent}
        classes={classes}
        onSuccess={() => {
          window.location.reload()
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Remove Student?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-slate-700">
                {studentToDelete?.first_name} {studentToDelete?.last_name}
              </span>
              ? This will unenroll them from all active classes and remove their tuition records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
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
                  Removing...
                </>
              ) : (
                'Remove Student'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
