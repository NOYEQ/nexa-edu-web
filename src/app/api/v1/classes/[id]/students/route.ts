import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/v1/classes/[id]/students
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const students = (data || []).map((row: any) => ({
      enrollmentId: row.id,
      enrolledDate: row.enrolled_date,
      ...row.student,
      fullName: row.student ? `${row.student.first_name || ''} ${row.student.last_name || ''}`.trim() : 'Unknown',
    }))

    return NextResponse.json({ classId, students, count: students.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/classes/[id]/students - Enroll student
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { student_id } = body

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Student is already enrolled in this class' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id,
        teacher_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, enrollment: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/v1/classes/[id]/students - Unenroll student
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: 'student_id query param is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Student unenrolled successfully' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
