'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Printer,
  Copy,
  CheckCircle2,
  GraduationCap,
  Download,
  Calendar,
  CreditCard,
  Building2,
  Clock
} from 'lucide-react'

export interface PaymentReceiptData {
  id: string
  amount: number
  month: string
  paymentDate: string
  status: string
  studentName: string
  studentSerial: string
  studentPhone?: string
  className: string
  classSubject?: string
  institutionName?: string
  createdAt?: string
}

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: PaymentReceiptData | null
}

export default function ReceiptDialog({ open, onOpenChange, receipt }: ReceiptDialogProps) {
  if (!receipt) return null

  const receiptNumber = 'REC-' + (receipt.id ? receipt.id.substring(0, 8).toUpperCase() : '00000000')
  const isPaid = receipt.status.toLowerCase() === 'paid'

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = () => {
    const text = [
      '--- NEXA-EDU TUITION FEE RECEIPT ---',
      'Receipt No: ' + receiptNumber,
      'Date: ' + receipt.paymentDate,
      'Student: ' + receipt.studentName + ' (' + (receipt.studentSerial || 'N/A') + ')',
      'Class: ' + receipt.className + (receipt.classSubject ? ' - ' + receipt.classSubject : ''),
      'Billing Month: ' + receipt.month,
      'Amount: LKR ' + Number(receipt.amount || 0).toLocaleString(),
      'Status: ' + receipt.status.toUpperCase(),
      '-----------------------------------'
    ].join('\n')

    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden print:p-0 print:border-0 print:shadow-none">
        <div id="printable-receipt" className="p-6 space-y-5 bg-white">
          {/* Receipt Top Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  {receipt.institutionName || 'Nexa-Edu Tuition Center'}
                </h3>
                <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest mt-0.5">
                  Official Tuition Payment Receipt
                </p>
              </div>
            </div>

            <div className="text-right">
              <Badge className={isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold' : 'bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold'}>
                {isPaid ? 'PAID' : receipt.status.toUpperCase()}
              </Badge>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                {receiptNumber}
              </p>
            </div>
          </div>

          {/* Receipt Details Grid */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Date of Payment:</span>
              <span className="font-bold text-slate-800">{receipt.paymentDate}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Student Name:</span>
              <span className="font-bold text-slate-900">{receipt.studentName}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Student Serial No:</span>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {receipt.studentSerial || 'NEXA-STUDENT'}
              </span>
            </div>

            {receipt.studentPhone && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Contact:</span>
                <span className="text-slate-700 font-mono">{receipt.studentPhone}</span>
              </div>
            )}

            <div className="h-px bg-slate-200/60 my-1" />

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tuition Class:</span>
              <span className="font-semibold text-slate-800">{receipt.className}</span>
            </div>

            {receipt.classSubject && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Subject:</span>
                <span className="text-slate-600">{receipt.classSubject}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Billing Month:</span>
              <span className="font-bold text-slate-800">{receipt.month}</span>
            </div>
          </div>

          {/* Total Amount Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-md shadow-blue-200">
            <div>
              <p className="text-[11px] font-medium text-blue-100 uppercase tracking-wider">Total Amount Paid</p>
              <p className="text-xl font-black mt-0.5">
                LKR {Number(receipt.amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Security Seal Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>System Verified Electronic Receipt</span>
            <span className="font-mono">Synced with Mobile App</span>
          </div>
        </div>

        {/* Modal Buttons (Hidden when printing) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy Summary
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
