import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GraduationCap, BookOpen, Mail, ShieldCheck, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeachersPage() {
  const supabase = await createClient()

  const { data: teachers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      created_at,
      classes_assigned:classes!assigned_teacher_id (
        id,
        name,
        subject,
        grade
      )
    `)
    .in('role', ['teacher', 'institution_teacher', 'solo_teacher'])
    .order('created_at', { ascending: false })

  const total = teachers?.length ?? 0

  const roleConfig: Record<string, { label: string; color: string; border: string }> = {
    teacher: {
      label: 'Solo Instructor',
      color: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
    },
    solo_teacher: {
      label: 'Solo Instructor',
      color: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
    },
    institution_teacher: {
      label: 'Institution Staff',
      color: 'bg-blue-50 text-blue-700',
      border: 'border-blue-200',
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Teaching Faculty</h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs px-2.5 py-0.5 font-semibold">
              {total} Teachers
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Faculty members assigned to tuition classes across your institution.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-xs">
          <GraduationCap className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">{total} Instructors Active</span>
        </div>
      </div>

      {/* Teachers Directory Card */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">
            Instructor Roster
          </CardTitle>
          <span className="text-xs text-slate-400">Assign teachers via Classes & Batches</span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600 text-xs pl-6">Instructor Name</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Role</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Assigned Classes</TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers && teachers.length > 0 ? (
                teachers.map((teacher: any) => {
                  const name = teacher.full_name || 'Instructor'
                  const initials = name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                  const role = roleConfig[teacher.role] || {
                    label: 'Instructor',
                    color: 'bg-slate-50 text-slate-700',
                    border: 'border-slate-200',
                  }
                  const assignedClasses = teacher.classes_assigned || []

                  return (
                    <TableRow key={teacher.id} className="hover:bg-emerald-50/20 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{name}</p>
                            <p className="text-xs text-slate-400 font-mono">ID: {teacher.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${role.color} ${role.border}`}
                        >
                          {role.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {assignedClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {assignedClasses.map((cls: any) => (
                              <Badge
                                key={cls.id}
                                variant="secondary"
                                className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 flex items-center gap-1"
                              >
                                <BookOpen className="h-2.5 w-2.5" />
                                {cls.name} ({cls.subject})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No assigned classes</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <UserCheck className="h-3 w-3" />
                          Active
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center text-slate-400">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-base font-semibold text-slate-700">No instructors registered yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Faculty accounts created in the app will appear here automatically.
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
