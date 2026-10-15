import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/v1/classes - List all classes
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, institution_id')
      .eq('id', user.id)
      .single()

    let query = supabase
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
                class_students ( id )
      `)
      .order('created_at', { ascending: false })

    const { data: classes, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const formatted = (classes || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      scheduleDay: c.schedule_day,
      scheduleTime: c.schedule_time,
      fee: c.fee,
      feeType: c.fee_type || 'monthly',
      institutionId: c.institution_id,
      institutionName: c.institutions?.name || null,
      assignedTeacherId: c.assigned_teacher_id,
      assignedTeacherName: null,
      enrolledCount: c.class_students?.length ?? 0,
      createdAt: c.created_at,
    }))

    return NextResponse.json({ classes: formatted, total: formatted.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/classes - Create a class
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      subject,
      grade,
      schedule_day,
      schedule_time,
      fee,
      fee_type = 'monthly',
      assigned_teacher_id = null,
    } = body

    if (!name || !subject || !grade || !schedule_day || !schedule_time) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject, grade, schedule_day, schedule_time' },
        { status: 400 }
      )
    }

    // Determine institution ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, institution_id')
      .eq('id', user.id)
      .single()

    let institutionId: string | null = profile?.institution_id || null
    if ((profile?.role === 'institution' || !institutionId) && profile?.role !== 'solo_teacher') {
      const { data: inst } = await supabase
        .from('institutions')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (inst) institutionId = inst.id
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: user.id,
        name,
        subject,
        grade,
        schedule_day,
        schedule_time,
        fee: parseFloat(fee) || 0,
        fee_type,
        institution_id: institutionId,
        assigned_teacher_id: assigned_teacher_id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, class: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
