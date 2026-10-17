'use client'

import { useRef, useState, useTransition } from 'react'
import { ChevronUp, ChevronDown, Trash2, Plus, Check, ExternalLink, Loader2, Pencil, Minimize2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { CategoryPicker } from '@/components/anfitriao/CategoryPicker'
import { CategoryIcon } from '@/components/guia/CategoryIcon'
import { upsertPartner, removePartner, reorderPartner, togglePartnerActive } from '@/lib/actions/guia'
import {
  PARTNER_CATEGORIES, getCategoryMeta, whatsappDigitsFromUrl, formatWhatsappBR, isOrderCategory, buildGuestMessage,
  type PartnerCategory,
} from '@/lib/guia'
import { cn } from '@/lib/utils'

export type GuiaPartner = {
  id: string
  name: string
  category: string
  phone: string | null
  whatsappUrl: string | null
  externalUrl: string | null
  description: string | null
  active: boolean
  sortOrder: number
  deliveryNote: string | null
}

type Draft = { key: string }

const CATEGORY_ORDER = PARTNER_CATEGORIES.map((c) => c.value as string)
const sectionOf = (cat: string) => getCategoryMeta(cat)?.section ?? 'contatos'
const validCategory = (cat: string): PartnerCategory =>
  (CATEGORY_ORDER.includes(cat) ? cat : 'OUTRO') as PartnerCategory

const inputCls =
  'h-10 w-full min-w-0 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm placeholder:text-gray-400 focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15'

/** Mesma regra do servidor (buildWhatsappUrl), só para o botão "Testar" e a prévia */
function waLink(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) d = `55${d}`
  return d.length >= 12 && d.length <= 15 ? `https://wa.me/${d}` : null
}
function normalizeLink(raw: string) {
  const v = raw.trim()
  if (!v) return null
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}
/** Igual ao actionFor do guia: contatos priorizam WhatsApp; dicas priorizam o link */
function testHref(category: string, whatsapp: string, link: string, phone: string | null) {
  const wa = waLink(whatsapp)
  const url = normalizeLink(link)
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null
  return (sectionOf(category) === 'dicas' ? url ?? wa : wa ?? url) ?? tel
}

type RowContext = { propertyId: string; propertyName: string; defaultAddress: string | null }

export function GuiaPartners({
  propertyId,
  propertyName,
  defaultAddress,
  partners,
}: RowContext & { partners: GuiaPartner[] }) {
  const ctx: RowContext = { propertyId, propertyName, defaultAddress }
  const [drafts, setDrafts] = useState<Draft[]>([])
  const nextKey = useRef(0)

  // Mesma ordem do guia: categoria → sortOrder
  const sorted = [...partners].sort(
    (a, b) => CATEGORY_ORDER.indexOf(validCategory(a.category)) - CATEGORY_ORDER.indexOf(validCategory(b.category)) || a.sortOrder - b.sortOrder,
  )
  const groups = [
    { key: 'contatos', title: 'Contatos (WhatsApp)', items: sorted.filter((p) => sectionOf(p.category) === 'contatos') },
    { key: 'dicas', title: 'Dicas e roteiros (mapa/link)', items: sorted.filter((p) => sectionOf(p.category) === 'dicas') },
  ]
  const visible = partners.filter((p) => p.active).length

  const addDraft = () => setDrafts((d) => [...d, { key: `novo-${nextKey.current++}` }])
  const dropDraft = (key: string) => setDrafts((d) => d.filter((x) => x.key !== key))

  return (
    <div className="space-y-5">
      <p className="text-xs font-medium text-[#64748B]">
        {partners.length} {partners.length === 1 ? 'botão' : 'botões'} · {visible} {visible === 1 ? 'visível' : 'visíveis'} para o hóspede
      </p>

      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <div key={g.key} className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">{g.title}</p>
            {g.items.map((p, i) => {
              const prev = g.items[i - 1]
              const next = g.items[i + 1]
              return (
                <PartnerRow
                  key={p.id}
                  ctx={ctx}
                  partner={p}
                  canUp={!!prev && prev.category === p.category}
                  canDown={!!next && next.category === p.category}
                />
              )
            })}
          </div>
        ),
      )}

      {partners.length === 0 && drafts.length === 0 && (
        <p className="text-sm text-[#64748B]">Nenhum botão ainda. Adicione o primeiro abaixo.</p>
      )}

      {drafts.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Novo botão</p>
          {drafts.map((d) => (
            <PartnerRow key={d.key} ctx={ctx} onCreated={() => dropDraft(d.key)} onDiscard={() => dropDraft(d.key)} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addDraft}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1A56DB]/30 text-sm font-semibold text-[#1A56DB] transition active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> Adicionar botão
      </button>
    </div>
  )
}

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; msg: string }

function PartnerRow({
  ctx,
  partner,
  canUp = false,
  canDown = false,
  onCreated,
  onDiscard,
}: {
  ctx: RowContext
  partner?: GuiaPartner
  canUp?: boolean
  canDown?: boolean
  onCreated?: () => void
  onDiscard?: () => void
}) {
  const { propertyId } = ctx
  const isNew = !partner
  const saved = {
    category: validCategory(partner?.category ?? 'DELIVERY'),
    name: partner?.name ?? '',
    whatsapp: formatWhatsappBR(whatsappDigitsFromUrl(partner?.whatsappUrl)),
    link: partner?.externalUrl ?? '',
    description: partner?.description ?? '',
    deliveryNote: partner?.deliveryNote ?? '',
  }

  const [category, setCategory] = useState<PartnerCategory>(saved.category)
  const [name, setName] = useState(saved.name)
  const [whatsapp, setWhatsapp] = useState(saved.whatsapp)
  const [link, setLink] = useState(saved.link)
  const [description, setDescription] = useState(saved.description)
  const [showDesc, setShowDesc] = useState(!!saved.description)
  const [deliveryNote, setDeliveryNote] = useState(saved.deliveryNote)
  const [showNote, setShowNote] = useState(!!saved.deliveryNote)
  const isOrder = isOrderCategory(category)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [confirmDelete, setConfirmDelete] = useState(false)
  // modo compacto: linha resumida; abre o editor completo ao tocar (botão novo já nasce aberto)
  const [expanded, setExpanded] = useState(isNew)
  const [busy, startTransition] = useTransition()
  const { toast } = useToast()
  const rowRef = useRef<HTMLDivElement>(null)
  const lastSaved = useRef(saved)

  const active = partner?.active ?? true
  const href = testHref(category, whatsapp, link, partner?.phone ?? null)

  const dirty = (cat: PartnerCategory = category) => {
    const s = lastSaved.current
    return (
      cat !== s.category ||
      name.trim() !== s.name ||
      whatsapp.replace(/\D/g, '') !== s.whatsapp.replace(/\D/g, '') ||
      link.trim() !== s.link ||
      description.trim() !== s.description ||
      (isOrder && deliveryNote.trim() !== s.deliveryNote)
    )
  }

  const save = (over: { category?: PartnerCategory } = {}) => {
    const cat = over.category ?? category
    const catIsOrder = isOrderCategory(cat)
    if (status.kind === 'saving' || !dirty(cat)) return
    if (!name.trim()) {
      // linha nova vazia: só avisa; linha existente: não deixa apagar o texto
      if (!isNew || whatsapp || link) setStatus({ kind: 'error', msg: 'Informe o texto do botão.' })
      return
    }
    setStatus({ kind: 'saving' })
    startTransition(async () => {
      const res = await upsertPartner(propertyId, {
        id: partner?.id,
        name,
        category: cat,
        whatsapp,
        externalUrl: link,
        description,
        // só categorias de pedido usam; nas outras o valor salvo fica intocado
        ...(catIsOrder ? { deliveryNote } : {}),
      })
      if (!res.ok) {
        setStatus({ kind: 'error', msg: res.error })
        return
      }
      const digits = whatsapp.replace(/\D/g, '')
      lastSaved.current = {
        category: cat, name: name.trim(), whatsapp: formatWhatsappBR(digits), link: link.trim(),
        description: description.trim(),
        deliveryNote: catIsOrder ? deliveryNote.trim() : lastSaved.current.deliveryNote,
      }
      setWhatsapp(formatWhatsappBR(digits))
      if (isNew) {
        onCreated?.()
        return
      }
      setStatus({ kind: 'saved' })
      setTimeout(() => setStatus((s) => (s.kind === 'saved' ? { kind: 'idle' } : s)), 1500)
    })
  }

  // Salva quando o foco sai da linha inteira (não a cada campo), ou no Enter
  const onRowBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (rowRef.current?.contains(e.relatedTarget as Node | null)) return
    save()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault()
      save()
    }
  }

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) toast({ title: 'Erro', description: res.error, variant: 'error' })
    })

  const iconBtn =
    'flex h-9 w-9 items-center justify-center rounded-lg text-[#475569] transition hover:bg-gray-100 active:scale-95 disabled:pointer-events-none disabled:opacity-30'

  if (!expanded && partner) {
    const digits = whatsapp.replace(/\D/g, '')
    const summary = digits
      ? `WhatsApp ${formatWhatsappBR(digits)}`
      : link
        ? link.replace(/^https?:\/\//, '').split('/')[0]
        : partner.phone ?? 'Sem WhatsApp nem link'
    return (
      <div className={cn('flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-2.5 shadow-sm', !active && 'opacity-50')}>
        <CategoryIcon kind={category} size={40} />
        <button type="button" onClick={() => setExpanded(true)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold text-[#0F172A]">{name}</span>
          <span className="block truncate text-[11px] text-[#64748B]">{summary}</span>
        </button>
        {!active && <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">Oculto</span>}
        <Switch checked={active} disabled={busy} onChange={(v) => act(() => togglePartnerActive(propertyId, partner.id, v))} />
        <button type="button" onClick={() => setExpanded(true)} aria-label={`Editar ${name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#475569] hover:bg-gray-100">
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={rowRef}
      onBlur={onRowBlur}
      onKeyDown={onKeyDown}
      className={cn(
        'rounded-2xl border bg-white p-3 shadow-sm transition',
        status.kind === 'error' ? 'border-red-300' : 'border-[#E2E8F0]',
        !active && 'opacity-50',
      )}
    >
      {/* Linha 1: ícone/tipo + texto + ativo */}
      <div className="flex items-center gap-2">
        <CategoryPicker
          value={category}
          onChange={(v) => {
            setCategory(v)
            // linha existente: troca de tipo salva na hora (o seletor abre fora da linha)
            if (!isNew) save({ category: v })
          }}
        />
        <input
          aria-label="Texto do botão"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Texto do botão (ex.: Pizzaria 1)"
          autoFocus={isNew}
          className={cn(inputCls, 'font-semibold')}
        />
        {!isNew && (
          <Switch
            checked={active}
            disabled={busy}
            onChange={(v) => act(() => togglePartnerActive(propertyId, partner.id, v))}
          />
        )}
      </div>

      {/* Linha 2: WhatsApp + link */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          aria-label="WhatsApp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          onBlur={() => {
            const d = whatsapp.replace(/\D/g, '')
            if (d) setWhatsapp(formatWhatsappBR(d))
          }}
          inputMode="tel"
          placeholder="WhatsApp: 85 99999-8888"
          className={inputCls}
        />
        <input
          aria-label="Link (Maps ou site)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          inputMode="url"
          placeholder="ou Link (Maps/site)"
          className={inputCls}
        />
      </div>

      {/* Descrição opcional */}
      {showDesc ? (
        <input
          aria-label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className={cn(inputCls, 'mt-2')}
        />
      ) : (
        <button type="button" onClick={() => setShowDesc(true)} className="mt-1.5 text-xs font-medium text-[#1A56DB]">
          + descrição
        </button>
      )}

      {/* Instrução de entrega própria (Mercado, Restaurante, Delivery) */}
      {isOrder &&
        (showNote ? (
          <div className="mt-2 space-y-1.5">
            <label className="block text-xs font-semibold text-[#475569]" htmlFor={`note-${partner?.id ?? 'novo'}`}>
              Instrução de entrega para este estabelecimento
            </label>
            <textarea
              id={`note-${partner?.id ?? 'novo'}`}
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              rows={2}
              placeholder="Deixe vazio para usar o endereço padrão da casa"
              className={cn(inputCls, 'h-auto py-2')}
            />
            <details className="text-xs text-[#64748B]">
              <summary className="cursor-pointer font-medium text-[#1A56DB]">Ver mensagem que o hóspede vai mandar</summary>
              <p className="mt-1.5 whitespace-pre-line rounded-lg bg-[#F0FDF4] p-2.5 text-[#334155]">
                {buildGuestMessage(category, ctx.propertyName, deliveryNote.trim() || ctx.defaultAddress)}
              </p>
            </details>
          </div>
        ) : (
          <button type="button" onClick={() => setShowNote(true)} className="ml-3 mt-1.5 text-xs font-medium text-[#1A56DB]">
            + instrução de entrega
          </button>
        ))}

      {/* Linha 3: prévia + ações */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex h-[52px] w-28 shrink-0 flex-col items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-1.5">
          {active ? (
            <>
              <CategoryIcon kind={category} size={26} className="rounded-lg" />
              <span className="mt-0.5 w-full truncate text-center text-[11px] font-semibold text-[#0F172A]">{name || 'Texto do botão'}</span>
            </>
          ) : (
            <span className="text-center text-[10px] font-semibold leading-tight text-[#64748B]">Oculto para o hóspede</span>
          )}
        </div>

        <a
          href={href ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!href}
          className={cn(
            'inline-flex h-9 items-center gap-1 rounded-lg bg-[#F1F5FF] px-2.5 text-xs font-semibold text-[#1A56DB] transition active:scale-95',
            !href && 'pointer-events-none opacity-40',
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Testar
        </a>

        <div className="ml-auto flex items-center">
          <StatusIcon status={status} />
          {!isNew && (
            <button
              type="button"
              onClick={() => { save(); setExpanded(false) }}
              aria-label="Recolher"
              className={iconBtn}
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
          {isNew ? (
            <button type="button" onClick={onDiscard} aria-label="Descartar" className={iconBtn}>
              <Trash2 className="h-4 w-4" />
            </button>
          ) : confirmDelete ? (
            <span className="flex items-center gap-1 text-xs">
              <span className="text-red-700">Remover?</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => act(() => removePartner(propertyId, partner.id))}
                className="rounded-md bg-red-600 px-2 py-1 font-semibold text-white"
              >
                Sim
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                Não
              </button>
            </span>
          ) : (
            <>
              <button type="button" disabled={!canUp || busy} onClick={() => act(() => reorderPartner(propertyId, partner.id, 'up'))} aria-label="Subir" className={iconBtn}>
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" disabled={!canDown || busy} onClick={() => act(() => reorderPartner(propertyId, partner.id, 'down'))} aria-label="Descer" className={iconBtn}>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Remover" className={cn(iconBtn, 'text-red-600')}>
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {!active && !isNew && (
        <span className="mt-2 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">Oculto</span>
      )}
      {status.kind === 'error' && <p className="mt-2 text-xs font-medium text-red-600">{status.msg}</p>}
    </div>
  )
}

function StatusIcon({ status }: { status: Status }) {
  if (status.kind === 'saving') return <Loader2 className="mr-1 h-4 w-4 animate-spin text-[#94A3B8]" aria-label="Salvando" />
  if (status.kind === 'saved') return <Check className="mr-1 h-4 w-4 text-emerald-600" aria-label="Salvo" />
  return null
}

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Ativo"
      title={checked ? 'Visível no guia' : 'Oculto no guia'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60',
        checked ? 'bg-emerald-500' : 'bg-gray-300',
      )}
    >
      <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
    </button>
  )
}
