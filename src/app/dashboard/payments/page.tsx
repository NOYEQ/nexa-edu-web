import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard } from 'lucide-react'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      month,
      status,
      created_at,
      class_id,
      student_id,
      classes ( name, subject ),
      users!student_id ( first_name, last_name )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const total = payments?.length ?? 0
  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0

  const statusConfig: Record<string, { label: string; color: string }> = {
    paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700' },
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700' },
    unpaid: { label: 'Unpaid', color: 'bg-red-50 text-red-600' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Track fees and revenue across all classes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <CreditCard className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-slate-700">LKR {totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">Payment Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600">Student</TableHead>
                <TableHead className="font-semibold text-slate-600">Class</TableHead>
                <TableHead className="font-semibold text-slate-600">Month</TableHead>
                <TableHead className="font-semibold text-slate-600">Amount</TableHead>
                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                <TableHead className="font-semibold text-slate-600">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments && payments.length > 0 ? payments.map((payment) => {
                const student = payment.users as any
                const cls = payment.classes as any
                const studentName = student ? [student.first_name, student.last_name].filter(Boolean).join(' ') : 'Unknown'
                const statusInfo = statusConfig[payment.status] || { label: payment.status, color: 'bg-slate-100 text-slate-600' }
                const date = payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

                return (
                  <TableRow key={payment.id} className="hover:bg-amber-50/20 transition-colors">
                    <TableCell>
                      <span className="font-medium text-slate-800">{studentName}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{cls?.name || '—'}</p>
                        <p className="text-xs text-slate-400">{cls?.subject || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{payment.month || '—'}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-800">LKR {payment.amount?.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusInfo.color} border-0 text-xs`}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{date}</TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <CreditCard className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>No payment records found</p>
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
