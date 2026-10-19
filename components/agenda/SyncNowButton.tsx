'use client'

import { useTransition } from 'react'
import { ArrowsClockwise } from '@phosphor-icons/react/ssr'
import { useToast } from '@/components/ui/toast'
import { syncPropertyNow } from '@/lib/actions/agenda'
import { cn } from '@/lib/utils'

/** Sincroniza agora só os canais deste imóvel */
export function SyncNowButton({ propertyId, className }: { propertyId: string; className?: string }) {
  const [busy, startTransition] = useTransition()
  const { toast } = useToast()

  const run = () =>
    startTransition(async () => {
      const res = await syncPropertyNow(propertyId)
      if (!res.ok) {
        toast({ title: 'Erro', description: res.error, variant: 'error' })
      } else if (res.channels === 0) {
        toast({ title: 'Nenhum canal conectado', description: 'Adicione um canal em "Canais".', variant: 'info' })
      } else if (res.errors.length) {
        toast({ title: `${res.errors.length} canal(is) com erro`, description: res.errors[0], variant: 'error' })
      } else if (res.conflicts) {
        toast({ title: 'Sincronizado, mas há conflito de datas', description: 'Confira os avisos em vermelho.', variant: 'error' })
      } else {
        toast({ title: 'Calendário sincronizado', variant: 'success' })
      }
    })

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#F1F5FF] px-3 text-xs font-semibold text-[#1A56DB] transition active:scale-[0.98] disabled:opacity-70',
        className,
      )}
    >
      <ArrowsClockwise size={16} weight="bold" className={cn(busy && 'animate-spin')} />
      {busy ? 'Sincronizando…' : 'Sincronizar agora'}
    </button>
  )
}
