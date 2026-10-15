'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { enrollStudentInClass, unenrollStudentFromClass, getClassStudents } from './actions'
import { Users, UserPlus, Trash2, Search, Loader2, Phone, School, Check, UserMinus } from 'lucide-react'

export type StudentOption = {
  id: string
  first_name: string
  last_name: string
  phone_number?: string
  school?: string
  serial_no?: string
  email?: string
}

type ClassStudentsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  classItem: {
    id: string
    name: string
    subject: string
    grade: string
  } | null
  allStudents?: StudentOption[]
  onEnrollmentChanged?: () => void
}

export default function ClassStudentsDialog({
  open,
  onOpenChange,
  classItem,
  allStudents = [],
  onEnrollmentChanged,
}: ClassStudentsDialogProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (open && classItem) {
      loadStudents()
      setSelectedStudentId('')
      setSearch('')
      setError(null)
      setSuccessMsg(null)
    }
  }, [open, classItem])

  async function loadStudents() {
    if (!classItem) return
    setLoading(true)
    const res = await getClassStudents(classItem.id)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setEnrolledStudents(res.students || [])
    }
  }

  async function handleEnroll() {
    if (!classItem || !selectedStudentId) return
    setEnrolling(true)
    setError(null)
    setSuccessMsg(null)

    const res = await enrollStudentInClass(classItem.id, selectedStudentId)
    setEnrolling(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSelectedStudentId('')
      setSuccessMsg('Student successfully enrolled in this class!')
      await loadStudents()
      if (onEnrollmentChanged) onEnrollmentChanged()
    }
  }

  async function handleUnenroll(studentId: string, studentName: string) {
    if (!classItem) return
    if (!confirm(`Are you sure you want to remove ${studentName} from this class?`)) return

    setUnenrollingId(studentId)
    setError(null)
    setSuccessMsg(null)

    const res = await unenrollStudentFromClass(classItem.id, studentId)
    setUnenrollingId(null)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccessMsg(`Removed ${studentName} from class.`)
      await loadStudents()
      if (onEnrollmentChanged) onEnrollmentChanged()
    }
  }

  // Filter out students who are already enrolled
  const enrolledIdSet = new Set(enrolledStudents.map((s) => s.id))
  const availableStudentsToEnroll = allStudents.filter((s) => !enrolledIdSet.has(s.id))

  // Filter enrolled students by search query
  const filteredEnrolled = enrolledStudents.filter((s) => {
    const q = search.toLowerCase()
    return (
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.serial_no && s.serial_no.toLowerCase().includes(q)) ||
      (s.phone_number && s.phone_number.includes(q)) ||
      (s.school && s.school.toLowerCase().includes(q))
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden p-6">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-800">
                  {classItem?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  {classItem?.subject} • {classItem?.grade} • {enrolledStudents.length} Students Enrolled
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
              {enrolledStudents.length} Active
            </Badge>
          </div>
        </DialogHeader>

        {/* Feedback banners */}
        {error && (
          <div className="p-3 my-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 my-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <Check className="h-3.5 w-3.5" />
            {successMsg}
          </div>
        )}

        {/* Quick Enroll Section */}
        <div className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-100 mt-2 space-y-2">
          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5 text-blue-600" />
            Enroll Student into this Class
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Select value={selectedStudentId} onValueChange={(val) => setSelectedStudentId(val || "")}>
                <SelectTrigger className="h-9 bg-white text-xs">
                  <SelectValue placeholder="Select student to enroll..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableStudentsToEnroll.length > 0 ? (
                    availableStudentsToEnroll.map((student) => {
                      const name = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student'
                      const serial = student.serial_no ? `(${student.serial_no})` : ''
                      return (
                        <SelectItem key={student.id} value={student.id} className="text-xs">
                          {name} {serial} {student.school ? `— ${student.school}` : ''}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No additional students available to enroll
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={handleEnroll}
              disabled={!selectedStudentId || enrolling}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shrink-0 px-4"
            >
              {enrolling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Enroll Now
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search bar inside dialog */}
        <div className="relative mt-3 mb-2">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search enrolled students by name, serial no, phone, school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>

        {/* Table of Enrolled Students */}
        <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl mt-1">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50/90 backdrop-blur z-10">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-600">Student</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Serial No</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Contact</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Enrolled On</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading enrolled students...
                  </TableCell>
                </TableRow>
              ) : filteredEnrolled.length > 0 ? (
                filteredEnrolled.map((student) => {
                  const initials = (student.fullName || 'ST')
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                  const joinDate = student.enrolledDate
                    ? new Date(student.enrolledDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'

                  return (
                    <TableRow key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{student.fullName}</p>
                            {student.school && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <School className="h-3 w-3" />
                                {student.school}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-mono font-medium">
                          {student.serial_no || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.phone_number ? (
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {student.phone_number}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{joinDate}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnenroll(student.id, student.fullName)}
                          disabled={unenrollingId === student.id}
                          className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                        >
                          {unenrollingId === student.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <UserMinus className="h-3.5 w-3.5 mr-1" />
                              Remove
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p>{search ? 'No students match your search.' : 'No students enrolled in this class yet.'}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
