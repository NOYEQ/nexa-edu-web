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
    .select('id, role, institution_id, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const isSuperAdmin = profile?.role === 'super_admin' || user.email === 'admin@nexa.com'
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

  // 2. Fetch classes based on user role & multi-institute / solo hierarchy
  let classesQuery = supabase
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
      teacher_id,
      created_at,
      institutions ( id, name ),
      class_students ( id )
    `)
    .order('created_at', { ascending: false })

  if (isSuperAdmin) {
    // Super Admin sees all classes across the platform
  } else if (isInstitution && institutionId) {
    // Institution admin sees all classes under their institution
    classesQuery = classesQuery.eq('institution_id', institutionId)
  } else {
    // Teacher: query solo classes (institution_id IS NULL) OR classes assigned in any registered institution
    classesQuery = classesQuery.or(
      `assigned_teacher_id.eq.${user.id},and(teacher_id.eq.${user.id},institution_id.is.null)`
    )
  }

  const { data: classesData, error: classesError } = await classesQuery

  if (classesError) {
    console.error('Error fetching classes:', classesError)
  }

  // 3. Fetch teachers for institution assignment and mapping names
  let teachers: any[] = []
  const { data: teacherProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['teacher', 'institution_teacher', 'solo_teacher'])

  teachers = (teacherProfiles || []).map((t: any) => ({
    id: t.id,
    full_name: t.full_name || 'Instructor',
  }))

  const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t.full_name]))

  // 4. Fetch students for quick enrollment dropdown
  let studentsQuery = supabase
    .from('students')
    .select('id, first_name, last_name, phone_number, school, serial_no')
    .order('first_name', { ascending: true })

  if (!isSuperAdmin) {
    if (isInstitution && institutionId) {
      studentsQuery = studentsQuery.eq('institution_id', institutionId)
    } else {
      studentsQuery = studentsQuery.eq('teacher_id', user.id)
    }
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

  // Extract distinct registered institutes for the teacher
  const institutesMap = new Map<string, { id: string; name: string }>()
  for (const c of classesData || []) {
    const inst = Array.isArray(c.institutions) ? c.institutions[0] : c.institutions
    if (inst && inst.id && inst.name) {
      institutesMap.set(inst.id, { id: inst.id, name: inst.name })
    }
  }
  const registeredInstitutes = Array.from(institutesMap.values())

  const initialClasses = (classesData || []).map((cls: any) => {
    const inst = Array.isArray(cls.institutions) ? cls.institutions[0] : cls.institutions
    return {
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
      teacher_id: cls.teacher_id,
      institutions: inst,
      assigned_teacher: cls.assigned_teacher_id
        ? { id: cls.assigned_teacher_id, full_name: teacherMap[cls.assigned_teacher_id] || 'Instructor' }
        : null,
      class_students: cls.class_students || [],
    }
  })

  return (
    <ClassManagementClient
      initialClasses={initialClasses}
      teachers={teachers}
      allStudents={allStudents}
      isInstitution={isInstitution || isSuperAdmin}
      userRole={profile?.role || (isSuperAdmin ? 'super_admin' : 'solo_teacher')}
      registeredInstitutes={registeredInstitutes}
    />
  )
}
