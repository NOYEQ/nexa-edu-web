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
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  unenrollStudentFromClass,
  getClassStudents,
  lookupStudentByPhone,
  enrollOrRegisterStudentInClass,
  getClassDaysAndAttendance,
  ClassSessionSummary,
} from './actions'
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Loader2,
  Phone,
  School,
  Check,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'

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
    fee?: number
    schedule_day?: string
    schedule_time?: string
    institutions?: { name: string } | null
  } | null
  allStudents?: StudentOption[]
  onEnrollmentChanged?: () => void
}

export default function ClassStudentsDialog({
  open,
  onOpenChange,
  classItem,
  onEnrollmentChanged,
}: ClassStudentsDialogProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'add_by_phone' | 'class_days'>('roster')

  // Enrolled students state
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Add student by phone state
  const [inputPhone, setInputPhone] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupResult, setLookupResult] = useState<{
    found: boolean
    student?: any
  } | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [school, setSchool] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false)

  // Class days & attendance summary state
  const [classSessions, setClassSessions] = useState<ClassSessionSummary[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  useEffect(() => {
    if (open && classItem) {
      loadStudents()
      loadSessions()
      setActiveTab('roster')
      resetAddForm()
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

  async function loadSessions() {
    if (!classItem) return
    setLoadingSessions(true)
    const res = await getClassDaysAndAttendance(classItem.id)
    setLoadingSessions(false)
    if (res.sessions) {
      setClassSessions(res.sessions)
    }
  }

  function resetAddForm() {
    setInputPhone('')
    setLookupResult(null)
    setFirstName('')
    setLastName('')
    setSchool('')
    setParentName('')
    setParentPhone('')
  }

  // Handle phone lookup on enter or blur
  async function handlePhoneLookup() {
    const clean = inputPhone.trim().replace(/[\s-]/g, '')
    if (clean.length < 7) return

    setIsLookingUp(true)
    setError(null)
    setSuccessMsg(null)

    const res = await lookupStudentByPhone(clean)
    setIsLookingUp(false)

    if (res.found && res.student) {
      setLookupResult({ found: true, student: res.student })
      setFirstName(res.student.first_name || '')
      setLastName(res.student.last_name || '')
      setSchool(res.student.school || '')
      setParentName(res.student.parent_name || '')
      setParentPhone(res.student.parent_phone || '')
    } else {
      setLookupResult({ found: false })
      setFirstName('')
      setLastName('')
      setSchool('')
      setParentName('')
      setParentPhone('')
    }
  }

  // Enroll existing or register new student
  async function handleEnrollOrRegister() {
    if (!classItem) return
    const clean = inputPhone.trim().replace(/[\s-]/g, '')
    if (!clean) {
      setError('Please enter a phone number.')
      return
    }

    if (!lookupResult?.found && !firstName.trim()) {
      setError('First name is required for new student registration.')
      return
    }

    setIsSubmittingEnrollment(true)
    setError(null)
    setSuccessMsg(null)

    const res = await enrollOrRegisterStudentInClass({
      classId: classItem.id,
      phoneNumber: clean,
      existingStudentId: lookupResult?.found ? lookupResult.student?.id : null,
      firstName,
      lastName,
      school,
      parentName,
      parentPhone,
    })

    setIsSubmittingEnrollment(false)

    if (res.error) {
      setError(res.error)
    } else {
      const name = res.student ? `${res.student.first_name} ${res.student.last_name || ''}`.trim() : 'Student'
      const serial = res.student?.serial_no || ''
      setSuccessMsg(
        res.isNew
          ? `🎉 Registered & enrolled new student ${name} (${serial})!`
          : `✅ Enrolled existing student ${name} (${serial}) in this class!`
      )
      resetAddForm()
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
      setSuccessMsg(`Removed ${studentName} from this class.`)
      await loadStudents()
      if (onEnrollmentChanged) onEnrollmentChanged()
    }
  }

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

  const affiliationName = classItem?.institutions?.name || 'Solo Private Tuition'
  const isSolo = !classItem?.institutions?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[92vh] flex flex-col overflow-hidden p-6">
        {/* Header with class details */}
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {classItem?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{classItem?.subject}</span>
                  <span>•</span>
                  <span>Grade {classItem?.grade}</span>
                  {classItem?.schedule_day && (
                    <>
                      <span>•</span>
                      <span>
                        {classItem.schedule_day} at {classItem.schedule_time}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={
                  isSolo
                    ? 'bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold'
                    : 'bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold'
                }
              >
                {affiliationName}
              </Badge>
              <Badge variant="outline" className="text-xs font-bold text-slate-700">
                {enrolledStudents.length} Students
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Enrolled Roster ({enrolledStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add_by_phone')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'add_by_phone'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Student by Phone
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('class_days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'class_days'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Class Days & Attendance ({classSessions.length})
            </button>
          </div>
        </DialogHeader>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 my-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 my-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: ENROLLED STUDENTS ROSTER */}
        {activeTab === 'roster' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3 mt-1">
            {/* Search and Action Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search students by name, serial no, phone, school..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              <Button
                type="button"
                onClick={() => setActiveTab('add_by_phone')}
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Enroll New Student
              </Button>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl">
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
                      const joinDate = student.enrolledDate
                        ? new Date(student.enrolledDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Active'

                      return (
                        <TableRow key={student.id} className="hover:bg-slate-50/60 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-bold text-xs text-slate-900">{student.fullName}</p>
                              {student.school && (
                                <p className="text-[11px] text-slate-400">{student.school}</p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {student.serial_no || 'NEXA-STUDENT'}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="text-xs text-slate-600 font-mono">
                              {student.phone_number || '—'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs text-slate-500">{joinDate}</span>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={unenrollingId === student.id}
                              onClick={() => handleUnenroll(student.id, student.fullName)}
                              className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Unenroll student from class"
                            >
                              {unenrollingId === student.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                        <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-semibold text-slate-700">
                          {enrolledStudents.length === 0
                            ? 'No students enrolled in this class yet.'
                            : 'No students matching search filter.'}
                        </p>
                        <p className="text-[11px] mt-1">
                          Click "Add Student by Phone" above to enroll students into this class.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* TAB 2: ADD STUDENT BY PHONE (AUTO-POPULATE & INSTANT ENROLL) */}
        {activeTab === 'add_by_phone' && (
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">
                  Phone Number Auto-Population
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the student's contact number below. If the student already attends another class in the system, their profile details and serial number will auto-populate instantly.
              </p>
            </div>

            {/* Phone Input Box */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-blue-600" />
                Student Contact / Mobile Number <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  onBlur={handlePhoneLookup}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handlePhoneLookup()
                    }
                  }}
                  placeholder="e.g. 0710337936 or 0771234567"
                  className="h-10 text-xs font-mono font-semibold rounded-xl bg-slate-50 border-slate-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePhoneLookup}
                  disabled={isLookingUp || !inputPhone.trim()}
                  className="h-10 px-4 text-xs font-semibold rounded-xl shrink-0 border-slate-200 text-slate-700"
                >
                  {isLookingUp ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Lookup
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Existing Student Found Banner */}
            {lookupResult?.found && lookupResult.student && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-emerald-950">
                      Existing Student Recognized!
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-200 text-emerald-800">
                      {lookupResult.student.serial_no}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    <strong>{lookupResult.student.fullName}</strong> is already registered in the system. Student details have been populated below.
                  </p>
                </div>
              </div>
            )}

            {/* New Student Notice Banner */}
            {lookupResult && !lookupResult.found && (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-800">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  New student! Enter student details below to register and auto-generate their <strong>NEXA serial number</strong>.
                </span>
              </div>
            )}

            {/* Populated / Editable Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  readOnly={lookupResult?.found}
                  placeholder="Student first name"
                  className={`h-10 text-xs rounded-xl ${
                    lookupResult?.found ? 'bg-slate-100 font-semibold text-slate-800' : 'bg-slate-50'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  readOnly={lookupResult?.found}
                  placeholder="Student last name"
                  className={`h-10 text-xs rounded-xl ${
                    lookupResult?.found ? 'bg-slate-100 font-semibold text-slate-800' : 'bg-slate-50'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">School Attending</Label>
                <Input
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  readOnly={lookupResult?.found}
                  placeholder="e.g. Royal College / Ananda College"
                  className={`h-10 text-xs rounded-xl ${
                    lookupResult?.found ? 'bg-slate-100 font-semibold text-slate-800' : 'bg-slate-50'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Parent / Guardian Name</Label>
                <Input
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  readOnly={lookupResult?.found}
                  placeholder="Parent full name"
                  className={`h-10 text-xs rounded-xl ${
                    lookupResult?.found ? 'bg-slate-100 font-semibold text-slate-800' : 'bg-slate-50'
                  }`}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Parent Contact Number</Label>
                <Input
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  readOnly={lookupResult?.found}
                  placeholder="Emergency / parent phone number"
                  className={`h-10 text-xs rounded-xl ${
                    lookupResult?.found ? 'bg-slate-100 font-semibold text-slate-800' : 'bg-slate-50'
                  }`}
                />
              </div>
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleEnrollOrRegister}
                disabled={isSubmittingEnrollment || !inputPhone.trim()}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-200 transition-all"
              >
                {isSubmittingEnrollment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling Student...
                  </>
                ) : lookupResult?.found ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Enroll Existing Student: {lookupResult.student?.fullName}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register & Enroll New Student
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: CLASS DAYS & ATTENDANCE SUMMARY */}
        {activeTab === 'class_days' && (
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            <div className="flex items-center justify-between pb-1">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Conducted Sessions & Attendance History
                </p>
                <p className="text-[11px] text-slate-400">
                  Summary of class days and student attendance per session
                </p>
              </div>

              <Link
                href="/dashboard/attendance"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Open Register
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loadingSessions ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-500" />
                Loading session summaries...
              </div>
            ) : classSessions.length > 0 ? (
              <div className="space-y-2.5">
                {classSessions.map((session) => {
                  const isExpanded = expandedDate === session.date

                  return (
                    <div
                      key={session.date}
                      className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-2xs"
                    >
                      {/* Session Header Card */}
                      <div
                        onClick={() => setExpandedDate(isExpanded ? null : session.date)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{session.date}</p>
                            <p className="text-[11px] text-slate-400">
                              {session.total} students recorded
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {session.present} Present
                          </span>
                          {session.late > 0 && (
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.late} Late
                            </span>
                          )}
                          {session.absent > 0 && (
                            <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              {session.absent} Absent
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs font-bold text-blue-600 ml-1">
                            {session.rate}%
                          </Badge>

                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400 ml-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Student Breakdown for this Day */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Session Attendance Breakdown
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {session.students.map((st) => (
                              <div
                                key={st.id}
                                className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">{st.name}</span>
                                  <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                    {st.serialNo}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    st.status === 'present'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : st.status === 'late'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {st.status.toUpperCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  No attendance sessions recorded yet for this class.
                </p>
                <p className="text-[11px] mt-1">
                  Go to <Link href="/dashboard/attendance" className="text-blue-600 underline font-semibold">Attendance Register</Link> to mark today's session.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
