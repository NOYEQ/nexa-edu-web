import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Search } from 'lucide-react'

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: students, error } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      email,
      created_at,
      class_students (
        id,
        classes ( name )
      )
    `)
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  const total = students?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all students across your institution</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Users className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700">{total} Students</span>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800">All Students</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-600">Name</TableHead>
                <TableHead className="font-semibold text-slate-600">Email</TableHead>
                <TableHead className="font-semibold text-slate-600">Enrolled Classes</TableHead>
                <TableHead className="font-semibold text-slate-600">Joined</TableHead>
                <TableHead className="font-semibold text-slate-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students && students.length > 0 ? students.map((student) => {
                const enrolledCount = student.class_students?.length ?? 0
                const initials = `${(student.first_name || '')[0] || ''}${(student.last_name || '')[0] || ''}`.toUpperCase() || 'S'
                const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Unknown'
                const joinDate = student.created_at ? new Date(student.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

                return (
                  <TableRow key={student.id} className="hover:bg-blue-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {initials}
                        </div>
                        <span className="font-medium text-slate-800">{fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{student.email || '—'}</TableCell>
                    <TableCell>
                      {enrolledCount > 0 ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                          {enrolledCount} class{enrolledCount !== 1 ? 'es' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{joinDate}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-50 text-emerald-700 border-0 shadow-none">
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>No students found</p>
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
