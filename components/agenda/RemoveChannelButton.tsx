'use client'

import { useState, useTransition } from 'react'
import { Trash, CircleNotch } from '@phosphor-icons/react/ssr'
import { useToast } from '@/components/ui/toast'
import { removeChannel } from '@/lib/actions/agenda'

export function RemoveChannelButton({ propertyId, channelId, label }: { propertyId: string; channelId: string; label: string }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, startTransition] = useTransition()
  const { toast } = useToast()

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        aria-label={`Desconectar ${label}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
      >
        <Trash size={17} />
      </button>
    )
  }

  return (
    <span className="flex shrink-0 items-center gap-1 text-xs">
      <span className="text-red-700">Desconectar?</span>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          startTransition(async () => {
            const res = await removeChannel(propertyId, channelId)
            toast(res.ok ? { title: 'Canal desconectado', variant: 'success' } : { title: 'Erro', description: res.error, variant: 'error' })
          })
        }
        className="flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 font-semibold text-white"
      >
        {busy && <CircleNotch size={12} className="animate-spin" />} Sim
      </button>
      <button type="button" onClick={() => setConfirm(false)} className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-700">
        Não
      </button>
    </span>
  )
}
