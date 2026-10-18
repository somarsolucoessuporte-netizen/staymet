'use client'

import { useRef, useState, useTransition } from 'react'
import { ImageSquare, X, CircleNotch } from '@phosphor-icons/react/ssr'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { createGuiaCoverUploadUrl, updateGuiaPlace } from '@/lib/actions/guia'
import { COVER_BUCKET, COVER_MAX_BYTES, COVER_MIME_TYPES } from '@/lib/property-types'

const field = 'h-10 w-full min-w-0 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15'

/** Foto de capa do guia (upload ou URL). A localização fica em GuiaLocationForm. */
export function GuiaPlaceForm({
  propertyId,
  coverImageUrl,
}: {
  propertyId: string
  coverImageUrl: string | null
}) {
  const { toast } = useToast()
  const [cover, setCover] = useState(coverImageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const changed = cover !== (coverImageUrl ?? '')

  const save = (patch?: { coverImageUrl?: string }) =>
    start(async () => {
      setError(null)
      const r = await updateGuiaPlace(propertyId, patch ?? { coverImageUrl: cover })
      if (!r.ok) return setError(r.error)
      toast({ title: 'Guia atualizado', variant: 'success' })
    })

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!COVER_MIME_TYPES.includes(file.type)) return setError('Use uma imagem JPG, PNG ou WEBP.')
    if (file.size > COVER_MAX_BYTES) return setError('A imagem deve ter no máximo 5MB.')
    setError(null)
    setUploading(true)
    try {
      const prep = await createGuiaCoverUploadUrl(propertyId, { type: file.type, size: file.size })
      if (!prep.ok) return setError(prep.error)
      const { error: upErr } = await createClient().storage.from(COVER_BUCKET).uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type })
      if (upErr) return setError('Falha no envio da foto.')
      setCover(prep.publicUrl)
      save({ coverImageUrl: prep.publicUrl }) // foto enviada já vale para o guia
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Foto de capa */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#475569]">Foto de capa</p>
        <div className="relative h-[140px] overflow-hidden rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#0F3A7A]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Prévia da capa" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-white/75">
              Sem foto: o guia mostra o gradiente azul
            </p>
          )}
          <p className="absolute inset-x-0 bottom-2 text-center text-sm font-bold italic text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
            Aproveite sua estadia!
          </p>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <CircleNotch size={26} className="animate-spin" color="#fff" />
            </div>
          )}
          {cover && !uploading && (
            <button type="button" aria-label="Remover foto" onClick={() => setCover('')} className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5">
              <X size={14} weight="bold" color="#fff" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept={COVER_MIME_TYPES.join(',')} className="hidden" onChange={onFile} />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#F1F5FF] px-3 text-xs font-semibold text-[#1A56DB] disabled:opacity-50"
          >
            <ImageSquare size={16} weight="bold" /> Enviar foto
          </button>
          <input
            aria-label="Ou cole o link da foto"
            value={cover}
            onChange={(e) => setCover(e.target.value.trim())}
            inputMode="url"
            placeholder="ou cole o link da foto"
            className={field}
          />
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}

      <button
        type="button"
        onClick={() => save()}
        disabled={pending || uploading || !changed}
        className="h-11 w-full rounded-xl bg-[#1A56DB] text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? 'Salvando…' : 'Salvar foto'}
      </button>
    </div>
  )
}
