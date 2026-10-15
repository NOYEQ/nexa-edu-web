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
import { BookOpen, Calendar, Clock, DollarSign, GraduationCap, Loader2 } from 'lucide-react'

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

const COMMON_SUBJECTS = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology', 'ICT', 'Commerce', 'History']
const COMMON_GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (O/L)', 'Grade 12 (A/L)', 'Grade 13 (A/L)']
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
  const [scheduleTime, setScheduleTime] = useState('09:00 AM')
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
      setScheduleTime(initialData.schedule_time || '09:00 AM')
      setFee(initialData.fee ? initialData.fee.toString() : '')
      setFeeType(initialData.fee_type || 'monthly')
      setAssignedTeacherId(initialData.assigned_teacher_id || 'none')
    } else {
      setName('')
      setSubject('')
      setGrade('')
      setScheduleDay('Monday')
      setScheduleTime('09:00 AM')
      setFee('')
      setFeeType('monthly')
      setAssignedTeacherId('none')
    }
    setError(null)
  }, [initialData, open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    if (isEditing && initialData) {
      formData.append('id', initialData.id)
    }
    formData.append('name', name)
    formData.append('subject', subject)
    formData.append('grade', grade)
    formData.append('schedule_day', scheduleDay)
    formData.append('schedule_time', scheduleTime)
    formData.append('fee', fee)
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
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
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
              className="h-10"
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
                className="h-10"
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
                className="h-10"
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

          {/* Schedule Day & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Schedule Day *</Label>
              <Select value={scheduleDay} onValueChange={(val) => setScheduleDay(val || "Monday")}>
                <SelectTrigger className="h-10">
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

            <div className="space-y-1.5">
              <Label htmlFor="schedule_time" className="text-xs font-semibold text-slate-700">
                Schedule Time *
              </Label>
              <Input
                id="schedule_time"
                placeholder="e.g. 09:00 AM - 11:30 AM"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                required
                className="h-10"
              />
            </div>
          </div>

          {/* Fee & Fee Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fee" className="text-xs font-semibold text-slate-700">
                Fee Amount (LKR) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">LKR</span>
                <Input
                  id="fee"
                  type="number"
                  step="50"
                  min="0"
                  placeholder="2500"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  required
                  className="h-10 pl-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Billing Type *</Label>
              <Select value={feeType} onValueChange={(val) => setFeeType(val || "monthly")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Billing frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Fee</SelectItem>
                  <SelectItem value="per_session">Per Session</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Teacher Assignment (if Institution or teachers available) */}
          {isInstitution && teachers.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                Assign Teacher (Optional)
              </Label>
              <Select value={assignedTeacherId} onValueChange={(val) => setAssignedTeacherId(val || "none")}>
                <SelectTrigger className="h-10">
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
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm"
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
