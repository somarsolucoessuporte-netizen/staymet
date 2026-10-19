import { NextResponse } from 'next/server'
import { icsResponse } from '@/lib/ical-export'

// GET /api/ical/{icalToken}/{channelId}.ics → o mesmo feed, sem os eventos que vieram desse canal
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; file: string }> }) {
  const { token, file } = await params
  if (!file.endsWith('.ics')) return new NextResponse('Not found', { status: 404 })
  return icsResponse(token, file.slice(0, -4))
}
