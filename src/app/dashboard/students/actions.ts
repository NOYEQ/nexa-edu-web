'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type StudentActionResponse = {
  success?: boolean
  error?: string
  data?: any
}

export async function createStudent(formData: FormData): Promise<StudentActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to add a student.' }
    }

    const firstName = (formData.get('first_name') as string)?.trim()
    const lastName = (formData.get('last_name') as string)?.trim()
    const phoneNumber = (formData.get('phone_number') as string)?.trim() || null
    const parentName = (formData.get('parent_name') as string)?.trim() || null
    const parentPhone = (formData.get('parent_phone') as string)?.trim() || null
    const school = (formData.get('school') as string)?.trim() || null
    const initialClassId = (formData.get('initial_class_id') as string)?.trim() || null

    if (!firstName || !lastName) {
      return { error: 'First name and last name are required.' }
    }

    // Determine user profile and institution
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, institution_id')
      .eq('id', user.id)
      .maybeSingle()

    let institutionId: string | null = profile?.institution_id || null

    if ((profile?.role === 'institution' || !institutionId) && profile?.role !== 'solo_teacher') {
      const { data: inst } = await supabase
        .from('institutions')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (inst) institutionId = inst.id
    }

    // Auto-generate serial if trigger is not present
    const randomSerial = 'NEXA-' + Math.floor(10000 + Math.random() * 90000)

    const insertPayload: Record<string, any> = {
      teacher_id: user.id,
      institution_id: institutionId,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      parent_name: parentName,
      parent_phone: parentPhone,
      school,
      serial_no: randomSerial,
    }

    const { data: newStudent, error } = await supabase
      .from('students')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      return { error: error.message }
    }

    // If initial class is selected, enroll right away
    if (initialClassId && initialClassId !== 'none' && newStudent?.id) {
      await supabase.from('class_students').insert({
        class_id: initialClassId,
        student_id: newStudent.id,
        teacher_id: user.id,
      })
    }

    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard')
    return { success: true, data: newStudent }
  } catch (err: any) {
    console.error('Exception creating student:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function updateStudent(formData: FormData): Promise<StudentActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to update a student.' }
    }

    const id = formData.get('id') as string
    if (!id) return { error: 'Student ID is required.' }

    const firstName = (formData.get('first_name') as string)?.trim()
    const lastName = (formData.get('last_name') as string)?.trim()
    const phoneNumber = (formData.get('phone_number') as string)?.trim() || null
    const parentName = (formData.get('parent_name') as string)?.trim() || null
    const parentPhone = (formData.get('parent_phone') as string)?.trim() || null
    const school = (formData.get('school') as string)?.trim() || null

    if (!firstName || !lastName) {
      return { error: 'First name and last name are required.' }
    }

    const { error } = await supabase
      .from('students')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        parent_name: parentName,
        parent_phone: parentPhone,
        school,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard/students')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function deleteStudent(studentId: string): Promise<StudentActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to delete a student.' }
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/classes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}
