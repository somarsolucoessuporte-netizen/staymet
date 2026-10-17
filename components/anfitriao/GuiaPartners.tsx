'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Plus, Phone, MessageCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { upsertPartner, removePartner } from '@/lib/actions/guia'
import { PARTNER_CATEGORIES, getCategoryMeta, whatsappDigitsFromUrl, type PartnerCategory } from '@/lib/guia'
import { cn } from '@/lib/utils'

export type GuiaPartner = {
  id: string
  name: string
  category: string
  phone: string | null
  whatsappUrl: string | null
  externalUrl: string | null
  description: string | null
}

const selectClass =
  'flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent'

function CategoryBadge({ category }: { category: string }) {
  const meta = getCategoryMeta(category)
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', meta?.badge ?? 'bg-muted text-muted-foreground border-border')}>
      {meta ? `${meta.emoji} ${meta.label}` : category}
    </span>
  )
}

function PartnerForm({
  propertyId,
  partner,
  onDone,
}: {
  propertyId: string
  partner?: GuiaPartner
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => String(fd.get(k) ?? '')
    startTransition(async () => {
      const res = await upsertPartner(propertyId, {
        id: partner?.id,
        name: get('name'),
        category: get('category') as PartnerCategory,
        phone: get('phone'),
        whatsapp: get('whatsapp'),
        externalUrl: get('externalUrl'),
        description: get('description'),
      })
      if (res.ok) {
        toast({ title: partner ? 'Contato atualizado' : 'Contato adicionado', variant: 'success' })
        onDone()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
      <div className="space-y-1.5">
        <Label htmlFor="p-name">Nome*</Label>
        <Input id="p-name" name="name" required defaultValue={partner?.name ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-category">Categoria*</Label>
        <select id="p-category" name="category" required defaultValue={partner?.category ?? 'DELIVERY'} className={selectClass}>
          {PARTNER_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="p-phone">Telefone</Label>
          <Input id="p-phone" name="phone" type="tel" defaultValue={partner?.phone ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-whatsapp">Número WhatsApp</Label>
          <Input
            id="p-whatsapp"
            name="whatsapp"
            inputMode="numeric"
            placeholder="5585999887766"
            defaultValue={whatsappDigitsFromUrl(partner?.whatsappUrl)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-url">Link externo / Google Maps</Label>
        <Input id="p-url" name="externalUrl" inputMode="url" placeholder="https://maps.app.goo.gl/..." defaultValue={partner?.externalUrl ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-desc">Descrição</Label>
        <Input id="p-desc" name="description" defaultValue={partner?.description ?? ''} />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" loading={pending} className="flex-1">Salvar</Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>Cancelar</Button>
      </div>
    </form>
  )
}

function PartnerRow({
  propertyId,
  partner,
  onEdit,
}: {
  propertyId: string
  partner: GuiaPartner
  onEdit: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const { toast } = useToast()

  const onRemove = () => {
    startTransition(async () => {
      const res = await removePartner(propertyId, partner.id)
      if (!res.ok) {
        toast({ title: 'Erro ao remover', description: res.error, variant: 'error' })
        setConfirming(false)
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{partner.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <CategoryBadge category={partner.category} />
            {partner.whatsappUrl ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <MessageCircle className="h-3.5 w-3.5" /> +{whatsappDigitsFromUrl(partner.whatsappUrl)}
              </span>
            ) : partner.phone ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {partner.phone}
              </span>
            ) : null}
            {partner.externalUrl && (
              <a href={partner.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent">
                <ExternalLink className="h-3.5 w-3.5" /> Link
              </a>
            )}
          </div>
        </div>
        {!confirming && (
          <div className="flex shrink-0 gap-1">
            <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setConfirming(true)} aria-label="Remover">
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        )}
      </div>
      {confirming && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2">
          <span className="text-xs text-red-700">Remover este contato?</span>
          <div className="flex gap-1">
            <Button size="sm" variant="danger" loading={pending} onClick={onRemove}>Remover</Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function GuiaPartners({ propertyId, partners }: { propertyId: string; partners: GuiaPartner[] }) {
  // null = nenhum form aberto | 'new' = adicionando | id = editando
  const [editing, setEditing] = useState<string | null>(null)

  const known = PARTNER_CATEGORIES.map((c) => c.value as string)
  const groups = [
    ...PARTNER_CATEGORIES.map((c) => ({ key: c.value as string, items: partners.filter((p) => p.category === c.value) })),
    // categorias antigas (LIMPEZA, MANUTENCAO...) continuam visíveis para poder editar/remover
    { key: 'OUTRAS', items: partners.filter((p) => !known.includes(p.category)) },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">
      {groups.length === 0 && editing !== 'new' && (
        <p className="text-sm text-muted-foreground">Nenhum contato ou local cadastrado ainda.</p>
      )}

      {groups.map((group) => {
        const meta = getCategoryMeta(group.key)
        return (
          <div key={group.key} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {meta ? `${meta.emoji} ${meta.label}` : 'Outras categorias'}
            </p>
            {group.items.map((partner) =>
              editing === partner.id ? (
                <PartnerForm key={partner.id} propertyId={propertyId} partner={partner} onDone={() => setEditing(null)} />
              ) : (
                <PartnerRow key={partner.id} propertyId={propertyId} partner={partner} onEdit={() => setEditing(partner.id)} />
              ),
            )}
          </div>
        )
      })}

      {editing === 'new' ? (
        <PartnerForm propertyId={propertyId} onDone={() => setEditing(null)} />
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Adicionar contato / local
        </Button>
      )}
    </div>
  )
}
