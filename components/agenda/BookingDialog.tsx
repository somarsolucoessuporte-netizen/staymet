'use client'

import { useState, useTransition } from 'react'
import { WarningCircle, CircleNotch } from '@phosphor-icons/react/ssr'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { createManualBooking, type ManualBookingInput } from '@/lib/actions/agenda'
import { addDays, MANUAL_SOURCES, SOURCE_META } from '@/lib/agenda'
import { cn } from '@/lib/utils'

export type BookingDialogKind = 'RESERVA' | 'BLOQUEIO'

const inputCls =
  'h-11 w-full min-w-0 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm placeholder:text-gray-400 focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15'
const labelCls = 'mb-1 block text-xs font-semibold text-[#475569]'

/** "+ Reserva" (Direto/OLX/Outro) e "Bloquear datas"; avisa se conflitar e pede confirmação */
export function BookingDialog({
  propertyId,
  kind,
  defaultStart,
  onClose,
}: {
  propertyId: string
  kind: BookingDialogKind | null
  defaultStart: string
  onClose: () => void
}) {
  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="font-display max-w-md gap-3 rounded-3xl p-5 text-[#0F172A]">
        {kind && <BookingForm key={`${kind}-${defaultStart}`} propertyId={propertyId} kind={kind} defaultStart={defaultStart} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function BookingForm({
  propertyId,
  kind,
  defaultStart,
  onDone,
}: {
  propertyId: string
  kind: BookingDialogKind
  defaultStart: string
  onDone: () => void
}) {
  const isBlock = kind === 'BLOQUEIO'
  const [source, setSource] = useState<(typeof MANUAL_SOURCES)[number]>('DIRETO')
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(addDays(defaultStart, isBlock ? 1 : 2))
  const [guestName, setGuestName] = useState('')
  const [guestContact, setGuestContact] = useState('')
  const [guestsCount, setGuestsCount] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [overlaps, setOverlaps] = useState<string[] | null>(null)
  const [busy, startTransition] = useTransition()
  const { toast } = useToast()

  const submit = (confirmOverlap: boolean) => {
    setError(null)
    const input: ManualBookingInput = {
      kind,
      source: isBlock ? undefined : source,
      startDate,
      endDate,
      guestName,
      guestContact,
      guestsCount: guestsCount ? Number(guestsCount) : null,
      amount,
      notes,
    }
    startTransition(async () => {
      const res = await createManualBooking(propertyId, input, confirmOverlap)
      if (!res.ok) {
        if (res.overlaps) setOverlaps(res.overlaps)
        else setError(res.error)
        return
      }
      toast({
        title: isBlock ? 'Datas bloqueadas' : 'Reserva salva',
        description: res.conflicts ? 'Atenção: há conflito de datas neste imóvel.' : undefined,
        variant: res.conflicts ? 'error' : 'success',
      })
      onDone()
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(false)
      }}
      className="space-y-3"
    >
      <DialogHeader className="text-left">
        <DialogTitle className="text-lg font-extrabold">{isBlock ? 'Bloquear datas' : 'Nova reserva'}</DialogTitle>
        <DialogDescription className="text-xs text-[#64748B]">
          {isBlock
            ? 'As datas ficam indisponíveis em todos os canais conectados.'
            : 'Reserva fechada fora das plataformas. Ela bloqueia as datas nos canais conectados.'}
        </DialogDescription>
      </DialogHeader>

      {!isBlock && (
        <div>
          <span className={labelCls}>Origem</span>
          <div className="grid grid-cols-3 gap-2">
            {MANUAL_SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={cn(
                  'flex h-10 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition',
                  source === s ? 'border-[#1A56DB] bg-[#F1F5FF] text-[#1A56DB]' : 'border-[#E2E8F0] text-[#475569]',
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SOURCE_META[s].color }} />
                {SOURCE_META[s].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isBlock && (
        <>
          <div>
            <label className={labelCls} htmlFor="bk-name">Nome do hóspede</label>
            <input id="bk-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className={inputCls} placeholder="Ex.: Maria Souza" autoFocus />
          </div>
          <div>
            <label className={labelCls} htmlFor="bk-contact">Contato (WhatsApp ou telefone)</label>
            <input id="bk-contact" value={guestContact} onChange={(e) => setGuestContact(e.target.value)} className={inputCls} inputMode="tel" placeholder="85 99999-8888" />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls} htmlFor="bk-start">{isBlock ? 'De' : 'Check-in'}</label>
          <input
            id="bk-start"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (e.target.value && endDate <= e.target.value) setEndDate(addDays(e.target.value, 1))
            }}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="bk-end">{isBlock ? 'Até (liberado neste dia)' : 'Check-out'}</label>
          <input id="bk-end" type="date" value={endDate} min={startDate ? addDays(startDate, 1) : undefined} onChange={(e) => setEndDate(e.target.value)} className={inputCls} required />
        </div>
      </div>

      {!isBlock && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls} htmlFor="bk-guests">Hóspedes</label>
            <input id="bk-guests" type="number" min={1} max={50} value={guestsCount} onChange={(e) => setGuestsCount(e.target.value)} className={inputCls} inputMode="numeric" />
          </div>
          <div>
            <label className={labelCls} htmlFor="bk-amount">Valor (R$)</label>
            <input id="bk-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} inputMode="decimal" placeholder="0,00" />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls} htmlFor="bk-notes">{isBlock ? 'Motivo (opcional)' : 'Observações (opcional)'}</label>
        <input id="bk-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder={isBlock ? 'Ex.: manutenção, uso do proprietário' : ''} />
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {overlaps ? (
        <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-3">
          <p className="flex items-center gap-1.5 text-sm font-bold text-red-700">
            <WarningCircle size={18} weight="fill" /> Essas datas já estão ocupadas
          </p>
          <ul className="space-y-0.5 text-xs text-red-800">
            {overlaps.map((o) => <li key={o}>• {o}</li>)}
          </ul>
          <p className="text-xs text-red-700">Salvar assim vai gerar um conflito de datas.</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onClick={() => setOverlaps(null)} className="h-10 rounded-xl bg-white text-sm font-semibold text-[#475569] ring-1 ring-black/10">
              Rever datas
            </button>
            <button type="button" disabled={busy} onClick={() => submit(true)} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60">
              {busy && <CircleNotch size={16} className="animate-spin" />} Salvar mesmo assim
            </button>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          disabled={busy}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A56DB] text-sm font-semibold text-white transition hover:bg-[#1648C0] active:scale-[0.98] disabled:opacity-60"
        >
          {busy && <CircleNotch size={18} className="animate-spin" />}
          {isBlock ? 'Bloquear datas' : 'Salvar reserva'}
        </button>
      )}
    </form>
  )
}
