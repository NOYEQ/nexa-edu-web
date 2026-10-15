'use client'

import React, { useState, useTransition } from 'react'
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Printer,
  Trash2,
  Loader2,
  Calendar,
  Building2,
  Users,
  BookOpen
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
import CollectFeeDialog from './collect-fee-dialog'
import ReceiptDialog, { PaymentReceiptData } from './receipt-dialog'
import { updatePaymentStatus, deletePayment, PaymentStatus } from './actions'

export interface PaymentItem {
  id: string
  amount: number
  month: string
  status: string
  payment_date: string
  created_at: string
  class_id: string
  student_id: string
  classes?: {
    id: string
    name: string
    subject: string
  }
  student?: {
    id: string
    first_name: string
    last_name: string
    serial_no: string
    phone_number?: string
  }
}

interface PaymentsClientProps {
  initialPayments: PaymentItem[]
  students: Array<{ id: string; fullName: string; serialNo: string; phoneNumber?: string }>
  classes: Array<{ id: string; name: string; subject: string; fee: number }>
  institutionName?: string
}

export default function PaymentsClient({
  initialPayments,
  students,
  classes,
  institutionName
}: PaymentsClientProps) {
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // Collect Fee Modal
  const [collectModalOpen, setCollectModalOpen] = useState(false)

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [currentReceipt, setCurrentReceipt] = useState<PaymentReceiptData | null>(null)

  // Filtered payments
  const filtered = payments.filter(p => {
    const studentName = p.student
      ? (p.student.first_name + ' ' + p.student.last_name).toLowerCase()
      : ''
    const serial = (p.student?.serial_no || '').toLowerCase()
    const className = (p.classes?.name || '').toLowerCase()
    const q = searchQuery.toLowerCase()

    const matchesSearch = studentName.includes(q) || serial.includes(q) || className.includes(q)
    const matchesStatus = statusFilter === 'all' || p.status.toLowerCase() === statusFilter
    const matchesClass = classFilter === 'all' || p.class_id === classFilter

    return matchesSearch && matchesStatus && matchesClass
  })

  // Summary Metrics
  const totalCount = payments.length
  const totalCollected = payments
    .filter(p => p.status.toLowerCase() === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const pendingAmount = payments
    .filter(p => p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'unpaid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const collectionRate = totalCollected + pendingAmount > 0
    ? Math.round((totalCollected / (totalCollected + pendingAmount)) * 100)
    : 100

  const handleOpenReceipt = (payment: PaymentItem) => {
    const receiptData: PaymentReceiptData = {
      id: payment.id,
      amount: payment.amount,
      month: payment.month,
      paymentDate: payment.payment_date,
      status: payment.status,
      studentName: payment.student
        ? (payment.student.first_name + ' ' + payment.student.last_name).trim()
        : 'Student',
      studentSerial: payment.student?.serial_no || 'NEXA-STUDENT',
      studentPhone: payment.student?.phone_number,
      className: payment.classes?.name || 'Class',
      classSubject: payment.classes?.subject,
      institutionName: institutionName || 'Nexa-Edu Tuition Center',
    }
    setCurrentReceipt(receiptData)
    setReceiptModalOpen(true)
  }

  const handlePaymentSuccess = (receiptData: PaymentReceiptData) => {
    // Add new payment to local state
    const newPayment: PaymentItem = {
      id: receiptData.id,
      amount: receiptData.amount,
      month: receiptData.month,
      status: receiptData.status,
      payment_date: receiptData.paymentDate,
      created_at: new Date().toISOString(),
      class_id: '',
      student_id: '',
      student: {
        id: '',
        first_name: receiptData.studentName.split(' ')[0] || '',
        last_name: receiptData.studentName.split(' ').slice(1).join(' ') || '',
        serial_no: receiptData.studentSerial,
        phone_number: receiptData.studentPhone
      },
      classes: {
        id: '',
        name: receiptData.className,
        subject: receiptData.classSubject || ''
      }
    }
    setPayments(prev => [newPayment, ...prev])
    setCurrentReceipt(receiptData)
    setReceiptModalOpen(true)
  }

  const handleMarkPaid = (paymentId: string) => {
    startTransition(async () => {
      const res = await updatePaymentStatus(paymentId, 'paid')
      if (res.success) {
        setPayments(prev =>
          prev.map(p => (p.id === paymentId ? { ...p, status: 'paid' } : p))
        )
      }
    })
  }

  const handleDeletePayment = (paymentId: string) => {
    if (!confirm('Are you sure you want to void this payment record?')) return

    startTransition(async () => {
      const res = await deletePayment(paymentId)
      if (res.success) {
        setPayments(prev => prev.filter(p => p.id !== paymentId))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-100 text-amber-800 border-0 text-xs px-2.5 py-0.5 font-semibold">
              Financial Tracking
            </Badge>
            <span className="text-xs text-slate-400">Real-time fee ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tuition Fee Ledger & Receipts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Record student monthly tuition collections, print official receipts, and track pending dues.
          </p>
        </div>

        <Button
          onClick={() => setCollectModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-amber-200 shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Collect Fee Payment
        </Button>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold">
              Collected
            </Badge>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-3">
            LKR {totalCollected.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Total Fees Collected</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Completed transactions</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="h-5 w-5" />
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-bold">
              Pending
            </Badge>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-3">
            LKR {pendingAmount.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Pending / Overdue</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Uncollected fee balance</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold text-slate-600">
              Records
            </Badge>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{totalCount}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Total Transactions</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Logged payment receipts</p>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <DollarSign className="h-5 w-5" />
            </div>
            <Badge className="bg-violet-100 text-violet-800 border-0 text-[10px] font-bold">
              Efficiency
            </Badge>
          </div>
          <p className="text-2xl font-black text-violet-600 mt-3">{collectionRate}%</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">Collection Rate</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Collected vs total dues</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student, serial, or class..."
            className="pl-10 h-10 bg-slate-50 border-slate-200 text-xs rounded-xl focus-visible:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={classFilter} onValueChange={val => setClassFilter(val || "all")}>
            <SelectTrigger className="h-10 text-xs w-[160px] bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="Class Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={val => setStatusFilter((val as any) || "all")}>
            <SelectTrigger className="h-10 text-xs w-[130px] bg-slate-50 border-slate-200 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="unpaid">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ledger Table */}
      <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-200">
                <TableHead className="font-bold text-slate-600 text-xs pl-6">Student Details</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Class & Subject</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Billing Cycle</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Payment Date</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Fee Amount</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs">Status</TableHead>
                <TableHead className="font-bold text-slate-600 text-xs text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map(p => {
                  const studentName = p.student
                    ? (p.student.first_name + ' ' + p.student.last_name).trim()
                    : 'Student'
                  const serial = p.student?.serial_no || ''
                  const className = p.classes?.name || 'Class'
                  const subject = p.classes?.subject || ''
                  const isPaid = p.status.toLowerCase() === 'paid'

                  return (
                    <TableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student */}
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{studentName}</p>
                          {serial && (
                            <p className="text-[11px] text-blue-600 font-mono font-semibold mt-0.5">
                              {serial}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Class */}
                      <TableCell>
                        <p className="text-xs font-semibold text-slate-800">{className}</p>
                        {subject && <p className="text-[11px] text-slate-400">{subject}</p>}
                      </TableCell>

                      {/* Billing Cycle */}
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-medium bg-slate-50 text-slate-700">
                          {p.month}
                        </Badge>
                      </TableCell>

                      {/* Payment Date */}
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {p.payment_date || 'N/A'}
                      </TableCell>

                      {/* Fee Amount */}
                      <TableCell>
                        <span className="text-xs font-extrabold text-slate-900">
                          LKR {Number(p.amount || 0).toLocaleString()}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isPaid ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Paid
                          </Badge>
                        ) : p.status.toLowerCase() === 'pending' ? (
                          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReceipt(p)}
                            className="h-7 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>

                          {!isPaid && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkPaid(p.id)}
                              disabled={isPending}
                              className="h-7 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg"
                            >
                              Mark Paid
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePayment(p.id)}
                            disabled={isPending}
                            className="h-7 text-[11px] text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-slate-400">
                    <CreditCard className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No payment records found</p>
                    <p className="text-xs mt-1">Collect your first fee payment using the button above.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Collect Fee Modal */}
      <CollectFeeDialog
        open={collectModalOpen}
        onOpenChange={setCollectModalOpen}
        students={students}
        classes={classes}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Receipt Printable Dialog */}
      <ReceiptDialog
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        receipt={currentReceipt}
      />
    </div>
  )
}
