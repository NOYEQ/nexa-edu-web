'use client'

import React, { useState } from 'react'
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
import { registerTeacher } from './actions'
import {
  GraduationCap,
  Mail,
  Lock,
  Phone,
  BookOpen,
  Check,
  Copy,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

export type ClassOption = {
  id: string
  name: string
  subject: string
  grade: string
}

type TeacherDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableClasses?: ClassOption[]
  onSuccess?: () => void
}

export default function TeacherDialog({
  open,
  onOpenChange,
  availableClasses = [],
  onSuccess,
}: TeacherDialogProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [initialClassId, setInitialClassId] = useState('none')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{
    name: string
    email: string
    password: string
    phoneNumber?: string
    isExisting?: boolean
    message?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('first_name', firstName)
    formData.append('last_name', lastName)
    formData.append('phone_number', phoneNumber)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('initial_class_id', initialClassId)

    const res = await registerTeacher(formData)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else if (res.credentials) {
      setSuccessInfo({
        name: res.credentials.name,
        email: res.credentials.email,
        password: res.credentials.password,
        phoneNumber: res.credentials.phoneNumber,
        isExisting: res.isExistingTeacher,
        message: res.message,
      })
      if (onSuccess) onSuccess()
    }
  }

  const handleCopyCredentials = () => {
    if (!successInfo) return
    const text = `Nexa-Edu Instructor Credentials:\nName: ${successInfo.name}\nPhone: ${successInfo.phoneNumber || 'N/A'}\nEmail: ${successInfo.email}\nPassword: ${successInfo.password}\nLogin: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleClose = () => {
    setFirstName('')
    setLastName('')
    setPhoneNumber('')
    setEmail('')
    setPassword('')
    setInitialClassId('none')
    setError(null)
    setSuccessInfo(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        {!successInfo ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-2 rounded-xl bg-violet-100 text-violet-700">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Register Teacher / Instructor
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Teachers are recognized by their <strong>contact number</strong> across solo classes and multiple institutes.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-xs font-semibold text-slate-700">
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    placeholder="e.g. Nalika"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-10 text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-xs font-semibold text-slate-700">
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    placeholder="e.g. Wanigasekara"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Contact / Phone Number (Primary Key) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="phone_number" className="text-xs font-semibold text-slate-700">
                    Contact / Mobile Number *
                  </Label>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Primary Teacher ID
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="e.g. 0710337936"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="pl-10 h-10 text-sm rounded-xl font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Teachers doing solo classes or teaching at other institutes will be recognized with this mobile number and linked to your institute without duplicate accounts.
                </p>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Teacher's Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="teacher@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-10 text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Password (Optional)
                  </Label>
                  <span className="text-[11px] text-slate-400">Leave blank to auto-generate</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="text"
                    placeholder={`e.g. ${firstName ? firstName.toLowerCase() : 'teacher'}2026`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 text-sm rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Initial Class Assignment */}
              {availableClasses.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-violet-600" />
                    Assign to Class (Optional)
                  </Label>
                  <Select value={initialClassId} onValueChange={(val) => setInitialClassId(val || 'none')}>
                    <SelectTrigger className="h-10 rounded-xl bg-white">
                      <SelectValue placeholder="Assign initial class..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="none">None (Assign later)</SelectItem>
                      {availableClasses.map((cls) => (
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
                  onClick={handleClose}
                  disabled={loading}
                  className="h-10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-sm rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Register / Link Teacher'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* Success Screen */
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {successInfo.isExisting ? 'Teacher Linked Successfully!' : 'Teacher Account Created!'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1 max-w-sm">
                {successInfo.message || 'The instructor is now linked to your institute and can access their assigned classes.'}
              </DialogDescription>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Instructor Name:</span>
                <span className="font-bold text-slate-800">{successInfo.name}</span>
              </div>
              {successInfo.phoneNumber && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Contact Number:</span>
                  <span className="font-bold text-blue-600 font-mono">{successInfo.phoneNumber}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-bold text-slate-800 font-mono">{successInfo.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Access Password:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                  {successInfo.password}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                onClick={handleCopyCredentials}
                variant="outline"
                className="flex-1 h-10 rounded-xl text-xs font-semibold border-slate-300 hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5 text-slate-600" />
                    Copy Details
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleClose()
                  window.location.reload()
                }}
                className="flex-1 h-10 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
