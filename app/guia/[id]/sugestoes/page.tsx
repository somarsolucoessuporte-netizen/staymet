import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { SuggestionFlow, type SuggestionUser } from '@/components/guia/SuggestionFlow'
import { SomarFooter } from '@/components/shared/SomarFooter'

// Caixinha de sugestões do guia público. O guia é aberto; enviar exige sessão (Google ou link mágico).

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Caixinha de sugestões',
  robots: { index: false, follow: false },
}

export default async function SugestoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await prisma.property.findFirst({
    where: { id, active: true },
    select: { id: true, name: true, suggestionsEnabled: true },
  })
  if (!property) notFound()

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let user: SuggestionUser | null = null
  if (authUser?.email) {
    const db = await prisma.user.findUnique({ where: { supabaseId: authUser.id }, select: { name: true, avatarUrl: true } })
    const meta = authUser.user_metadata ?? {}
    user = {
      fullName: db?.name ?? meta.full_name ?? meta.name ?? authUser.email.split('@')[0],
      email: authUser.email,
      avatarUrl: db?.avatarUrl ?? meta.avatar_url ?? meta.picture ?? null,
    }
  }

  return (
    <div className="font-display flex min-h-[100dvh] flex-col bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto w-full max-w-md flex-1">
        <header className="relative flex h-[60px] items-center justify-center bg-gradient-to-r from-[#0F3A7A] to-[#1A56DB] px-12 text-white">
          <a href={`/guia/${id}`} aria-label="Voltar ao guia" className="absolute left-2 rounded-full p-2 active:bg-white/10">
            <ArrowLeft size={20} />
          </a>
          <Image src="/icone.png" alt="" width={24} height={24} className="absolute right-3 rounded-md" />
          <p className="truncate text-sm font-semibold">{property.name}</p>
        </header>

        <main className="px-4 py-6">
          {property.suggestionsEnabled ? (
            <SuggestionFlow key={user?.email ?? 'anon'} propertyId={property.id} propertyName={property.name} user={user} />
          ) : (
            <p className="rounded-2xl bg-white p-5 text-center text-sm text-[#64748B] ring-1 ring-black/5">
              A caixinha de sugestões não está disponível para este imóvel no momento.
            </p>
          )}
        </main>
      </div>
      <SomarFooter className="mt-auto pb-[calc(12px+env(safe-area-inset-bottom,0px))]" />
    </div>
  )
}
