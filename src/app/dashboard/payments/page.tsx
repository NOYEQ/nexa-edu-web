import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaymentsClient from './payments-client'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
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

  // 2. Fetch payments
  const { data: paymentsData, error } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      month,
      status,
      payment_date,
      created_at,
      class_id,
      student_id,
      classes:classes!class_id ( id, name, subject ),
      student:students!student_id ( id, first_name, last_name, serial_no, phone_number )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // 3. Fetch students for payment dropdown
  let studentsQuery = supabase
    .from('students')
    .select('id, first_name, last_name, serial_no, phone_number')
    .order('first_name', { ascending: true })

  if (!isSuperAdmin) {
    if (isInstitution && institutionId) {
      studentsQuery = studentsQuery.eq('institution_id', institutionId)
    } else {
      studentsQuery = studentsQuery.eq('teacher_id', user.id)
    }
  }

  const { data: studentsData } = await studentsQuery

  const students = (studentsData || []).map((s: any) => ({
    id: s.id,
    fullName: (s.first_name + ' ' + (s.last_name || '')).trim(),
    serialNo: s.serial_no || 'NEXA-STUDENT',
    phoneNumber: s.phone_number || undefined,
  }))

  // 4. Fetch classes for payment dropdown
  let classesQuery = supabase
    .from('classes')
    .select('id, name, subject, fee')
    .order('name', { ascending: true })

  if (!isSuperAdmin) {
    if (isInstitution && institutionId) {
      classesQuery = classesQuery.eq('institution_id', institutionId)
    } else {
      classesQuery = classesQuery.eq('teacher_id', user.id)
    }
  }

  const { data: classesData } = await classesQuery

  const classes = (classesData || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    subject: c.subject || '',
    fee: Number(c.fee) || 0,
  }))

  // 5. Institution name if available
  let institutionName = 'Nexa-Edu Tuition Center'
  if (institutionId) {
    const { data: inst } = await supabase
      .from('institutions')
      .select('name')
      .eq('id', institutionId)
      .maybeSingle()
    if (inst?.name) institutionName = inst.name
  }

  const formattedPayments = (paymentsData || []).map((p: any) => ({
    id: p.id,
    amount: Number(p.amount) || 0,
    month: p.month,
    status: p.status,
    payment_date: p.payment_date,
    created_at: p.created_at,
    class_id: p.class_id,
    student_id: p.student_id,
    classes: Array.isArray(p.classes) ? p.classes[0] : p.classes,
    student: Array.isArray(p.student) ? p.student[0] : p.student,
  }))

  return (
    <PaymentsClient
      initialPayments={formattedPayments}
      students={students}
      classes={classes}
      institutionName={institutionName}
    />
  )
}
