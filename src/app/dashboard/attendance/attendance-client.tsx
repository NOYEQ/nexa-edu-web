'use client'

import React, { useState, useTransition } from 'react'
import {
  CalendarCheck2,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Check,
  ChevronRight,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  markStudentAttendance,
  markAllPresent,
  fetchAttendanceForDate,
  AttendanceStatus
} from './actions'

export interface ClassItem {
  id: string
  name: string
  subject: string
  grade: string
}

export interface StudentItem {
  id: string
  fullName: string
  serialNo: string
  phoneNumber?: string
  school?: string
}

interface AttendanceClientProps {
  classes: ClassItem[]
  studentsByClass: Record<string, StudentItem[]>
  initialClassId: string
  initialDate: string
  initialAttendance: Record<string, AttendanceStatus>
  studentHistoryStats: Record<string, { totalSessions: number; attendedSessions: number }>
}

export default function AttendanceClient({
  classes,
  studentsByClass,
  initialClassId,
  initialDate,
  initialAttendance,
  studentHistoryStats
}: AttendanceClientProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId)
  const [selectedDate, setSelectedDate] = useState<string>(initialDate)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(initialAttendance)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isFetchingDate, setIsFetchingDate] = useState(false)

  const activeStudents = studentsByClass[selectedClassId] || []
  const activeClass = classes.find(c => c.id === selectedClassId)

  // Filter students by search
  const filteredStudents = activeStudents.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.serialNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Date attendance counters
  let presentCount = 0
  let lateCount = 0
  let absentCount = 0

  for (const s of activeStudents) {
    const status = attendance[s.id]
    if (status === 'present') presentCount++
    else if (status === 'late') lateCount++
    else if (status === 'absent') absentCount++
  }

  const markedCount = presentCount + lateCount + absentCount
  const attendanceRate = activeStudents.length > 0
    ? Math.round(((presentCount + lateCount) / activeStudents.length) * 100)
    : 0

  // Change class
  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId)
    setIsFetchingDate(true)
    const res = await fetchAttendanceForDate(classId, selectedDate)
    if (res.data) {
      setAttendance(res.data)
    } else {
      setAttendance({})
    }
    setIsFetchingDate(false)
  }

  // Change date
  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate)
    setIsFetchingDate(true)
    const res = await fetchAttendanceForDate(selectedClassId, newDate)
    if (res.data) {
      setAttendance(res.data)
    } else {
      setAttendance({})
    }
    setIsFetchingDate(false)
  }

  // Mark single student attendance
  const handleStatusClick = (studentId: string, status: AttendanceStatus) => {
    // Optimistic local state update
    setAttendance(prev => ({ ...prev, [studentId]: status }))

    startTransition(async () => {
      await markStudentAttendance(selectedClassId, studentId, selectedDate, status)
    })
  }

  // Mark all enrolled as present
  const handleMarkAllPresent = () => {
    const studentIds = activeStudents.map(s => s.id)
    const newAtt: Record<string, AttendanceStatus> = { ...attendance }
    for (const id of studentIds) {
      newAtt[id] = 'present'
    }
    setAttendance(newAtt)

    startTransition(async () => {
      await markAllPresent(selectedClassId, studentIds, selectedDate)
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold text-xs">
              <CalendarCheck2 className="h-3.5 w-3.5 mr-1" />
              Daily Attendance Register
            </Badge>
            <span className="text-xs text-slate-400">Live sync with mobile app</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Class Attendance Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mark daily attendance for scheduled class batches. Changes sync in real-time to parents and students on the mobile app.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleMarkAllPresent}
            disabled={isPending || activeStudents.length === 0}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-emerald-200"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Mark All Present
          </Button>
        </div>
      </div>

      {/* Class Selector & Date Navigation Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Class Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-violet-600" />
            Select Tuition Class
          </label>
          <Select value={selectedClassId} onValueChange={val => handleClassChange(val || "")}>
            <SelectTrigger className="h-10 text-xs font-semibold rounded-xl bg-slate-50 border-slate-200">
              <SelectValue placeholder="Choose class..." />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                  {c.name} {c.subject ? '(' + c.subject + ')' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            Attendance Date
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              className="h-10 text-xs font-mono font-semibold rounded-xl bg-slate-50 border-slate-200"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
              className="h-10 px-3 text-xs font-semibold rounded-xl border-slate-200 text-slate-600 shrink-0 hover:bg-slate-50"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Search Student */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            Filter Student
          </label>
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or serial..."
            className="h-10 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Session Metrics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-3.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{activeStudents.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Students in batch</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-3.5">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Present
          </p>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{presentCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Attended on time</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-3.5">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Late
          </p>
          <p className="text-xl font-black text-amber-600 mt-0.5">{lateCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Late arrivals</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-3.5">
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Absent
          </p>
          <p className="text-xl font-black text-red-600 mt-0.5">{absentCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Not attended</p>
        </Card>

        <Card className="col-span-2 sm:col-span-1 border border-slate-200/80 shadow-xs bg-white rounded-2xl p-3.5">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Attendance Rate
          </p>
          <p className="text-xl font-black text-blue-600 mt-0.5">{attendanceRate}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{markedCount}/{activeStudents.length} marked</p>
        </Card>
      </div>

      {/* Attendance Roster Table */}
      <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              {activeClass ? activeClass.name : 'Class Roster'} — {selectedDate}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Click status pills to mark attendance for each student
            </p>
          </div>

          {isFetchingDate && (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading date...
            </Badge>
          )}
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-200">
                <TableHead className="font-bold text-slate-600 text-xs pl-6">Student Details</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Serial Number</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Attendance History</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs text-right pr-6">
                  Session Status (Click to Toggle)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const currentStatus = attendance[student.id]
                  const history = studentHistoryStats[student.id]
                  const historyRate = history && history.totalSessions > 0
                    ? Math.round((history.attendedSessions / history.totalSessions) * 100)
                    : 100

                  return (
                    <TableRow key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Contact */}
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{student.fullName}</p>
                          {student.school && (
                            <p className="text-[11px] text-slate-400">{student.school}</p>
                          )}
                        </div>
                      </TableCell>

                      {/* Serial */}
                      <TableCell>
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {student.serialNo}
                        </span>
                      </TableCell>

                      {/* History Percentage */}
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[130px]">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                              style={{ width: historyRate + '%' }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 shrink-0">
                            {historyRate}%
                          </span>
                        </div>
                      </TableCell>

                      {/* Interactive Attendance Toggle Pills */}
                      <TableCell className="text-right pr-6">
                        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusClick(student.id, 'present')}
                            className={'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                            )}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Present
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusClick(student.id, 'late')}
                            className={'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-xs scale-105'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            Late
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusClick(student.id, 'absent')}
                            className={'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ' + (
                              currentStatus === 'absent'
                                ? 'bg-red-600 text-white shadow-xs scale-105'
                                : 'text-slate-600 hover:text-red-700 hover:bg-red-50'
                            )}
                          >
                            <XCircle className="h-3 w-3" />
                            Absent
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center text-slate-400">
                    <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      {activeStudents.length === 0
                        ? 'No students enrolled in this class yet.'
                        : 'No students matching filter query.'}
                    </p>
                    <p className="text-xs mt-1">
                      {activeStudents.length === 0
                        ? 'Enroll students from the Classes or Students tab to take attendance.'
                        : 'Try searching with a different name or serial number.'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
