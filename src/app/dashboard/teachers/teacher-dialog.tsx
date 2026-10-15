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
  User,
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [initialClassId, setInitialClassId] = useState('none')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Success state with generated credentials
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string
    email: string
    password: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  function handleClose() {
    onOpenChange(false)
    // Reset state after transition
    setTimeout(() => {
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setInitialClassId('none')
      setError(null)
      setCreatedCredentials(null)
      setCopied(false)
    }, 200)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('first_name', firstName)
    formData.append('last_name', lastName)
    formData.append('email', email)
    if (password.trim()) {
      formData.append('password', password.trim())
    }
    formData.append('initial_class_id', initialClassId)

    const res = await registerTeacher(formData)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else if (res.credentials) {
      setCreatedCredentials(res.credentials)
      if (onSuccess) onSuccess()
    }
  }

  function handleCopyCredentials() {
    if (!createdCredentials) return
    const text = `Nexa-Edu Faculty Account Details:
Name: ${createdCredentials.name}
Email: ${createdCredentials.email}
Temporary Password: ${createdCredentials.password}
Login Portal: ${window.location.origin}/login`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!createdCredentials ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  Register Faculty Member
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 text-sm">
                Instantly create a teacher account under your institution. You can provide or auto-generate a temporary password.
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
                    placeholder="e.g. Priyantha"
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
                    placeholder="e.g. Silva"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-10 text-sm rounded-xl"
                  />
                </div>
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

              {/* Password (Optional / Auto-generated) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Temporary Password (Optional)
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Leave blank to auto-generate
                  </span>
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
                <p className="text-[11px] text-slate-400">
                  If left empty, a temporary password like <span className="font-semibold text-slate-600">{firstName ? `${firstName.toLowerCase()}2026` : 'teacher2026'}</span> will be generated.
                </p>
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
                      Creating Account...
                    </>
                  ) : (
                    'Register Teacher'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* Success Screen with Credentials */
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Teacher Account Created!
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1 max-w-sm">
                The account has been linked to your institution. Share these login credentials with the instructor:
              </DialogDescription>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Instructor Name:</span>
                <span className="font-bold text-slate-800">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-bold text-slate-800 font-mono">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Temporary Password:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                  {createdCredentials.password}
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
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5 text-slate-600" />
                    Copy Login Details
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
