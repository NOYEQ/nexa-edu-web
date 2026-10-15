'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClass, updateClass } from './actions'
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Loader2,
  ArrowRight,
} from 'lucide-react'

export type ClassItem = {
  id: string
  name: string
  subject: string
  grade: string
  schedule_day: string
  schedule_time: string
  fee: number
  fee_type?: string
  institution_id?: string | null
  assigned_teacher_id?: string | null
  institutions?: { name: string } | null
  assigned_teacher?: { id: string; full_name: string } | null
  class_students?: { id: string }[]
}

export type TeacherItem = {
  id: string
  full_name: string
  email?: string
}

type ClassDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ClassItem | null
  teachers?: TeacherItem[]
  isInstitution?: boolean
  onSuccess?: () => void
}

const COMMON_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'ICT',
  'Commerce',
  'History',
]

const COMMON_GRADES = [
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11 (O/L)',
  'Grade 12 (A/L)',
  'Grade 13 (A/L)',
]

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

// 30m intervals up to 6 hours
const DURATION_PRESETS = [
  { value: 30, label: '30m', short: '30m' },
  { value: 60, label: '1h', short: '1h' },
  { value: 90, label: '1.30h', short: '1.30h' },
  { value: 120, label: '2h', short: '2h' },
  { value: 150, label: '2.30h', short: '2.30h' },
  { value: 180, label: '3h', short: '3h' },
  { value: 210, label: '3.30h', short: '3.30h' },
  { value: 240, label: '4h', short: '4h' },
  { value: 270, label: '4.30h', short: '4.30h' },
  { value: 300, label: '5h', short: '5h' },
  { value: 330, label: '5.30h', short: '5.30h' },
  { value: 360, label: '6h', short: '6h' },
]

// Helper to format 24h into 12h AM/PM
function formatTime12(hours24: number, minutes: number): string {
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const h12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  const mStr = minutes.toString().padStart(2, '0')
  const hStr = h12.toString().padStart(2, '0')
  return `${hStr}:${mStr} ${period}`
}

// Helper to calculate end time and duration string
function calculateSchedule(startTime24: string, durationMinutes: number) {
  const [hStr, mStr] = (startTime24 || '09:00').split(':')
  const startH = parseInt(hStr || '9', 10)
  const startM = parseInt(mStr || '0', 10)

  const startFormatted = formatTime12(startH, startM)

  const totalEndMinutes = startH * 60 + startM + durationMinutes
  const endH = Math.floor(totalEndMinutes / 60) % 24
  const endM = totalEndMinutes % 60
  const endFormatted = formatTime12(endH, endM)

  const hours = Math.floor(durationMinutes / 60)
  const mins = durationMinutes % 60
  let durationBadge = ''
  if (hours > 0 && mins > 0) {
    durationBadge = `${hours}.${mins === 30 ? '30' : mins}h`
  } else if (hours > 0) {
    durationBadge = `${hours}h`
  } else {
    durationBadge = `${mins}m`
  }

  const finalString = `${startFormatted} - ${endFormatted}`
  return { startFormatted, endFormatted, durationBadge, finalString }
}

// Helper to parse existing schedule string
function parseExistingSchedule(timeStr?: string): { startTime24: string; durationMins: number } {
  if (!timeStr) return { startTime24: '09:00', durationMins: 120 }

  const match = timeStr.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)?(?:\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i
  )
  if (!match) return { startTime24: '09:00', durationMins: 120 }

  let startH = parseInt(match[1], 10)
  const startM = parseInt(match[2], 10)
  const startPeriod = match[3]?.toUpperCase() || 'AM'

  if (startPeriod === 'PM' && startH < 12) startH += 12
  if (startPeriod === 'AM' && startH === 12) startH = 0

  const startTime24 = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`

  if (match[4] && match[5]) {
    let endH = parseInt(match[4], 10)
    const endM = parseInt(match[5], 10)
    const endPeriod = match[6]?.toUpperCase() || startPeriod

    if (endPeriod === 'PM' && endH < 12) endH += 12
    if (endPeriod === 'AM' && endH === 12) endH = 0

    let diff = endH * 60 + endM - (startH * 60 + startM)
    if (diff < 0) diff += 24 * 60
    if (diff > 0) return { startTime24, durationMins: diff }
  }

  return { startTime24, durationMins: 120 }
}

export default function ClassDialog({
  open,
  onOpenChange,
  initialData,
  teachers = [],
  isInstitution = false,
  onSuccess,
}: ClassDialogProps) {
  const isEditing = !!initialData

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [scheduleDay, setScheduleDay] = useState('Monday')

  // Start Time & Duration states
  const [startTime, setStartTime] = useState('09:00')
  const [durationMinutes, setDurationMinutes] = useState(120)

  const [fee, setFee] = useState('')
  const [feeType, setFeeType] = useState('monthly')
  const [assignedTeacherId, setAssignedTeacherId] = useState('none')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setSubject(initialData.subject || '')
      setGrade(initialData.grade || '')
      setScheduleDay(initialData.schedule_day || 'Monday')

      const parsed = parseExistingSchedule(initialData.schedule_time)
      setStartTime(parsed.startTime24)
      setDurationMinutes(parsed.durationMins)

      setFee(initialData.fee ? initialData.fee.toString() : '')
      setFeeType(initialData.fee_type || 'monthly')
      setAssignedTeacherId(initialData.assigned_teacher_id || 'none')
    } else {
      setName('')
      setSubject('')
      setGrade('')
      setScheduleDay('Monday')
      setStartTime('09:00')
      setDurationMinutes(120)
      setFee('')
      setFeeType('monthly')
      setAssignedTeacherId('none')
    }
    setError(null)
  }, [initialData, open])

  // Calculate live schedule
  const computed = calculateSchedule(startTime, durationMinutes)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate fee amount
    const feeNum = parseFloat(fee)
    if (isNaN(feeNum) || feeNum < 0) {
      setError('Please enter a valid tuition fee amount (e.g. 2500).')
      setLoading(false)
      return
    }

    if (!name.trim()) {
      setError('Please provide a class name.')
      setLoading(false)
      return
    }

    if (!subject.trim()) {
      setError('Please provide a subject.')
      setLoading(false)
      return
    }

    if (!grade.trim()) {
      setError('Please provide a grade or batch.')
      setLoading(false)
      return
    }

    const formData = new FormData()
    if (isEditing && initialData) {
      formData.append('id', initialData.id)
    }
    formData.append('name', name.trim())
    formData.append('subject', subject.trim())
    formData.append('grade', grade.trim())
    formData.append('schedule_day', scheduleDay)
    formData.append('schedule_time', computed.finalString)
    formData.append('fee', feeNum.toString())
    formData.append('fee_type', feeType)
    formData.append('assigned_teacher_id', assignedTeacherId)

    const res = isEditing ? await updateClass(formData) : await createClass(formData)

    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      onOpenChange(false)
      if (onSuccess) onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {isEditing ? 'Edit Class Details' : 'Create New Class'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 text-sm">
            {isEditing
              ? 'Modify schedule, fee, or assigned instructor for this class.'
              : 'Add a new tuition class to your institution or teaching schedule.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Class Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
              Class Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g. Grade 11 Mathematics Theory"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-sm rounded-xl"
            />
          </div>

          {/* Subject & Grade grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-semibold text-slate-700">
                Subject *
              </Label>
              <Input
                id="subject"
                placeholder="e.g. Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="h-10 text-sm rounded-xl"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_SUBJECTS.slice(0, 4).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 transition-colors"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grade" className="text-xs font-semibold text-slate-700">
                Grade / Batch *
              </Label>
              <Input
                id="grade"
                placeholder="e.g. Grade 11 (O/L)"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
                className="h-10 text-sm rounded-xl"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_GRADES.slice(4, 8).map((gr) => (
                  <button
                    key={gr}
                    type="button"
                    onClick={() => setGrade(gr)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 transition-colors"
                  >
                    {gr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Section: Day, Start Time, and Duration */}
          <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100 space-y-3.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-violet-600" />
              <Label className="text-xs font-bold text-violet-900">
                Class Timetable & Schedule
              </Label>
            </div>

            {/* Schedule Day */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Schedule Day *</Label>
              <Select value={scheduleDay} onValueChange={(val) => setScheduleDay(val || 'Monday')}>
                <SelectTrigger className="h-10 bg-white rounded-xl">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Time & Duration Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Start Time Picker */}
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-violet-600" />
                  Class Start Time *
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="h-10 bg-white rounded-xl text-sm font-medium"
                />
              </div>

              {/* Duration Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Class Duration *
                </Label>
                <Select
                  value={durationMinutes.toString()}
                  onValueChange={(val) => setDurationMinutes(parseInt(val || '120', 10))}
                >
                  <SelectTrigger className="h-10 bg-white rounded-xl">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {DURATION_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value.toString()}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Duration Pills (30m, 1h, 1.30h, 2h, 2.30h, 3h, etc.) */}
            <div className="space-y-1 pt-0.5">
              <span className="text-[11px] text-slate-500 font-medium">Quick duration:</span>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setDurationMinutes(p.value)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      durationMinutes === p.value
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    {p.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Computed Schedule Preview */}
            <div className="p-3 rounded-xl bg-white border border-violet-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{computed.startFormatted}</span>
                <ArrowRight className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-xs font-bold text-slate-800">{computed.endFormatted}</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold ml-1">
                  {computed.durationBadge}
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 hidden sm:inline">
                Every {scheduleDay}
              </span>
            </div>
          </div>

          {/* Fee & Fee Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fee Amount with clean prefix and NO spin buttons */}
            <div className="space-y-1.5">
              <Label htmlFor="fee" className="text-xs font-semibold text-slate-700">
                Tuition Fee Amount *
              </Label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white shadow-xs">
                <span className="bg-slate-100 px-3.5 flex items-center justify-center border-r border-slate-200 text-xs font-bold text-slate-600 select-none">
                  LKR
                </span>
                <input
                  id="fee"
                  type="text"
                  inputMode="decimal"
                  placeholder="2500"
                  value={fee}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9.]/g, '')
                    setFee(clean)
                  }}
                  required
                  className="flex-1 h-10 px-3 text-sm font-semibold text-slate-800 outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Billing Type *</Label>
              <Select value={feeType} onValueChange={(val) => setFeeType(val || 'monthly')}>
                <SelectTrigger className="h-10 rounded-xl bg-white">
                  <SelectValue placeholder="Billing frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Fee</SelectItem>
                  <SelectItem value="per_session">Per Session</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Teacher Assignment (if Institution) */}
          {isInstitution && teachers.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                Assign Teacher (Optional)
              </Label>
              <Select value={assignedTeacherId} onValueChange={(val) => setAssignedTeacherId(val || 'none')}>
                <SelectTrigger className="h-10 rounded-xl bg-white">
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned (Institution Direct)</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.email || 'Instructor'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400">
                Assigned teachers will see this class in their dashboard and manage attendance.
              </p>
            </div>
          )}

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-sm rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Class'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
