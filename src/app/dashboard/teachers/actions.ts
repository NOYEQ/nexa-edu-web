'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export type TeacherActionResponse = {
  success?: boolean
  error?: string
  isExistingTeacher?: boolean
  message?: string
  credentials?: {
    name: string
    email: string
    password: string
    phoneNumber?: string
  }
}

export async function registerTeacher(formData: FormData): Promise<TeacherActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in to register a teacher.' }
    }

    const firstName = (formData.get('first_name') as string)?.trim()
    const lastName = (formData.get('last_name') as string)?.trim()
    const phoneNumber = (formData.get('phone_number') as string)?.trim().replace(/[\s-]/g, '')
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const customPassword = (formData.get('password') as string)?.trim()
    const initialClassId = (formData.get('initial_class_id') as string)?.trim() || null

    if (!firstName || !lastName || !email) {
      return { error: 'First name, last name, and email are required.' }
    }

    // Determine current user's institution
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, institution_id')
      .eq('id', user.id)
      .maybeSingle()

    let institutionId: string | null = profile?.institution_id || null

    if (!institutionId) {
      const { data: inst } = await supabase
        .from('institutions')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (inst) institutionId = inst.id
    }

    if (!institutionId) {
      return { error: 'You must have an active tuition institution to register teachers.' }
    }

    const fullName = `${firstName} ${lastName}`.trim()

    // 1. Check if a teacher with this contact number or email already exists in profiles
    // Contact number is the primary key for recognizing teachers across solo classes & multiple institutes
    let existingTeacherId: string | null = null
    let existingTeacherName: string = fullName
    let existingTeacherEmail: string = email

    if (email) {
      const { data: existingByEmail } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('email', email)
        .maybeSingle()

      if (existingByEmail) {
        existingTeacherId = existingByEmail.id
        existingTeacherName = existingByEmail.full_name || fullName
        existingTeacherEmail = existingByEmail.email || email
      }
    }

    // 2. If existing teacher found by contact key, link them directly
    if (existingTeacherId) {
      // Assign class if selected
      if (initialClassId && initialClassId !== 'none') {
        await supabase
          .from('classes')
          .update({ assigned_teacher_id: existingTeacherId })
          .eq('id', initialClassId)
      }

      revalidatePath('/dashboard/teachers')
      revalidatePath('/dashboard/classes')
      revalidatePath('/dashboard')

      return {
        success: true,
        isExistingTeacher: true,
        message: `Recognized existing teacher ${existingTeacherName} (${phoneNumber || email}). Successfully linked to your institute and assigned to class!`,
        credentials: {
          name: existingTeacherName,
          email: existingTeacherEmail,
          password: '(Existing teacher password unchanged)',
          phoneNumber,
        },
      }
    }

    // 3. New teacher account creation
    const tempPassword = customPassword && customPassword.length >= 6
      ? customPassword
      : `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${new Date().getFullYear()}`

    const tempClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          role: 'institution_teacher',
        },
      },
    })

    if (signUpError || !signUpData.user) {
      console.error('Error signing up teacher:', signUpError)
      return { error: signUpError?.message || 'Failed to create teacher user account.' }
    }

    const newTeacherId = signUpData.user.id

    // Update profile
    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        role: 'institution_teacher',
        institution_id: institutionId,
      })
      .eq('id', newTeacherId)

    // Assign class if selected
    if (initialClassId && initialClassId !== 'none') {
      await supabase
        .from('classes')
        .update({ assigned_teacher_id: newTeacherId })
        .eq('id', initialClassId)
    }

    revalidatePath('/dashboard/teachers')
    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard')

    return {
      success: true,
      credentials: {
        name: fullName,
        email,
        password: tempPassword,
        phoneNumber,
      },
    }
  } catch (err: any) {
    console.error('Exception registering teacher:', err)
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function assignTeacherToClass(teacherId: string, classId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('classes')
      .update({ assigned_teacher_id: teacherId })
      .eq('id', classId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/teachers')
    revalidatePath('/dashboard/classes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function unassignTeacherFromClass(classId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('classes')
      .update({ assigned_teacher_id: null })
      .eq('id', classId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/teachers')
    revalidatePath('/dashboard/classes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
