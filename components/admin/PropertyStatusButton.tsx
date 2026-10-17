'use client'

import { useState, useTransition } from 'react'
import { Power, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { deactivateProperty, reactivateProperty } from '@/lib/actions/imoveis'

/** Desativar (com confirmação inline) ou reativar um imóvel */
export function PropertyStatusButton({ id, active }: { id: string; active: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const { toast } = useToast()

  const run = (fn: typeof deactivateProperty, okTitle: string) =>
    startTransition(async () => {
      const res = await fn(id)
      setConfirming(false)
      toast(res.ok ? { title: okTitle, variant: 'success' } : { title: 'Erro', description: res.error, variant: 'error' })
    })

  const base = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50'

  if (!active) {
    return (
      <button type="button" disabled={pending} onClick={() => run(reactivateProperty, 'Imóvel reativado')} className={`${base} bg-emerald-50 text-emerald-700`}>
        <RotateCcw size={14} /> {pending ? 'Reativando…' : 'Reativar'}
      </button>
    )
  }

  if (confirming) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-xl bg-red-50 p-3 sm:w-auto">
        <p className="text-xs text-red-700">Tem certeza? O guia do hóspede deixa de funcionar.</p>
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => run(deactivateProperty, 'Imóvel desativado')} className={`${base} bg-red-600 text-white`}>
            {pending ? 'Desativando…' : 'Desativar'}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={`${base} bg-white text-gray-700`}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className={`${base} bg-red-50 text-red-700`}>
      <Power size={14} /> Desativar
    </button>
  )
}
