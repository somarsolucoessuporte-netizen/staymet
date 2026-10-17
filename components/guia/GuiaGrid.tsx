'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Copy, ExternalLink, MapPin, Phone, Send } from 'lucide-react'
import { GuiaSheet } from '@/components/guia/GuiaSheet'
import { GuiaCopyButton } from '@/components/guia/GuiaCopyButton'
import { CategoryIcon } from '@/components/guia/CategoryIcon'

// Dados montados no servidor (app/guia/[id]/page.tsx); ícones já vêm renderizados
export type GuiaSheetData =
  | { type: 'wifi'; network: string | null; password: string | null }
  | { type: 'entregador'; text: string }
  | {
      type: 'contato'
      name: string
      description: string | null
      whatsappHref: string | null
      primaryLabel: string
      message: string | null
      showMessage: boolean
      phone: string | null
      externalUrl: string | null
    }
  | { type: 'dica'; name: string; description: string | null; externalUrl: string | null; whatsappUrl: string | null; phone: string | null }
  | { type: 'emergencia'; lines: { label: string; value: string; href: string; kind: string; external?: boolean }[] }

export type GuiaCardData = {
  id: string
  title: string
  caption: string
  group: 'principal' | 'dicas'
  tone?: 'red'
  icon: React.ReactNode
  sheetTitle: string
  /** conteúdo do bottom sheet; ausente quando o card tem href */
  sheet?: GuiaSheetData
  /** card que navega para outra página (ex.: caixinha de sugestões) em vez de abrir sheet */
  href?: string
}

const CARD =
  'flex h-full min-h-[112px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border bg-white px-2 py-2.5 shadow-sm transition active:scale-95'

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
const isMaps = (url: string) => /maps|goo\.gl/i.test(url)

export function GuiaGrid({ cards }: { cards: GuiaCardData[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const close = useCallback(() => setOpenId(null), [])
  const open = cards.find((c) => c.id === openId)

  // Link compartilhado com #emergencia abre direto a folha de emergência
  useEffect(() => {
    if (window.location.hash !== '#emergencia') return
    const t = setTimeout(() => setOpenId('emergencia'), 0)
    return () => clearTimeout(t)
  }, [])

  const principal = cards.filter((c) => c.group === 'principal')
  const dicas = cards.filter((c) => c.group === 'dicas')

  const renderCard = (c: GuiaCardData) => {
    const cls = `${CARD} ${c.tone === 'red' ? 'border-red-200 bg-red-50' : 'border-[#E2E8F0]'}`
    const body = (
      <>
      {c.icon}
      <span
        className={`mt-0.5 line-clamp-2 w-full break-words text-center text-[13px] font-semibold leading-tight ${
          c.tone === 'red' ? 'text-[#B91C1C]' : 'text-[#0F172A]'
        }`}
      >
        {c.title}
      </span>
      <span className="w-full truncate text-center text-[11px] text-[#64748B]">{c.caption}</span>
      </>
    )
    return c.href ? (
      <a key={c.id} href={c.href} className={cls}>{body}</a>
    ) : (
      <button key={c.id} type="button" onClick={() => setOpenId(c.id)} className={cls}>{body}</button>
    )
  }

  return (
    <>
      <main id="contatos" className="grid grid-cols-2 gap-2.5 px-3 pb-3 pt-3">
        {principal.map(renderCard)}
        {dicas.length > 0 && (
          <>
            <p className="col-span-2 pl-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Dicas & Roteiros
            </p>
            {dicas.map(renderCard)}
          </>
        )}
      </main>

      <GuiaSheet open={!!open} onClose={close} title={open?.sheetTitle ?? ''}>
        {open?.sheet && <SheetBody card={open} sheet={open.sheet} />}
      </GuiaSheet>
    </>
  )
}

// ─── Conteúdo de cada folha ───

const primaryBtn =
  'flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white transition active:scale-[0.98]'
const secondaryBtn =
  'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#F1F5FF] text-sm font-semibold text-[#1A56DB] transition active:scale-[0.98]'
const copyBtn =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#F1F5FF] px-3 text-xs font-semibold text-[#1A56DB] active:scale-95'

function SheetBody({ card, sheet: s }: { card: GuiaCardData; sheet: GuiaSheetData }) {
  switch (s.type) {
    case 'wifi':
      return <WifiSheet network={s.network} password={s.password} />
    case 'entregador':
      return <EntregadorSheet text={s.text} />
    case 'contato':
      return <ContatoSheet icon={card.icon} data={s} />
    case 'dica':
      return <DicaSheet icon={card.icon} data={s} />
    case 'emergencia':
      return <EmergenciaSheet lines={s.lines} />
  }
}

function WifiSheet({ network, password }: { network: string | null; password: string | null }) {
  return (
    <div className="space-y-4">
      <div className="divide-y divide-gray-100 rounded-2xl border border-[#E2E8F0]">
        <div className="flex items-center gap-3 p-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Rede</p>
            <p className="truncate text-base font-bold">{network || '—'}</p>
          </div>
          {network && (
            <GuiaCopyButton text={network} toast="Nome da rede copiado" className={copyBtn}>
              <Copy size={14} /> Copiar
            </GuiaCopyButton>
          )}
        </div>
        <div className="flex items-center gap-3 p-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Senha</p>
            <p className="break-all font-mono text-xl font-bold tracking-wide">{password || 'Rede aberta'}</p>
          </div>
          {password && (
            <GuiaCopyButton text={password} toast="Senha copiada" className={copyBtn}>
              <Copy size={14} /> Copiar
            </GuiaCopyButton>
          )}
        </div>
      </div>

      <ol className="space-y-2.5">
        {[
          'Abra as configurações de Wi-Fi do celular',
          `Escolha a rede "${network || 'da casa'}"`,
          password ? 'Cole a senha' : 'Conecte (rede sem senha)',
        ].map((step, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-[#334155]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-bold text-[#1A56DB]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

function EntregadorSheet({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#475569]">
        Ao pedir comida, gás ou mercado, envie este texto ao entregador para ele achar a casa.
      </p>
      <div className="whitespace-pre-line rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[15px] leading-relaxed text-[#0F172A]">
        {text}
      </div>
      <div className="flex gap-2">
        <GuiaCopyButton text={text} toast="Texto copiado" className={secondaryBtn}>
          <Copy size={16} /> Copiar texto
        </GuiaCopyButton>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${secondaryBtn} bg-[#25D366] text-white`}
        >
          <Send size={16} /> Enviar no WhatsApp
        </a>
      </div>
    </div>
  )
}

function SheetHeader({ icon, name, description }: { icon: React.ReactNode; name: string; description: string | null }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="min-w-0 pt-1">
        <p className="text-base font-bold leading-tight">{name}</p>
        {description && <p className="mt-1 text-sm text-[#64748B]">{description}</p>}
      </div>
    </div>
  )
}

function ContatoSheet({ icon, data }: { icon: React.ReactNode; data: Extract<GuiaSheetData, { type: 'contato' }> }) {
  const [showMsg, setShowMsg] = useState(false)
  return (
    <div className="space-y-4">
      <SheetHeader icon={icon} name={data.name} description={data.description} />

      {data.showMessage && data.message && (
        <div className="rounded-2xl bg-[#F8FAFC] ring-1 ring-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setShowMsg((v) => !v)}
            aria-expanded={showMsg}
            className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-[#475569]"
          >
            Mensagem que será enviada
            <ChevronDown size={16} className={`transition ${showMsg ? 'rotate-180' : ''}`} />
          </button>
          {showMsg && (
            <p className="whitespace-pre-line border-t border-[#E2E8F0] px-3.5 py-3 text-xs leading-relaxed text-[#334155]">
              {data.message}
            </p>
          )}
        </div>
      )}

      {data.whatsappHref && (
        <a href={data.whatsappHref} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} bg-[#25D366]`}>
          <WhatsAppGlyph /> {data.primaryLabel}
        </a>
      )}

      {(data.phone || data.externalUrl) && (
        <div className="flex gap-2">
          {data.phone && (
            <a href={telHref(data.phone)} className={secondaryBtn}>
              <Phone size={16} /> Ligar
            </a>
          )}
          {data.externalUrl && (
            <a href={data.externalUrl} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
              <MapPin size={16} /> {isMaps(data.externalUrl) ? 'Ver no mapa' : 'Abrir site'}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function DicaSheet({ icon, data }: { icon: React.ReactNode; data: Extract<GuiaSheetData, { type: 'dica' }> }) {
  return (
    <div className="space-y-4">
      <SheetHeader icon={icon} name={data.name} description={data.description} />
      {data.externalUrl && (
        <a href={data.externalUrl} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} bg-[#1A56DB]`}>
          {isMaps(data.externalUrl) ? <MapPin size={18} /> : <ExternalLink size={18} />}
          {isMaps(data.externalUrl) ? 'Abrir rota no Maps' : 'Abrir site'}
        </a>
      )}
      {(data.whatsappUrl || data.phone) && (
        <div className="flex gap-2">
          {data.whatsappUrl && (
            <a href={data.whatsappUrl} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
              <WhatsAppGlyph /> WhatsApp
            </a>
          )}
          {data.phone && (
            <a href={telHref(data.phone)} className={secondaryBtn}>
              <Phone size={16} /> Ligar
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function EmergenciaSheet({ lines }: { lines: Extract<GuiaSheetData, { type: 'emergencia' }>['lines'] }) {
  return (
    <div className="divide-y divide-gray-100">
      {lines.map((l) => (
        <div key={l.href} className="flex h-16 items-center justify-between gap-3">
          <CategoryIcon kind={l.kind} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-[#0F172A]">{l.label}</p>
            {!l.external && <p className="text-xl font-extrabold tabular-nums text-[#DC2626]">{l.value}</p>}
          </div>
          <a
            href={l.href}
            target={l.external ? '_blank' : undefined}
            rel={l.external ? 'noopener noreferrer' : undefined}
            className={`inline-flex h-11 items-center gap-1.5 rounded-2xl px-4 text-sm font-semibold text-white active:scale-95 ${
              l.external ? 'bg-[#25D366]' : 'bg-[#DC2626]'
            }`}
          >
            {l.external ? <WhatsAppGlyph /> : <Phone size={16} />}
            {l.external ? 'WhatsApp' : 'Ligar'}
          </a>
        </div>
      ))}
    </div>
  )
}

function WhatsAppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.45-5.02c0-5.2 4.24-9.44 9.46-9.44 2.52 0 4.9.99 6.68 2.77a9.37 9.37 0 0 1 2.77 6.68c0 5.21-4.24 9.44-9.46 9.44m8.04-17.48A11.3 11.3 0 0 0 12.04.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.6 23.6l6-1.57a11.32 11.32 0 0 0 5.43 1.38h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.32-8.03" />
    </svg>
  )
}
