import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { syncAllChannels } from '@/lib/ical-sync'

// Chamado a cada 10 min pelo pg_cron do Supabase (pg_net) com Authorization: Bearer {CRON_SECRET}
export const maxDuration = 60

function authorized(header: string | null) {
  const secret = process.env.CRON_SECRET
  if (!secret || !header) return false
  const a = Buffer.from(header)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  if (!authorized(req.headers.get('authorization'))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const results = await syncAllChannels()
  return NextResponse.json({
    ok: true,
    channels: results.length,
    errors: results.filter((r) => !r.ok).length,
  })
}
