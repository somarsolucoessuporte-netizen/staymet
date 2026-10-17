'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { createOccurrence, createOccurrencePhotoUploadUrl } from '@/lib/actions/ocorrencias'
import { OPERATIONAL_CATEGORIES, PRIORITIES } from '@/lib/occurrences'
import { COVER_MAX_BYTES, COVER_MIME_TYPES } from '@/lib/property-types'

const field = 'w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15'

export function NewOccurrenceForm({ basePath, properties }: { basePath: string; properties: { id: string; name: string }[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!COVER_MIME_TYPES.includes(file.type)) return setError('Use uma imagem JPG, PNG ou WEBP.')
    if (file.size > COVER_MAX_BYTES) return setError('A imagem deve ter no máximo 5MB.')
    setUploading(true)
    try {
      const prep = await createOccurrencePhotoUploadUrl({ type: file.type, size: file.size })
      if (!prep.ok) return setError(prep.error)
      const { error: upErr } = await createClient().storage.from(prep.bucket).uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type })
      if (upErr) return setError('Falha no envio da foto.')
      setPhotos((p) => [...p, prep.publicUrl])
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        const fd = new FormData(e.currentTarget)
        start(async () => {
          const r = await createOccurrence({
            propertyId: String(fd.get('propertyId') ?? ''),
            title: String(fd.get('title') ?? ''),
            description: String(fd.get('description') ?? ''),
            category: String(fd.get('category') ?? 'OPERACIONAL') as 'OPERACIONAL',
            priority: String(fd.get('priority') ?? 'MEDIA') as 'MEDIA',
            photos,
          })
          if (!r.ok) return setError(r.error)
          toast({ title: 'Ocorrência registrada', variant: 'success' })
          router.push(`${basePath}/${r.id}`)
        })
      }}
    >
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}

      <label className="block space-y-1 text-xs font-semibold text-[#475569]">
        Imóvel*
        <select name="propertyId" required defaultValue={properties.length === 1 ? properties[0].id : ''} className={field}>
          <option value="" disabled>Selecione…</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="block space-y-1 text-xs font-semibold text-[#475569]">
        Título*
        <input name="title" required minLength={3} maxLength={120} placeholder="Ex.: Torneira da cozinha pingando" className={field} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-xs font-semibold text-[#475569]">
          Categoria*
          <select name="category" defaultValue="OPERACIONAL" className={field}>
            {OPERATIONAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="block space-y-1 text-xs font-semibold text-[#475569]">
          Prioridade
          <select name="priority" defaultValue="MEDIA" className={field}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-xs font-semibold text-[#475569]">
        Descrição*
        <textarea name="description" required minLength={5} rows={4} placeholder="O que aconteceu, onde, desde quando…" className={field} />
      </label>

      <div className="space-y-2">
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" aria-label="Remover foto" onClick={() => setPhotos((p) => p.filter((x) => x !== src))} className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept={COVER_MIME_TYPES.join(',')} className="hidden" onChange={onFile} />
        <button
          type="button"
          disabled={uploading || photos.length >= 6}
          onClick={() => fileRef.current?.click()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1A56DB]/30 text-sm font-semibold text-[#1A56DB] disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? 'Enviando foto…' : 'Adicionar foto (opcional)'}
        </button>
      </div>

      <button type="submit" disabled={pending || uploading} className="h-12 w-full rounded-xl bg-[#1A56DB] text-sm font-semibold text-white disabled:opacity-60">
        {pending ? 'Registrando…' : 'Registrar ocorrência'}
      </button>
    </form>
  )
}
