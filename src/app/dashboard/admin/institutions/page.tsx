import { fetchPlatformData } from '../actions'
import InstitutionsClient from './institutions-client'

export const dynamic = 'force-dynamic'

export default async function AdminInstitutionsPage() {
  const data = await fetchPlatformData()

  return <InstitutionsClient initialInstitutions={data.institutions} />
}
