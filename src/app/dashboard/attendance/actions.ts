'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AttendanceStatus = 'present' | 'absent' | 'late'

export async function markStudentAttendance(
  classId: string,
  studentId: string,
  date: string,
  status: AttendanceStatus
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Authentication required' }
    }

    const { error } = await supabase
      .from('attendance')
      .upsert(
        {
          teacher_id: user.id,
          class_id: classId,
          student_id: studentId,
          date,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'class_id,student_id,date' }
      )

    if (error) {
      console.error('Error recording attendance:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Unexpected error saving attendance' }
  }
}

export async function markAllPresent(
  classId: string,
  studentIds: string[],
  date: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Authentication required' }
    }

    if (!studentIds.length) {
      return { error: 'No students enrolled in this class' }
    }

    const rows = studentIds.map(studentId => ({
      teacher_id: user.id,
      class_id: classId,
      student_id: studentId,
      date,
      status: 'present',
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'class_id,student_id,date' })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function fetchAttendanceForDate(
  classId: string,
  date: string
): Promise<{ data?: Record<string, AttendanceStatus>; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', classId)
      .eq('date', date)

    if (error) {
      return { error: error.message }
    }

    const records: Record<string, AttendanceStatus> = {}
    for (const row of data || []) {
      records[row.student_id] = row.status as AttendanceStatus
    }

    return { data: records }
  } catch (err: any) {
    return { error: err.message }
  }
}
