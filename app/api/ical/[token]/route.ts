import { NextResponse } from 'next/server'
import { icsResponse } from '@/lib/ical-export'

// GET /api/ical/{icalToken}.ics → todas as reservas e bloqueios do imóvel (público só pelo token)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token.endsWith('.ics')) return new NextResponse('Not found', { status: 404 })
  return icsResponse(token.slice(0, -4), null)
}
