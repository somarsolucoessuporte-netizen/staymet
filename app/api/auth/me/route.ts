import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, language: true },
    })

    if (!dbUser) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json(dbUser)
  } catch {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
