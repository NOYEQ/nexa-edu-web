'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TierType = 'free' | 'pro' | 'unlimited'

export interface InstitutionUsage {
  id: string
  name: string
  createdAt: string
  ownerId: string | null
  ownerName: string
  ownerEmail: string
  tier: TierType
  teachersCount: number
  classesCount: number
  maxClasses: number
  studentsCount: number
  maxStudents: number
  feeVolume: number
  utilizationRate: number
  status: 'healthy' | 'warning' | 'exceeded'
}

export interface TeacherUsage {
  id: string
  name: string
  email: string
  role: string
  institutionId: string | null
  institutionName: string
  tier: TierType
  classesCount: number
  maxClasses: number
  studentsCount: number
  maxStudents: number
  feeVolume: number
  utilizationRate: number
  status: 'healthy' | 'warning' | 'exceeded'
}

export interface PlatformAnalytics {
  totalInstitutions: number
  totalTeachers: number
  totalClasses: number
  totalStudents: number
  totalFeeVolume: number
  tierDistribution: {
    free: number
    pro: number
    unlimited: number
  }
  institutions: InstitutionUsage[]
  teachers: TeacherUsage[]
}

const TIER_LIMITS = {
  free: { maxClasses: 1, maxStudents: 5 },
  pro: { maxClasses: 999999, maxStudents: 100 },
  unlimited: { maxClasses: 999999, maxStudents: 999999 },
}

export async function updateInstitutionTier(
  institutionId: string,
  tier: TierType
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication required' }

    // 1. Fetch institution to get owner
    const { data: inst, error: instErr } = await supabase
      .from('institutions')
      .select('id, owner_id')
      .eq('id', institutionId)
      .maybeSingle()

    if (instErr || !inst) {
      return { error: 'Institution not found.' }
    }

    // 2. Update owner's profile subscription tier
    if (inst.owner_id) {
      await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('id', inst.owner_id)
    }

    // 3. Try to update institutions table if column exists
    try {
      await supabase
        .from('institutions')
        .update({ subscription_tier: tier } as any)
        .eq('id', institutionId)
    } catch {
      // Ignore if column doesn't exist yet
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/institutions')
    revalidatePath('/dashboard/admin/reports')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update institution tier' }
  }
}

export async function updateTeacherTier(
  teacherId: string,
  tier: TierType
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication required' }

    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('id', teacherId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/teachers')
    revalidatePath('/dashboard/admin/reports')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update teacher tier' }
  }
}

export async function updateInstitutionDetails(
  institutionId: string,
  name: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('institutions')
      .update({ name: name.trim() })
      .eq('id', institutionId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/institutions')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function createInstitution(
  name: string
): Promise<{ success?: boolean; error?: string; data?: any }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication required' }

    const { data, error } = await supabase
      .from('institutions')
      .insert({
        name: name.trim(),
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/institutions')
    return { success: true, data }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function fetchPlatformData(): Promise<PlatformAnalytics> {
  const supabase = await createClient()

  // 1. Fetch all institutions
  const { data: instData } = await supabase
    .from('institutions')
    .select('id, name, owner_id, created_at')
    .order('created_at', { ascending: false })

  // 2. Fetch all profiles
  const { data: profData } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, institution_id, subscription_tier, created_at')
    .order('created_at', { ascending: false })

  // 3. Fetch all classes
  const { data: classData } = await supabase
    .from('classes')
    .select('id, name, subject, fee, institution_id, assigned_teacher_id')

  // 4. Fetch all students
  const { data: studentData } = await supabase
    .from('students')
    .select('id, institution_id, teacher_id')

  // 5. Fetch class enrollments
  const { data: enrollData } = await supabase
    .from('class_students')
    .select('id, class_id, student_id')

  const institutionsList = instData || []
  const profilesList = profData || []
  const classesList = classData || []
  const studentsList = studentData || []

  // Create lookup maps
  const profileMap = new Map<string, any>()
  profilesList.forEach(p => profileMap.set(p.id, p))

  const instMap = new Map<string, string>()
  institutionsList.forEach(i => instMap.set(i.id, i.name))

  // Tier counter
  const tierDistribution = { free: 0, pro: 0, unlimited: 0 }
  let totalFeeVolume = 0

  // Calculate institutions usage
  const institutionsUsage: InstitutionUsage[] = institutionsList.map(inst => {
    const owner = inst.owner_id ? profileMap.get(inst.owner_id) : null
    const tier: TierType = (owner?.subscription_tier as TierType) || 'free'
    if (tier in tierDistribution) tierDistribution[tier]++

    // Teachers belonging to this institution
    const teachers = profilesList.filter(p => p.institution_id === inst.id)
    const teachersCount = teachers.length

    // Classes belonging to this institution
    const instClasses = classesList.filter(c => c.institution_id === inst.id)
    const classesCount = instClasses.length

    // Sum fee volume
    const feeVolume = instClasses.reduce((sum, c) => sum + (Number(c.fee) || 0), 0)
    totalFeeVolume += feeVolume

    // Students belonging to this institution
    const instStudents = studentsList.filter(s => s.institution_id === inst.id)
    const studentsCount = instStudents.length

    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free
    const maxStudents = limits.maxStudents
    const maxClasses = limits.maxClasses

    let utilizationRate = 0
    if (tier === 'unlimited') {
      utilizationRate = studentsCount > 0 ? 10 : 0
    } else {
      utilizationRate = Math.min(100, Math.round((studentsCount / maxStudents) * 100))
    }

    let status: 'healthy' | 'warning' | 'exceeded' = 'healthy'
    if (studentsCount > maxStudents || classesCount > maxClasses) {
      status = 'exceeded'
    } else if (utilizationRate >= 80) {
      status = 'warning'
    }

    return {
      id: inst.id,
      name: inst.name,
      createdAt: inst.created_at,
      ownerId: inst.owner_id,
      ownerName: owner?.full_name || 'Institution Owner',
      ownerEmail: owner?.email || 'N/A',
      tier,
      teachersCount,
      classesCount,
      maxClasses,
      studentsCount,
      maxStudents,
      feeVolume,
      utilizationRate,
      status,
    }
  })

  // Calculate teachers usage
  const teachersList = profilesList.filter(p =>
    ['teacher', 'institution_teacher', 'solo_teacher'].includes(p.role)
  )

  const teachersUsage: TeacherUsage[] = teachersList.map(teacher => {
    const tier: TierType = (teacher.subscription_tier as TierType) || 'free'
    if (teacher.role === 'solo_teacher' && tier in tierDistribution) {
      tierDistribution[tier]++
    }

    // Classes assigned to or owned by this teacher
    const teacherClasses = classesList.filter(
      c => c.assigned_teacher_id === teacher.id
    )
    const classesCount = teacherClasses.length
    const feeVolume = teacherClasses.reduce((sum, c) => sum + (Number(c.fee) || 0), 0)

    // Students enrolled in this teacher's classes
    const teacherClassIds = new Set(teacherClasses.map(c => c.id))
    const teacherEnrollments = (enrollData || []).filter(e => teacherClassIds.has(e.class_id))
    const uniqueStudentIds = new Set(teacherEnrollments.map(e => e.student_id))
    const studentsCount = uniqueStudentIds.size

    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free
    const maxStudents = limits.maxStudents
    const maxClasses = limits.maxClasses

    let utilizationRate = 0
    if (tier === 'unlimited') {
      utilizationRate = studentsCount > 0 ? 15 : 0
    } else {
      utilizationRate = Math.min(100, Math.round((studentsCount / maxStudents) * 100))
    }

    let status: 'healthy' | 'warning' | 'exceeded' = 'healthy'
    if (studentsCount > maxStudents || (tier === 'free' && classesCount > maxClasses)) {
      status = 'exceeded'
    } else if (utilizationRate >= 80) {
      status = 'warning'
    }

    return {
      id: teacher.id,
      name: teacher.full_name || 'Instructor',
      email: teacher.email || 'N/A',
      role: teacher.role,
      institutionId: teacher.institution_id,
      institutionName: teacher.institution_id ? instMap.get(teacher.institution_id) || 'Institution' : 'Independent (Solo)',
      tier,
      classesCount,
      maxClasses,
      studentsCount,
      maxStudents,
      feeVolume,
      utilizationRate,
      status,
    }
  })

  return {
    totalInstitutions: institutionsList.length,
    totalTeachers: teachersList.length,
    totalClasses: classesList.length,
    totalStudents: studentsList.length,
    totalFeeVolume,
    tierDistribution,
    institutions: institutionsUsage,
    teachers: teachersUsage,
  }
}
