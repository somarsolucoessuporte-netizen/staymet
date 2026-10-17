'use client'

import { useState, useTransition } from 'react'
import { useToast } from '@/components/ui/toast'
import { updateGuiaSlug } from '@/lib/actions/guia'
import { slugify } from '@/lib/slug'

/** Edita o link amigável do guia: {origem}/g/{slug} */
export function GuiaSlugForm({
  propertyId,
  slug,
  suggestion,
  origin,
}: {
  propertyId: string
  slug: string | null
  suggestion: string
  origin: string
}) {
  const [value, setValue] = useState(slug ?? suggestion)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const { toast } = useToast()
  const clean = slugify(value)
  const changed = clean !== (slug ?? '')

  const save = () =>
    start(async () => {
      setError(null)
      const r = await updateGuiaSlug(propertyId, value)
      if (!r.ok) return setError(r.error)
      setValue(clean)
      toast({ title: clean ? 'Link amigável salvo' : 'Link amigável removido', variant: 'success' })
    })

  return (
    <div className="space-y-1.5">
      <label htmlFor="guia-slug" className="text-xs font-semibold text-[#475569]">Link amigável</label>
      <div className="flex items-center gap-2">
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-xl border border-[#E2E8F0] bg-white pl-3 text-sm focus-within:border-[#1A56DB] focus-within:ring-2 focus-within:ring-[#1A56DB]/15">
          <span className="shrink-0 text-[#94A3B8]">{origin.replace(/^https?:\/\//, '')}/g/</span>
          <input
            id="guia-slug"
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase())}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), changed && save())}
            placeholder="nome-da-casa"
            className="h-full min-w-0 flex-1 bg-transparent pr-3 outline-none"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending || !changed}
          className="h-10 shrink-0 rounded-xl bg-[#1A56DB] px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-[11px] text-[#94A3B8]">
          {slug ? 'O link antigo (/guia/…) continua funcionando.' : 'Ainda não salvo: o guia usa o link /guia/… até você salvar.'}
        </p>
      )}
    </div>
  )
}
