import { fetchPlatformData } from '../actions'
import TeachersAdminClient from './teachers-admin-client'

export const dynamic = 'force-dynamic'

export default async function AdminTeachersPage() {
  const data = await fetchPlatformData()

  return <TeachersAdminClient initialTeachers={data.teachers} />
}
