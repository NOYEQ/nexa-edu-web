import { fetchPlatformData } from '../actions'
import ReportsClient from './reports-client'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const data = await fetchPlatformData()

  return (
    <ReportsClient
      institutions={data.institutions}
      teachers={data.teachers}
      totalFeeVolume={data.totalFeeVolume}
    />
  )
}
