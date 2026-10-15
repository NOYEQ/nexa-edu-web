import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpen, Clock, DollarSign } from 'lucide-react'

export default async function ClassesPage() {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      subject,
      grade,
      schedule_day,
      schedule_time,
      fee,
      fee_type,
      institution_id,
      institutions ( name ),
      class_students ( id )
    `)
    .order('created_at', { ascending: false })

  const total = classes?.length ?? 0

  const dayColors: Record<string, string> = {
    Monday: 'bg-blue-50 text-blue-700',
    Tuesday: 'bg-violet-50 text-violet-700',
    Wednesday: 'bg-emerald-50 text-emerald-700',
    Thursday: 'bg-amber-50 text-amber-700',
    Friday: 'bg-orange-50 text-orange-700',
    Saturday: 'bg-rose-50 text-rose-700',
    Sunday: 'bg-pink-50 text-pink-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Classes</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all classes and schedules</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <BookOpen className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-slate-700">{total} Classes</span>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">All Classes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600">Class</TableHead>
                <TableHead className="font-semibold text-slate-600">Grade</TableHead>
                <TableHead className="font-semibold text-slate-600">Schedule</TableHead>
                <TableHead className="font-semibold text-slate-600">Students</TableHead>
                <TableHead className="font-semibold text-slate-600">Fee</TableHead>
                <TableHead className="font-semibold text-slate-600">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes && classes.length > 0 ? classes.map((cls) => {
                const studentCount = cls.class_students?.length ?? 0
                const dayColorClass = dayColors[cls.schedule_day] || 'bg-slate-50 text-slate-600'
                const isInstitution = cls.institution_id !== null
                const instName = (cls.institutions as any)?.name

                return (
                  <TableRow key={cls.id} className="hover:bg-violet-50/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{cls.name}</p>
                          <p className="text-xs text-slate-400">{cls.subject}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-medium">{cls.grade}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={`${dayColorClass} border-0 text-xs w-fit`}>{cls.schedule_day}</Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />{cls.schedule_time}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                        <span>{studentCount}</span>
                        <span className="text-slate-400 text-xs">students</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                        <span>LKR {cls.fee.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">/ {cls.fee_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isInstitution ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-xs">
                          {instName || 'Institute'}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">
                          Individual
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>No classes found</p>
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
