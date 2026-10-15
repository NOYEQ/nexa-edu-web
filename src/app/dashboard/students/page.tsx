import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentsClient from './students-client'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
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

  const isInstitution = profile?.role === 'institution'
  let institutionId = profile?.institution_id || null

  if (isInstitution && !institutionId) {
    const { data: inst } = await supabase
      .from('institutions')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (inst) institutionId = inst.id
  }

  // 2. Fetch students query
  let query = supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      phone_number,
      parent_name,
      parent_phone,
      school,
      serial_no,
      created_at,
      class_students (
        id,
        classes (
          id,
          name,
          subject,
          grade
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (isInstitution && institutionId) {
    query = query.eq('institution_id', institutionId)
  } else {
    query = query.eq('teacher_id', user.id)
  }

  const { data: studentsData, error: studentsError } = await query
  if (studentsError) {
    console.error('Error fetching students:', studentsError)
  }

  // 3. Fetch classes list for the initial enrollment dropdown
  const { data: classesData } = await supabase
    .from('classes')
    .select('id, name, subject, grade')
    .order('name', { ascending: true })

  const classes = (classesData || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    grade: c.grade,
  }))

  const initialStudents = (studentsData || []).map((s: any) => ({
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    phone_number: s.phone_number,
    parent_name: s.parent_name,
    parent_phone: s.parent_phone,
    school: s.school,
    serial_no: s.serial_no,
    created_at: s.created_at,
    class_students: s.class_students || [],
  }))

  return <StudentsClient initialStudents={initialStudents} classes={classes} />
}
