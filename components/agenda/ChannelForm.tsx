'use client'

import { useState, useTransition } from 'react'
import { Plus, CircleNotch } from '@phosphor-icons/react/ssr'
import { useToast } from '@/components/ui/toast'
import { addChannel } from '@/lib/actions/agenda'
import { PLATFORM_META, type ChannelPlatformValue } from '@/lib/agenda'
import { cn } from '@/lib/utils'

const inputCls =
  'h-11 w-full min-w-0 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm placeholder:text-gray-400 focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15'

/** "Adicionar canal": plataforma + link de exportação (.ics) dela; já sincroniza na hora */
export function ChannelForm({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<ChannelPlatformValue>('AIRBNB')
  const [label, setLabel] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, startTransition] = useTransition()
  const { toast } = useToast()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await addChannel(propertyId, { platform, label, importUrl })
      if (!res.ok) {
        setError(res.error)
        return
      }
      if (!res.synced) {
        toast({ title: 'Canal adicionado, mas a sincronização falhou', description: res.syncError, variant: 'error' })
      } else {
        toast({
          title: 'Canal conectado',
          description: `${res.events} ${res.events === 1 ? 'evento importado' : 'eventos importados'}${res.conflicts ? ' · há conflito de datas' : ''}.`,
          variant: res.conflicts ? 'error' : 'success',
        })
      }
      setLabel('')
      setImportUrl('')
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1A56DB]/30 text-sm font-semibold text-[#1A56DB] transition active:scale-[0.98]"
      >
        <Plus size={16} weight="bold" /> Adicionar canal
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-4 ring-1 ring-black/5">
      <p className="text-sm font-extrabold">Adicionar canal</p>
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.keys(PLATFORM_META) as ChannelPlatformValue[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={cn(
              'flex h-10 items-center justify-center gap-1 rounded-xl border text-xs font-semibold transition',
              platform === p ? 'border-[#1A56DB] bg-[#F1F5FF] text-[#1A56DB]' : 'border-[#E2E8F0] text-[#475569]',
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_META[p].color }} />
            {PLATFORM_META[p].label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="ch-url" className="mb-1 block text-xs font-semibold text-[#475569]">
          Link de exportação do {PLATFORM_META[platform].label} (.ics)
        </label>
        <input
          id="ch-url"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          inputMode="url"
          placeholder="https://..."
          className={inputCls}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="ch-label" className="mb-1 block text-xs font-semibold text-[#475569]">Nome (opcional)</label>
        <input id="ch-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={PLATFORM_META[platform].label} className={inputCls} />
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xl bg-gray-100 text-sm font-semibold text-[#475569]">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1A56DB] text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy && <CircleNotch size={16} className="animate-spin" />} Conectar
        </button>
      </div>
    </form>
  )
}
