'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  let errorMessage: string | null = null

  try {
    const supabase = await createClient()

    const email = (formData.get('email') as string)?.trim()
    const password = (formData.get('password') as string)?.trim()

    if (!email || !password) {
      redirect('/login?message=Email and password are required.')
    }

    console.log('Attempting login with:', email)

    // Set a race timeout so it doesn't hang indefinitely if Supabase domain is unreachable
    const authPromise = supabase.auth.signInWithPassword({ email, password })
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out. Your Supabase project might be paused.')), 8000)
    )

    const { data, error } = await Promise.race([authPromise, timeoutPromise])

    if (error) {
      console.error('Login Error:', error.message)
      errorMessage = error.message
    }
  } catch (err: any) {
    console.error('Login Exception:', err)
    errorMessage = err.message || 'Could not connect to authentication server.'
  }

  if (errorMessage) {
    redirect(`/login?message=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  let errorMessage: string | null = null

  try {
    const supabase = await createClient()

    const email = (formData.get('email') as string)?.trim()
    const password = (formData.get('password') as string)?.trim()
    const role = (formData.get('role') as string)?.trim() || 'student'
    const fullName = (formData.get('fullName') as string)?.trim() || ''

    if (!email || !password) {
      redirect('/register?message=Email and password are required.')
    }

    const authPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    })
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out. Your Supabase project might be paused.')), 8000)
    )

    const { error } = await Promise.race([authPromise, timeoutPromise])

    if (error) {
      errorMessage = error.message
    }
  } catch (err: any) {
    errorMessage = err.message || 'Could not connect to authentication server.'
  }

  if (errorMessage) {
    redirect(`/register?message=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}
