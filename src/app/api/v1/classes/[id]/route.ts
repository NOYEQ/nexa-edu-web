import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/v1/classes/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: cls, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        subject,
        grade,
        schedule_day,
        schedule_time,
        fee,
        fee_type,
        institution_id,
        assigned_teacher_id,
        created_at,
        institutions ( id, name ),
                class_students (
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
        )
      `)
      .eq('id', id)
      .single()

    if (error || !cls) {
      return NextResponse.json({ error: error?.message || 'Class not found' }, { status: 404 })
    }

    const enrolledStudents = (cls.class_students || []).map((cs: any) => ({
      enrollmentId: cs.id,
      enrolledDate: cs.enrolled_date,
      ...cs.student,
      fullName: cs.student ? `${cs.student.first_name || ''} ${cs.student.last_name || ''}`.trim() : 'Unknown',
    }))

    return NextResponse.json({
      class: {
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        grade: cls.grade,
        scheduleDay: cls.schedule_day,
        scheduleTime: cls.schedule_time,
        fee: cls.fee,
        feeType: cls.fee_type,
        institutionId: cls.institution_id,
        institutionName: (cls.institutions as any)?.name || null,
        assignedTeacherId: cls.assigned_teacher_id,
        assignedTeacherName: null,
        enrolledCount: enrolledStudents.length,
        students: enrolledStudents,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/classes/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.grade !== undefined) updateData.grade = body.grade
    if (body.schedule_day !== undefined) updateData.schedule_day = body.schedule_day
    if (body.schedule_time !== undefined) updateData.schedule_time = body.schedule_time
    if (body.fee !== undefined) updateData.fee = parseFloat(body.fee) || 0
    if (body.fee_type !== undefined) updateData.fee_type = body.fee_type
    if (body.assigned_teacher_id !== undefined) {
      updateData.assigned_teacher_id = body.assigned_teacher_id === 'none' ? null : body.assigned_teacher_id
    }

    const { data, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, class: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/v1/classes/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Class deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
