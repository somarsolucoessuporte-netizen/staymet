'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { createProperty, updateProperty, createCoverUploadUrl, type PropertyInput } from '@/lib/actions/imoveis'
import { PROPERTY_TYPES, COVER_BUCKET, COVER_MAX_BYTES, COVER_MIME_TYPES } from '@/lib/property-types'
import { DELIVERY_PLACEHOLDER } from '@/lib/guia'

export type PropertyFormValues = {
  name: string
  description: string | null
  type: string
  ownerId: string
  maxGuests: number
  address: string
  city: string
  state: string
  zipCode: string | null
  coverImageUrl: string | null
  checkInTime: string
  checkOutTime: string
  rules: string | null
  wifiName: string | null
  wifiPassword: string | null
  deliveryInstructions: string | null
}

export type OwnerOption = { id: string; name: string; email: string; role: string }

const selectClass =
  'flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent'

const ROLE_LABEL: Record<string, string> = {
  PROPRIETARIO: 'Proprietário',
  GESTOR: 'Gestor',
  ADMINISTRADOR: 'Admin',
}

export function PropertyForm({
  locale,
  propertyId,
  initial,
  owners,
}: {
  locale: string
  propertyId?: string
  initial?: PropertyFormValues
  owners: OwnerOption[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState(initial?.coverImageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const listHref = `/${locale}/admin/imoveis`

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)

    if (!COVER_MIME_TYPES.includes(file.type)) return setError('Use uma imagem JPG, PNG ou WEBP.')
    if (file.size > COVER_MAX_BYTES) return setError('A imagem deve ter no máximo 5MB.')

    setUploading(true)
    try {
      const prep = await createCoverUploadUrl({ name: file.name, type: file.type, size: file.size })
      if (!prep.ok) return setError(prep.error)

      const { error: upErr } = await createClient()
        .storage.from(COVER_BUCKET)
        .uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type })
      if (upErr) return setError(`Falha no upload: ${upErr.message}`)

      setCoverUrl(prep.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => String(fd.get(k) ?? '')

    const input: PropertyInput = {
      name: get('name'),
      description: get('description'),
      type: get('type') as PropertyInput['type'],
      ownerId: get('ownerId'),
      maxGuests: get('maxGuests'),
      address: get('address'),
      city: get('city'),
      state: get('state'),
      zipCode: get('zipCode'),
      coverImageUrl: coverUrl,
      checkInTime: get('checkInTime'),
      checkOutTime: get('checkOutTime'),
      rules: get('rules'),
      wifiName: get('wifiName'),
      wifiPassword: get('wifiPassword'),
      deliveryInstructions: get('deliveryInstructions'),
    }

    startTransition(async () => {
      const res = propertyId ? await updateProperty(propertyId, input) : await createProperty(input)
      if (!res.ok) {
        setError(res.error)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      toast({ title: propertyId ? 'Imóvel atualizado' : 'Imóvel criado', variant: 'success' })
      router.push(listHref)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>
      )}

      <Section title="Dados do imóvel">
        <Field label="Nome*" htmlFor="name">
          <Input id="name" name="name" required defaultValue={initial?.name} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo*" htmlFor="type">
            <select id="type" name="type" required defaultValue={initial?.type ?? 'CASA_PRAIA'} className={selectClass}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Hóspedes máx.*" htmlFor="maxGuests">
            <Input id="maxGuests" name="maxGuests" type="number" min={1} max={100} required defaultValue={initial?.maxGuests ?? 4} />
          </Field>
        </div>
        <Field label="Proprietário*" htmlFor="ownerId">
          <select id="ownerId" name="ownerId" required defaultValue={initial?.ownerId ?? ''} className={selectClass}>
            <option value="" disabled>Selecione…</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} — {o.email}{o.role !== 'PROPRIETARIO' ? ` (${ROLE_LABEL[o.role] ?? o.role})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descrição" htmlFor="description">
          <Textarea id="description" name="description" rows={2} defaultValue={initial?.description ?? ''} />
        </Field>
      </Section>

      <Section title="Endereço">
        <Field label="Endereço*" htmlFor="address">
          <Input id="address" name="address" required defaultValue={initial?.address} />
        </Field>
        <div className="grid grid-cols-[1fr_5.5rem] gap-3">
          <Field label="Cidade*" htmlFor="city">
            <Input id="city" name="city" required defaultValue={initial?.city} />
          </Field>
          <Field label="Estado*" htmlFor="state">
            <Input id="state" name="state" required maxLength={40} placeholder="CE" defaultValue={initial?.state} />
          </Field>
        </div>
        <Field label="CEP" htmlFor="zipCode">
          <Input id="zipCode" name="zipCode" inputMode="numeric" defaultValue={initial?.zipCode ?? ''} />
        </Field>
      </Section>

      <Section title="Foto de capa">
        <div className="relative h-40 overflow-hidden rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#0F172A]">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Prévia da capa" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Sem foto — o guia usa o gradiente azul</p>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {coverUrl && !uploading && (
            <button
              type="button"
              onClick={() => setCoverUrl('')}
              aria-label="Remover foto"
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept={COVER_MIME_TYPES.join(',')} className="hidden" onChange={onFile} />
        <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-4 w-4" /> {uploading ? 'Enviando…' : 'Enviar imagem (JPG, PNG ou WEBP, até 5MB)'}
        </Button>
        <Field label="…ou cole a URL da imagem" htmlFor="coverImageUrl">
          <Input
            id="coverImageUrl"
            inputMode="url"
            placeholder="https://…"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value.trim())}
          />
        </Field>
      </Section>

      <Section title="Estadia">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check-in*" htmlFor="checkInTime">
            <Input id="checkInTime" name="checkInTime" type="time" required defaultValue={initial?.checkInTime ?? '14:00'} />
          </Field>
          <Field label="Check-out*" htmlFor="checkOutTime">
            <Input id="checkOutTime" name="checkOutTime" type="time" required defaultValue={initial?.checkOutTime ?? '11:00'} />
          </Field>
        </div>
        <Field label="Regras da casa" htmlFor="rules">
          <Textarea id="rules" name="rules" rows={4} defaultValue={initial?.rules ?? ''} />
        </Field>
      </Section>

      <Section title="Wi-Fi e entregadores">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome da rede Wi-Fi" htmlFor="wifiName">
            <Input id="wifiName" name="wifiName" autoComplete="off" defaultValue={initial?.wifiName ?? ''} />
          </Field>
          <Field label="Senha Wi-Fi" htmlFor="wifiPassword">
            <Input id="wifiPassword" name="wifiPassword" autoComplete="off" defaultValue={initial?.wifiPassword ?? ''} />
          </Field>
        </div>
        <Field label="Endereço padrão para entregas" htmlFor="deliveryInstructions">
          <Textarea
            id="deliveryInstructions"
            name="deliveryInstructions"
            rows={3}
            placeholder={DELIVERY_PLACEHOLDER}
            defaultValue={initial?.deliveryInstructions ?? ''}
          />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-border bg-[#F8FAFC]/95 px-4 py-3 backdrop-blur">
        <Button type="submit" loading={pending} disabled={uploading} className="flex-1 bg-[#1A56DB] hover:bg-[#1648C0]">
          Salvar
        </Button>
        <Link
          href={listHref}
          className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <h2 className="text-sm font-bold text-[#0F172A]">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
