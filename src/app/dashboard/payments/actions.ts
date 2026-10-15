'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PaymentStatus = 'paid' | 'pending' | 'unpaid'

export interface CreatePaymentResponse {
  success?: boolean
  error?: string
  payment?: any
}

export async function createPayment(formData: FormData): Promise<CreatePaymentResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Authentication required to record payments.' }
    }

    const studentId = (formData.get('student_id') as string)?.trim()
    const classId = (formData.get('class_id') as string)?.trim()
    const amountRaw = formData.get('amount') as string
    const month = (formData.get('month') as string)?.trim()
    const paymentDate = (formData.get('payment_date') as string)?.trim() || new Date().toISOString().split('T')[0]
    const status = ((formData.get('status') as string)?.trim().toLowerCase() as PaymentStatus) || 'paid'

    if (!studentId || !classId || !amountRaw || !month) {
      return { error: 'Please select student, class, billing month, and amount.' }
    }

    const amount = parseFloat(amountRaw)
    if (isNaN(amount) || amount <= 0) {
      return { error: 'Please enter a valid payment amount.' }
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        teacher_id: user.id,
        class_id: classId,
        student_id: studentId,
        amount,
        month,
        payment_date: paymentDate,
        status,
      })
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
      .single()

    if (error) {
      console.error('Error recording payment:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/payments')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/admin/reports')
    return { success: true, payment: data }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/payments')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deletePayment(
  paymentId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/payments')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
