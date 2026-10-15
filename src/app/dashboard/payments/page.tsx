import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard, DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      month,
      status,
      payment_date,
      created_at,
      class_id,
      student_id,
      classes:classes!class_id ( id, name, subject ),
      student:students!student_id ( id, first_name, last_name, serial_no )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const total = payments?.length ?? 0
  const totalCollected = (payments || [])
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)

  const pendingAmount = (payments || [])
    .filter((p: any) => p.status === 'pending' || p.status === 'unpaid')
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)

  const statusConfig: Record<string, { label: string; color: string; border: string; icon: any }> = {
    paid: {
      label: 'Paid',
      color: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    pending: {
      label: 'Pending',
      color: 'bg-amber-50 text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
    },
    unpaid: {
      label: 'Overdue',
      color: 'bg-red-50 text-red-700',
      border: 'border-red-200',
      icon: AlertCircle,
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tuition Fee Ledger</h1>
            <Badge className="bg-amber-100 text-amber-800 border-0 text-xs px-2.5 py-0.5 font-semibold">
              Financial Tracking
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Track student monthly tuition fees, collection statuses, and pending dues.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs">
          <CreditCard className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-700">{total} Records</span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Collected</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                LKR {totalCollected.toLocaleString()}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Dues</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                LKR {pendingAmount.toLocaleString()}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transactions</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{total}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">
            Payment Transactions
          </CardTitle>
          <span className="text-xs text-slate-400">Recorded from mobile app and web</span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600 text-xs pl-6">Student</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Class & Subject</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Billing Month</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Amount</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments && payments.length > 0 ? (
                payments.map((p: any) => {
                  const studentName = p.student
                    ? `${p.student.first_name || ''} ${p.student.last_name || ''}`.trim()
                    : 'Student'
                  const serial = p.student?.serial_no || ''
                  const className = p.classes?.name || 'Class'
                  const subject = p.classes?.subject || ''
                  const status = statusConfig[p.status] || {
                    label: p.status || 'Pending',
                    color: 'bg-slate-50 text-slate-700',
                    border: 'border-slate-200',
                    icon: Clock,
                  }
                  const StatusIcon = status.icon

                  return (
                    <TableRow key={p.id} className="hover:bg-amber-50/20 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{studentName}</p>
                          {serial && (
                            <p className="text-xs text-slate-400 font-mono">{serial}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="text-xs font-semibold text-slate-800">{className}</p>
                        {subject && <p className="text-[11px] text-slate-400">{subject}</p>}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium bg-slate-50">
                          {p.month}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-bold text-slate-800">
                          LKR {Number(p.amount || 0).toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color} ${status.border}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-slate-400">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-base font-semibold text-slate-700">No payment records yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Fee collections marked in classes will appear here automatically.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
