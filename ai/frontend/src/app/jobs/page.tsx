export const dynamic = 'force-dynamic'

import JobsClientPage from './jobs-client'
import { getServerApiBase } from '@/lib/server-api'
import { Job } from '@/lib/types'

async function getInitialJobs() {
  try {
    const res = await fetch(`${getServerApiBase()}/jobs`, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`岗位列表加载失败（${res.status}）`)
    }
    const jobs = (await res.json()) as Job[]
    return { jobs, error: '' }
  } catch (error) {
    return {
      jobs: [] as Job[],
      error: error instanceof Error ? error.message : '岗位列表加载失败',
    }
  }
}

export default async function JobsPage() {
  const { jobs, error } = await getInitialJobs()

  return <JobsClientPage initialJobs={jobs} initialError={error} />
}
