import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeachersClient from './teachers-client'

export const dynamic = 'force-dynamic'

export default async function TeachersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .maybeSingle()

  const isSuperAdmin = profile?.role === 'super_admin' || user.email === 'admin@nexa.com'
  const isInstitution = profile?.role === 'institution' || isSuperAdmin
  let institutionId = profile?.institution_id || null

  if (isInstitution && !institutionId) {
    const { data: inst } = await supabase
      .from('institutions')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (inst) institutionId = inst.id
  }

  // 2. Fetch teachers
  let teachersQuery = supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .in('role', ['teacher', 'institution_teacher', 'solo_teacher'])
    .order('created_at', { ascending: false })

  if (!isSuperAdmin && isInstitution && institutionId) {
    teachersQuery = teachersQuery.eq('institution_id', institutionId)
  }

  const { data: teachersData, error: teachersError } = await teachersQuery

  if (teachersError) {
    console.error('Error fetching teachers:', teachersError)
  }

  // 3. Fetch classes to map assigned classes
  const { data: classesData } = await supabase
    .from('classes')
    .select('id, name, subject, grade, assigned_teacher_id')

  const classesByTeacher: Record<string, any[]> = {}
  for (const cls of classesData || []) {
    if (cls.assigned_teacher_id) {
      if (!classesByTeacher[cls.assigned_teacher_id]) {
        classesByTeacher[cls.assigned_teacher_id] = []
      }
      classesByTeacher[cls.assigned_teacher_id].push({
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        grade: cls.grade,
      })
    }
  }

  const initialTeachers = (teachersData || []).map((t: any) => ({
    id: t.id,
    full_name: t.full_name,
    role: t.role,
    created_at: t.created_at,
    assigned_classes: classesByTeacher[t.id] || [],
  }))

  const availableClasses = (classesData || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    grade: c.grade,
  }))

  return (
    <TeachersClient
      initialTeachers={initialTeachers}
      availableClasses={availableClasses}
      isInstitution={isInstitution}
    />
  )
}
