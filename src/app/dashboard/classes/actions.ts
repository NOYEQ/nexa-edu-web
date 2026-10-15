'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResponse = {
  success?: boolean
  error?: string
  data?: any
}

export async function createClass(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to perform this action.' }
    }

    const name = (formData.get('name') as string)?.trim()
    const subject = (formData.get('subject') as string)?.trim()
    const grade = (formData.get('grade') as string)?.trim()
    const scheduleDay = (formData.get('schedule_day') as string)?.trim()
    const scheduleTime = (formData.get('schedule_time') as string)?.trim()
    const feeRaw = formData.get('fee') as string
    const fee = parseFloat(feeRaw) || 0
    const feeType = (formData.get('fee_type') as string)?.trim() || 'monthly'
    const assignedTeacherId = (formData.get('assigned_teacher_id') as string)?.trim() || null

    if (!name || !subject || !grade || !scheduleDay || !scheduleTime) {
      return { error: 'Please fill in all required fields (Name, Subject, Grade, Day, Time).' }
    }

    // Get user profile to determine institution status
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, institution_id')
      .eq('id', user.id)
      .single()

    let institutionId: string | null = profile?.institution_id || null

    // If institution role, check institutions table if institution_id is missing on profile
    if ((profile?.role === 'institution' || !institutionId) && profile?.role !== 'solo_teacher') {
      const { data: inst } = await supabase
        .from('institutions')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (inst) {
        institutionId = inst.id
      }
    }

    // If solo_teacher, institution_id is explicitly null
    if (profile?.role === 'solo_teacher') {
      institutionId = null
    }

    const insertPayload: Record<string, any> = {
      teacher_id: user.id,
      name,
      subject,
      grade,
      schedule_day: scheduleDay,
      schedule_time: scheduleTime,
      fee,
      fee_type: feeType,
      institution_id: institutionId,
      assigned_teacher_id: assignedTeacherId && assignedTeacherId !== 'none' ? assignedTeacherId : user.id,
    }

    const { data, error } = await supabase
      .from('classes')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    console.error('Unexpected error creating class:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function updateClass(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to perform this action.' }
    }

    const id = formData.get('id') as string
    if (!id) {
      return { error: 'Class ID is required for update.' }
    }

    const name = (formData.get('name') as string)?.trim()
    const subject = (formData.get('subject') as string)?.trim()
    const grade = (formData.get('grade') as string)?.trim()
    const scheduleDay = (formData.get('schedule_day') as string)?.trim()
    const scheduleTime = (formData.get('schedule_time') as string)?.trim()
    const feeRaw = formData.get('fee') as string
    const fee = parseFloat(feeRaw) || 0
    const feeType = (formData.get('fee_type') as string)?.trim() || 'monthly'
    const assignedTeacherId = (formData.get('assigned_teacher_id') as string)?.trim() || null

    if (!name || !subject || !grade || !scheduleDay || !scheduleTime) {
      return { error: 'Please fill in all required fields.' }
    }

    const updatePayload: Record<string, any> = {
      name,
      subject,
      grade,
      schedule_day: scheduleDay,
      schedule_time: scheduleTime,
      fee,
      fee_type: feeType,
      assigned_teacher_id: assignedTeacherId && assignedTeacherId !== 'none' ? assignedTeacherId : null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('classes')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      console.error('Error updating class:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error updating class:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function deleteClass(classId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to perform this action.' }
    }

    if (!classId) {
      return { error: 'Class ID is required.' }
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (error) {
      console.error('Error deleting class:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error deleting class:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function enrollStudentInClass(classId: string, studentId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to perform this action.' }
    }

    if (!classId || !studentId) {
      return { error: 'Class ID and Student ID are required.' }
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existing) {
      return { error: 'Student is already enrolled in this class.' }
    }

    const { error } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: studentId,
        teacher_id: user.id,
      })

    if (error) {
      console.error('Error enrolling student:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard/students')
    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error enrolling student:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function unenrollStudentFromClass(classId: string, studentId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to perform this action.' }
    }

    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId)

    if (error) {
      console.error('Error unenrolling student:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard/students')
    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error unenrolling student:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function getClassStudents(classId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('class_students')
      .select(`
        id,
        enrolled_date,
        student:students (
          id,
          first_name,
          last_name,
          phone_number,
          parent_name,
          parent_phone,
          school,
          serial_no
        )
      `)
      .eq('class_id', classId)

    if (error) {
      console.error('Error getting class students:', error)
      return { error: error.message, students: [] }
    }

    const students = (data || []).map((row: any) => ({
      enrollmentId: row.id,
      enrolledDate: row.enrolled_date,
      ...row.student,
      fullName: row.student ? `${row.student.first_name || ''} ${row.student.last_name || ''}`.trim() : 'Unknown',
    }))

    return { students }
  } catch (err: any) {
    return { error: err.message, students: [] }
  }
}

// -------------------------------------------------------------
// STUDENT PHONE LOOKUP & INSTANT ENROLLMENT
// -------------------------------------------------------------

export async function lookupStudentByPhone(phoneNumber: string): Promise<{
  found: boolean
  student?: {
    id: string
    first_name: string
    last_name: string
    fullName: string
    phone_number: string
    parent_name: string
    parent_phone: string
    school: string
    serial_no: string
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '')
    if (!cleanPhone || cleanPhone.length < 7) {
      return { found: false }
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, phone_number, parent_name, parent_phone, school, serial_no')
      .eq('phone_number', cleanPhone)
      .maybeSingle()

    if (error || !data) {
      return { found: false }
    }

    return {
      found: true,
      student: {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name || '',
        fullName: `${data.first_name} ${data.last_name || ''}`.trim(),
        phone_number: data.phone_number,
        parent_name: data.parent_name || '',
        parent_phone: data.parent_phone || '',
        school: data.school || '',
        serial_no: data.serial_no || 'NEXA-STUDENT',
      },
    }
  } catch (err: any) {
    return { found: false, error: err.message }
  }
}

export async function enrollOrRegisterStudentInClass(payload: {
  classId: string
  phoneNumber: string
  existingStudentId?: string | null
  firstName?: string
  lastName?: string
  school?: string
  parentName?: string
  parentPhone?: string
}): Promise<{ success?: boolean; error?: string; isNew?: boolean; student?: any }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication required' }

    const { classId, phoneNumber, existingStudentId } = payload
    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '')

    let targetStudentId = existingStudentId

    // Double-check lookup by phone if no existingStudentId passed
    if (!targetStudentId) {
      const { data: existingByPhone } = await supabase
        .from('students')
        .select('id')
        .eq('phone_number', cleanPhone)
        .maybeSingle()

      if (existingByPhone) {
        targetStudentId = existingByPhone.id
      }
    }

    // If new student, insert record into students
    if (!targetStudentId) {
      if (!payload.firstName?.trim()) {
        return { error: 'First name is required to register a new student.' }
      }

      // Fetch class to see if it belongs to an institution
      const { data: classObj } = await supabase
        .from('classes')
        .select('institution_id')
        .eq('id', classId)
        .maybeSingle()

      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert({
          teacher_id: user.id,
          institution_id: classObj?.institution_id || null,
          first_name: payload.firstName.trim(),
          last_name: payload.lastName?.trim() || '',
          phone_number: cleanPhone,
          parent_name: payload.parentName?.trim() || null,
          parent_phone: payload.parentPhone?.trim() || null,
          school: payload.school?.trim() || null,
        })
        .select()
        .single()

      if (createError || !newStudent) {
        return { error: createError?.message || 'Failed to create student.' }
      }

      targetStudentId = newStudent.id
    }

    // Check if already enrolled in this class
    const { data: existingEnrollment } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', targetStudentId)
      .maybeSingle()

    if (existingEnrollment) {
      return { error: 'This student is already enrolled in this class.' }
    }

    // Enroll into class_students
    const { error: enrollError } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: targetStudentId,
        teacher_id: user.id,
      })

    if (enrollError) {
      return { error: enrollError.message }
    }

    // Fetch student details for feedback
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id, first_name, last_name, serial_no, phone_number, school')
      .eq('id', targetStudentId)
      .single()

    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/attendance')
    revalidatePath('/dashboard/payments')

    return {
      success: true,
      student: studentRecord,
      isNew: !existingStudentId,
    }
  } catch (err: any) {
    return { error: err.message || 'Unexpected error enrolling student.' }
  }
}

// -------------------------------------------------------------
// CLASS DAYS & ATTENDANCE SUMMARY FOR A CLASS
// -------------------------------------------------------------

export type ClassSessionSummary = {
  date: string
  present: number
  late: number
  absent: number
  total: number
  rate: number
  students: Array<{
    id: string
    name: string
    serialNo: string
    school?: string
    status: 'present' | 'late' | 'absent'
  }>
}

export async function getClassDaysAndAttendance(classId: string): Promise<{
  sessions: ClassSessionSummary[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        student_id,
        student:students (
          id,
          first_name,
          last_name,
          serial_no,
          school
        )
      `)
      .eq('class_id', classId)
      .order('date', { ascending: false })

    if (error) {
      return { error: error.message, sessions: [] }
    }

    const sessionsMap: Record<string, ClassSessionSummary> = {}

    for (const row of data || []) {
      const date = row.date
      if (!sessionsMap[date]) {
        sessionsMap[date] = {
          date,
          present: 0,
          late: 0,
          absent: 0,
          total: 0,
          rate: 0,
          students: [],
        }
      }

      const st = row.status as 'present' | 'late' | 'absent'
      if (st === 'present') sessionsMap[date].present++
      else if (st === 'late') sessionsMap[date].late++
      else if (st === 'absent') sessionsMap[date].absent++

      sessionsMap[date].total++

      const s = Array.isArray(row.student) ? row.student[0] : row.student
      sessionsMap[date].students.push({
        id: row.student_id,
        name: s ? `${s.first_name || ''} ${s.last_name || ''}`.trim() : 'Student',
        serialNo: s?.serial_no || 'NEXA-STUDENT',
        school: s?.school || undefined,
        status: st,
      })
    }

    const sessions = Object.values(sessionsMap).map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0,
    }))

    return { sessions }
  } catch (err: any) {
    return { error: err.message, sessions: [] }
  }
}
