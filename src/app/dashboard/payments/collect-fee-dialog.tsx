'use client'

import React, { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  CreditCard,
  DollarSign,
  Calendar,
  Users,
  BookOpen,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { createPayment, PaymentStatus } from './actions'
import { PaymentReceiptData } from './receipt-dialog'

interface StudentOption {
  id: string
  fullName: string
  serialNo: string
  phoneNumber?: string
}

interface ClassOption {
  id: string
  name: string
  subject: string
  fee: number
}

interface CollectFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: StudentOption[]
  classes: ClassOption[]
  onPaymentSuccess: (receiptData: PaymentReceiptData) => void
}

export default function CollectFeeDialog({
  open,
  onOpenChange,
  students,
  classes,
  onPaymentSuccess
}: CollectFeeDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [month, setMonth] = useState<string>(() => {
    const d = new Date()
    return d.toLocaleString('default', { month: 'long' }) + ' ' + d.getFullYear()
  })
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<PaymentStatus>('paid')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Months list for dropdown
  const months = [
    'January 2026', 'February 2026', 'March 2026', 'April 2026',
    'May 2026', 'June 2026', 'July 2026', 'August 2026',
    'September 2026', 'October 2026', 'November 2026', 'December 2026'
  ]

  // When class changes, auto-fill fee
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    const cls = classes.find(c => c.id === classId)
    if (cls && cls.fee) {
      setAmount(cls.fee.toString())
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!selectedStudentId) {
      setErrorMsg('Please select a student.')
      return
    }
    if (!selectedClassId) {
      setErrorMsg('Please select a class.')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please enter a valid payment amount.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('student_id', selectedStudentId)
      formData.append('class_id', selectedClassId)
      formData.append('amount', amount)
      formData.append('month', month)
      formData.append('payment_date', paymentDate)
      formData.append('status', status)

      const res = await createPayment(formData)

      if (res.error) {
        setErrorMsg(res.error)
      } else if (res.payment) {
        const student = students.find(s => s.id === selectedStudentId)
        const cls = classes.find(c => c.id === selectedClassId)

        const receiptData: PaymentReceiptData = {
          id: res.payment.id,
          amount: parseFloat(amount),
          month,
          paymentDate,
          status,
          studentName: student?.fullName || 'Student',
          studentSerial: student?.serialNo || 'NEXA-STUDENT',
          studentPhone: student?.phoneNumber,
          className: cls?.name || 'Class',
          classSubject: cls?.subject,
        }

        onOpenChange(false)
        onPaymentSuccess(receiptData)

        // Reset form
        setSelectedStudentId('')
        setSelectedClassId('')
        setAmount('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            Record Tuition Fee Payment
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Record student monthly class fees, update collection status, and issue a printable receipt.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Select Student */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              Student
            </Label>
            <Select value={selectedStudentId} onValueChange={val => setSelectedStudentId(val || "")}>
              <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/70 border-slate-200">
                <SelectValue placeholder="Select student by name or serial..." />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.fullName} ({s.serialNo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Class */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-violet-600" />
              Class / Batch
            </Label>
            <Select value={selectedClassId} onValueChange={val => handleClassChange(val || "")}>
              <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/70 border-slate-200">
                <SelectValue placeholder="Select class..." />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name} {c.subject ? '(' + c.subject + ')' : ''} - LKR {c.fee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Month & Payment Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Billing Month</Label>
              <Select value={month} onValueChange={val => setMonth(val || "")}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/70 border-slate-200">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {months.map(m => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="h-10 text-xs rounded-xl bg-slate-50/70 border-slate-200"
              />
            </div>
          </div>

          {/* Amount & Status in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Fee Amount (LKR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">LKR</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="1500"
                  className="pl-12 h-10 text-xs font-semibold rounded-xl bg-slate-50/70 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Payment Status</Label>
              <Select value={status} onValueChange={val => setStatus((val as PaymentStatus) || "paid")}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50/70 border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid (Collected)</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unpaid">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Record & Generate Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
