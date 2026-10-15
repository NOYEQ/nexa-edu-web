import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClassManagementClient from './class-management-client'

export const dynamic = 'force-dynamic'

export default async function ClassesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

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

  // 2. Fetch classes with relations
  const { data: classesData, error: classesError } = await supabase
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
      assigned_teacher_id,
      created_at,
      institutions ( name ),
      assigned_teacher:profiles!assigned_teacher_id ( id, full_name ),
      class_students ( id )
    `)
    .order('created_at', { ascending: false })

  if (classesError) {
    console.error('Error fetching classes:', classesError)
  }

  // 3. Fetch teachers for institution assignment
  let teachers: any[] = []
  if (isInstitution && institutionId) {
    const { data: teacherProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('institution_id', institutionId)
      .eq('role', 'institution_teacher')

    teachers = (teacherProfiles || []).map((t: any) => ({
      id: t.id,
      full_name: t.full_name || 'Instructor',
    }))
  }

  // 4. Fetch institution or teacher's students for quick enrollment in classes
  let studentsQuery = supabase
    .from('students')
    .select('id, first_name, last_name, phone_number, school, serial_no')
    .order('first_name', { ascending: true })

  if (isInstitution && institutionId) {
    studentsQuery = studentsQuery.eq('institution_id', institutionId)
  } else {
    studentsQuery = studentsQuery.eq('teacher_id', user.id)
  }

  const { data: studentsData } = await studentsQuery

  const allStudents = (studentsData || []).map((s: any) => ({
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    phone_number: s.phone_number,
    school: s.school,
    serial_no: s.serial_no,
  }))

  const initialClasses = (classesData || []).map((cls: any) => ({
    id: cls.id,
    name: cls.name,
    subject: cls.subject,
    grade: cls.grade,
    schedule_day: cls.schedule_day,
    schedule_time: cls.schedule_time,
    fee: cls.fee,
    fee_type: cls.fee_type || 'monthly',
    institution_id: cls.institution_id,
    assigned_teacher_id: cls.assigned_teacher_id,
    institutions: cls.institutions,
    assigned_teacher: cls.assigned_teacher,
    class_students: cls.class_students || [],
  }))

  return (
    <ClassManagementClient
      initialClasses={initialClasses}
      teachers={teachers}
      allStudents={allStudents}
      isInstitution={isInstitution}
    />
  )
}
