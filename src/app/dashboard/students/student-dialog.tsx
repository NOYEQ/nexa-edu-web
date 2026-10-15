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
import { createStudent, updateStudent } from './actions'
import { UserPlus, User, Phone, School, Users, Loader2 } from 'lucide-react'

export type StudentItem = {
  id: string
  first_name: string
  last_name: string
  phone_number?: string | null
  parent_name?: string | null
  parent_phone?: string | null
  school?: string | null
  serial_no?: string | null
  created_at?: string | null
  class_students?: {
    id: string
    classes?: { id: string; name: string; subject: string; grade: string } | null
  }[]
}

export type ClassOption = {
  id: string
  name: string
  subject: string
  grade: string
}

type StudentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: StudentItem | null
  classes?: ClassOption[]
  onSuccess?: () => void
}

export default function StudentDialog({
  open,
  onOpenChange,
  initialData,
  classes = [],
  onSuccess,
}: StudentDialogProps) {
  const isEditing = !!initialData

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [school, setSchool] = useState('')
  const [initialClassId, setInitialClassId] = useState('none')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name || '')
      setLastName(initialData.last_name || '')
      setPhoneNumber(initialData.phone_number || '')
      setParentName(initialData.parent_name || '')
      setParentPhone(initialData.parent_phone || '')
      setSchool(initialData.school || '')
      setInitialClassId('none')
    } else {
      setFirstName('')
      setLastName('')
      setPhoneNumber('')
      setParentName('')
      setParentPhone('')
      setSchool('')
      setInitialClassId('none')
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
    formData.append('first_name', firstName)
    formData.append('last_name', lastName)
    formData.append('phone_number', phoneNumber)
    formData.append('parent_name', parentName)
    formData.append('parent_phone', parentPhone)
    formData.append('school', school)
    formData.append('initial_class_id', initialClassId)

    const res = isEditing ? await updateStudent(formData) : await createStudent(formData)

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
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserPlus className="h-4 w-4" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {isEditing ? 'Edit Student Details' : 'Register New Student'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 text-sm">
            {isEditing
              ? 'Update contact details or school info for this student.'
              : 'Add a student to your institution roster. A unique student serial number will be generated.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name" className="text-xs font-semibold text-slate-700">
                First Name *
              </Label>
              <Input
                id="first_name"
                placeholder="e.g. Kasun"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="last_name" className="text-xs font-semibold text-slate-700">
                Last Name *
              </Label>
              <Input
                id="last_name"
                placeholder="e.g. Perera"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-10"
              />
            </div>
          </div>

          {/* Student Phone & School */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone_number" className="text-xs font-semibold text-slate-700">
                Student Phone / WhatsApp
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="phone_number"
                  placeholder="+94 77 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="school" className="text-xs font-semibold text-slate-700">
                School / College
              </Label>
              <div className="relative">
                <School className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="school"
                  placeholder="e.g. Royal College"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
            </div>
          </div>

          {/* Parent Guardian Name & Phone */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              Parent / Guardian Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="parent_name" className="text-[11px] font-semibold text-slate-600">
                  Parent / Guardian Name
                </Label>
                <Input
                  id="parent_name"
                  placeholder="e.g. S. Perera"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="h-9 bg-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="parent_phone" className="text-[11px] font-semibold text-slate-600">
                  Parent Emergency Phone
                </Label>
                <Input
                  id="parent_phone"
                  placeholder="+94 71 987 6543"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="h-9 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Initial Class Enrollment (only when adding new student) */}
          {!isEditing && classes.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Enroll in a Class (Optional)
              </Label>
              <Select value={initialClassId} onValueChange={(val) => setInitialClassId(val || 'none')}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select initial class..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="none">None (Enroll later)</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.subject} - {cls.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Register Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
