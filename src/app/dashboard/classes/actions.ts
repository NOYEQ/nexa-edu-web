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
      assigned_teacher_id: assignedTeacherId && assignedTeacherId !== 'none' ? assignedTeacherId : null,
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
