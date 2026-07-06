export const dynamic = 'force-dynamic'

import CandidatesClientPage from './candidates-client'
import { getServerApiBase } from '@/lib/server-api'
import { Candidate } from '@/lib/types'

async function getInitialCandidates() {
  try {
    const res = await fetch(`${getServerApiBase()}/candidates`, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`\u5019\u9009\u4eba\u5217\u8868\u52a0\u8f7d\u5931\u8d25\uff08${res.status}\uff09`)
    }
    const candidates = (await res.json()) as Candidate[]
    return { candidates, error: '' }
  } catch (error) {
    return {
      candidates: [] as Candidate[],
      error: error instanceof Error ? error.message : '\u5019\u9009\u4eba\u5217\u8868\u52a0\u8f7d\u5931\u8d25',
    }
  }
}

export default async function CandidatesPage() {
  const { candidates, error } = await getInitialCandidates()

  return <CandidatesClientPage initialCandidates={candidates} initialError={error} />
}
