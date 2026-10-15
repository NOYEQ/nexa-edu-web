import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GraduationCap } from 'lucide-react'

export default async function TeachersPage() {
  const supabase = await createClient()

  const { data: teachers } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      email,
      role,
      created_at,
      classes_as_teacher: classes!teacher_id ( id, name ),
      classes_as_assigned: classes!assigned_teacher_id ( id, name, institutions ( name ) )
    `)
    .in('role', ['teacher', 'institution_teacher', 'solo_teacher'])
    .order('created_at', { ascending: false })

  const total = teachers?.length ?? 0

  const roleConfig: Record<string, { label: string; color: string }> = {
    teacher: { label: 'Solo Teacher', color: 'bg-emerald-50 text-emerald-700' },
    solo_teacher: { label: 'Solo Teacher', color: 'bg-emerald-50 text-emerald-700' },
    institution_teacher: { label: 'Institute Teacher', color: 'bg-blue-50 text-blue-700' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teachers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all teachers and their assignments</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <GraduationCap className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-slate-700">{total} Teachers</span>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">All Teachers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600">Teacher</TableHead>
                <TableHead className="font-semibold text-slate-600">Email</TableHead>
                <TableHead className="font-semibold text-slate-600">Role</TableHead>
                <TableHead className="font-semibold text-slate-600">Individual Classes</TableHead>
                <TableHead className="font-semibold text-slate-600">Institute Classes</TableHead>
                <TableHead className="font-semibold text-slate-600">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers && teachers.length > 0 ? teachers.map((teacher) => {
                const fullName = [teacher.first_name, teacher.last_name].filter(Boolean).join(' ') || 'Unknown'
                const initials = `${(teacher.first_name || '')[0] || ''}${(teacher.last_name || '')[0] || ''}`.toUpperCase() || 'T'
                const roleInfo = roleConfig[teacher.role] || { label: teacher.role, color: 'bg-slate-100 text-slate-600' }
                const joinDate = teacher.created_at ? new Date(teacher.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
                const soloClasses = (teacher.classes_as_teacher as any[])?.length ?? 0
                const instituteClasses = (teacher.classes_as_assigned as any[])?.length ?? 0

                return (
                  <TableRow key={teacher.id} className="hover:bg-emerald-50/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {initials}
                        </div>
                        <span className="font-medium text-slate-800">{fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{teacher.email || '—'}</TableCell>
                    <TableCell>
                      <Badge className={`${roleInfo.color} border-0 text-xs`}>{roleInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${soloClasses > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                        {soloClasses} class{soloClasses !== 1 ? 'es' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${instituteClasses > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                        {instituteClasses} class{instituteClasses !== 1 ? 'es' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{joinDate}</TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <GraduationCap className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>No teachers found</p>
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
