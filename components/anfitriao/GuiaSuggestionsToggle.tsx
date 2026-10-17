'use client'

import { useState, useTransition } from 'react'
import { Lightbulb } from '@phosphor-icons/react/ssr'
import { useToast } from '@/components/ui/toast'
import { setSuggestionsEnabled } from '@/lib/actions/guia'
import { cn } from '@/lib/utils'

/** Interruptor "Mostrar caixinha de sugestões no guia" (Property.suggestionsEnabled) */
export function GuiaSuggestionsToggle({ propertyId, enabled }: { propertyId: string; enabled: boolean }) {
  const [on, setOn] = useState(enabled)
  const [pending, start] = useTransition()
  const { toast } = useToast()

  const toggle = () => {
    const next = !on
    setOn(next)
    start(async () => {
      const r = await setSuggestionsEnabled(propertyId, next)
      if (!r.ok) {
        setOn(!next)
        toast({ title: 'Não foi possível salvar', description: r.error, variant: 'error' })
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
        <Lightbulb size={24} weight="duotone" color="#1A56DB" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Mostrar caixinha de sugestões no guia</p>
        <p className="text-xs text-muted-foreground">O hóspede entra com Google ou e-mail e envia ideias para você.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Mostrar caixinha de sugestões no guia"
        disabled={pending}
        onClick={toggle}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60', on ? 'bg-emerald-500' : 'bg-gray-300')}
      >
        <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition', on && 'translate-x-5')} />
      </button>
    </div>
  )
}
