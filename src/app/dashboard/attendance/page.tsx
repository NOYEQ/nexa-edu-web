import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceClient, { ClassItem, StudentItem } from './attendance-client'
import { AttendanceStatus } from './actions'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
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

  // 2. Query classes
  let classesQuery = supabase
    .from('classes')
    .select('id, name, subject, grade')
    .order('name', { ascending: true })

  if (isSuperAdmin) {
    // all classes
  } else if (isInstitution && institutionId) {
    classesQuery = classesQuery.eq('institution_id', institutionId)
  } else {
    // Teacher: solo classes or assigned classes
    classesQuery = classesQuery.or(
      `assigned_teacher_id.eq.${user.id},and(teacher_id.eq.${user.id},institution_id.is.null)`
    )
  }

  const { data: classesData, error: classesError } = await classesQuery

  if (classesError) {
    console.error('Error fetching classes for attendance:', classesError)
  }

  const classes: ClassItem[] = (classesData || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    subject: c.subject || '',
    grade: c.grade || '',
  }))

  const initialClassId = classes[0]?.id || ''
  const initialDate = new Date().toISOString().split('T')[0]

  // 3. Fetch enrollments for all relevant classes
  const classIds = classes.map(c => c.id)
  const studentsByClass: Record<string, StudentItem[]> = {}

  for (const c of classes) {
    studentsByClass[c.id] = []
  }

  if (classIds.length > 0) {
    const { data: enrollmentData, error: enrollError } = await supabase
      .from('class_students')
      .select(`
        class_id,
        student:students (
          id,
          first_name,
          last_name,
          serial_no,
          phone_number,
          school
        )
      `)
      .in('class_id', classIds)

    if (enrollError) {
      console.error('Error fetching enrollments for attendance:', enrollError)
    } else {
      for (const row of enrollmentData || []) {
        const s = Array.isArray(row.student) ? row.student[0] : row.student
        if (s && row.class_id && studentsByClass[row.class_id]) {
          studentsByClass[row.class_id].push({
            id: s.id,
            fullName: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            serialNo: s.serial_no || 'NEXA-STUDENT',
            phoneNumber: s.phone_number || undefined,
            school: s.school || undefined,
          })
        }
      }
    }
  }

  // 4. Fetch initial attendance for today's date & first class
  let initialAttendance: Record<string, AttendanceStatus> = {}
  if (initialClassId) {
    const { data: attData } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', initialClassId)
      .eq('date', initialDate)

    for (const row of attData || []) {
      initialAttendance[row.student_id] = row.status as AttendanceStatus
    }
  }

  // 5. Fetch historical attendance records to calculate rate
  const studentHistoryStats: Record<string, { totalSessions: number; attendedSessions: number }> = {}
  if (initialClassId) {
    const { data: historyData } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', initialClassId)

    for (const row of historyData || []) {
      if (!studentHistoryStats[row.student_id]) {
        studentHistoryStats[row.student_id] = { totalSessions: 0, attendedSessions: 0 }
      }
      studentHistoryStats[row.student_id].totalSessions += 1
      if (row.status === 'present' || row.status === 'late') {
        studentHistoryStats[row.student_id].attendedSessions += 1
      }
    }
  }

  return (
    <AttendanceClient
      classes={classes}
      studentsByClass={studentsByClass}
      initialClassId={initialClassId}
      initialDate={initialDate}
      initialAttendance={initialAttendance}
      studentHistoryStats={studentHistoryStats}
    />
  )
}
