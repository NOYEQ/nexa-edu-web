'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export type TeacherActionResponse = {
  success?: boolean
  error?: string
  credentials?: {
    name: string
    email: string
    password: string
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

    // Default password format: name + year (matching Flutter mobile app)
    const tempPassword = customPassword && customPassword.length >= 6
      ? customPassword
      : `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}${new Date().getFullYear()}`

    const fullName = `${firstName} ${lastName}`.trim()

    // 1. Create non-session Supabase client so admin is NOT logged out
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

    // 2. Sign up the new teacher account
    const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name: fullName,
          role: 'institution_teacher',
        },
      },
    })

    if (signUpError || !signUpData.user) {
      console.error('Error signing up teacher:', signUpError)
      return { error: signUpError?.message || 'Failed to create teacher user account.' }
    }

    const newTeacherId = signUpData.user.id

    // 3. Assign teacher to institution using RPC or direct profile update
    const { error: rpcError } = await supabase.rpc('assign_teacher_to_institution', {
      new_teacher_id: newTeacherId,
      target_institution_id: institutionId,
    })

    if (rpcError) {
      console.warn('RPC assign_teacher_to_institution warning, falling back to direct update:', rpcError.message)
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          role: 'institution_teacher',
          institution_id: institutionId,
        })
        .eq('id', newTeacherId)
    } else {
      // Ensure full_name is set
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', newTeacherId)
    }

    // 4. If initial class was selected, assign the teacher to it
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
