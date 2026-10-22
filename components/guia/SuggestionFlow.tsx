'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Heart, EnvelopeSimple, ImageSquare, X, CircleNotch, Star, ArrowSquareOut } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { submitSuggestion, createSuggestionPhotoUploadUrl } from '@/lib/actions/sugestoes'
import { SUGGESTION_TOPICS, REVIEW_TOPIC } from '@/lib/occurrences'
import { COVER_MAX_BYTES, COVER_MIME_TYPES } from '@/lib/property-types'
import { cn, formatFirstName } from '@/lib/utils'
import { linkAction, trackGuideEvent } from '@/lib/guide-events'

export type SuggestionUser = { fullName: string; email: string; avatarUrl: string | null }
/** Link de avaliação num site (Airbnb, Booking...) configurado pelo anfitrião */
export type ReviewChannel = { id: string; name: string; url: string }
type Mode = 'sugestao' | 'avaliacao'

const RATING_LABEL = ['', 'Ruim', 'Regular', 'Boa', 'Muito boa', 'Excelente']
type Sent = { id: string; createdAt: string; firstName: string }

const MIN = 10
const MAX = 1500

export function SuggestionFlow({
  propertyId,
  propertyName,
  user,
  mode = 'sugestao',
  channels = [],
}: {
  propertyId: string
  propertyName: string
  user: SuggestionUser | null
  mode?: Mode
  channels?: ReviewChannel[]
}) {
  const [sent, setSent] = useState<Sent | null>(null)
  const step = sent ? 3 : user ? 2 : 1
  const backHref = `/guia/${propertyId}`

  return (
    <div className="space-y-6">
      <Stepper step={step} mode={mode} />
      {step === 1 && <StepLogin propertyId={propertyId} mode={mode} />}
      {step === 2 && user && <StepWrite propertyId={propertyId} user={user} onSent={setSent} mode={mode} />}
      {step === 3 && sent && <StepThanks propertyId={propertyId} sent={sent} propertyName={propertyName} backHref={backHref} mode={mode} channels={channels} />}
    </div>
  )
}

function Stepper({ step, mode }: { step: number; mode: Mode }) {
  const steps = ['Entrar', mode === 'avaliacao' ? 'Avaliar' : 'Escrever', 'Enviado']
  return (
    <ol className="flex items-center justify-center gap-2 text-[11px] font-semibold" aria-label="Etapas">
      {steps.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'current' : 'todo'
        return (
          <li key={label} className="flex items-center gap-2">
            <span className={cn('flex items-center gap-1.5', state === 'todo' ? 'text-[#94A3B8]' : 'text-[#1A56DB]')} aria-current={state === 'current' ? 'step' : undefined}>
              <span className={cn('h-2.5 w-2.5 rounded-full', state === 'todo' ? 'border-2 border-[#CBD5E1]' : 'bg-[#1A56DB]')} />
              {label}
            </span>
            {n < steps.length && <span className="h-px w-5 bg-[#E2E8F0]" />}
          </li>
        )
      })}
    </ol>
  )
}

// ─── Passo 1: entrar ───

function StepLogin({ propertyId, mode }: { propertyId: string; mode: Mode }) {
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const review = mode === 'avaliacao'
  const next = `/guia/${propertyId}/${review ? 'avaliar' : 'sugestoes'}`

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    const callback = new URL('/auth/callback', window.location.origin)
    callback.searchParams.set('next', next)
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <div className="space-y-5 text-center">
      <IconCircle>
        {review ? <Star size={40} weight="duotone" color="#CA8A04" /> : <Lightbulb size={40} weight="duotone" color="#1A56DB" />}
      </IconCircle>
      <div>
        <h1 className="text-xl font-extrabold">{review ? 'Avalie aqui no guia' : 'Caixinha de sugestões'}</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#475569]">
          {review
            ? 'Para deixar suas estrelas e um comentário para o anfitrião, entre com um toque na sua conta Google.'
            : 'Para enviar sua sugestão, precisamos que você esteja conectado. É rápido: um toque com sua conta Google.'}
        </p>
      </div>

      <GoogleSignInButton label="Entrar com Google" next={next} />

      {status === 'sent' ? (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra o e-mail neste celular e toque no link para continuar.
        </p>
      ) : showEmail ? (
        <form onSubmit={sendLink} className="space-y-2 text-left">
          <label htmlFor="sug-email" className="text-xs font-semibold text-[#475569]">Seu e-mail</label>
          <input
            id="sug-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15"
          />
          {status === 'error' && <p className="text-xs text-red-600">Não foi possível enviar o link. Confira o e-mail e tente de novo.</p>}
          <button type="submit" disabled={status === 'sending'} className="h-12 w-full rounded-xl bg-[#0F172A] text-sm font-semibold text-white disabled:opacity-60">
            {status === 'sending' ? 'Enviando…' : 'Enviar link de acesso'}
          </button>
          <p className="text-center text-[11px] text-[#94A3B8]">Sem senha: você recebe um link para entrar.</p>
        </form>
      ) : (
        <button type="button" onClick={() => setShowEmail(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A56DB]">
          <EnvelopeSimple size={18} /> Entrar com e-mail
        </button>
      )}
    </div>
  )
}

// ─── Passo 2: escrever ───

function StepWrite({ propertyId, user, onSent, mode }: { propertyId: string; user: SuggestionUser; onSent: (s: Sent) => void; mode: Mode }) {
  const router = useRouter()
  const review = mode === 'avaliacao'
  const [rating, setRating] = useState(0)
  const [topic, setTopic] = useState<string | null>(review ? REVIEW_TOPIC : null)
  const [text, setText] = useState('')
  const [consent, setConsent] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const firstName = formatFirstName(user.fullName)
  const length = text.trim().length
  const valid = review
    ? rating >= 1 && length <= MAX && consent
    : !!topic && length >= MIN && length <= MAX && consent

  const signOut = async () => {
    await createClient().auth.signOut()
    router.refresh()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!COVER_MIME_TYPES.includes(file.type)) return setError('Use uma imagem JPG, PNG ou WEBP.')
    if (file.size > COVER_MAX_BYTES) return setError('A imagem deve ter no máximo 5MB.')
    setError(null)
    setUploading(true)
    try {
      const prep = await createSuggestionPhotoUploadUrl({ type: file.type, size: file.size })
      if (!prep.ok) return setError(prep.error)
      const { error: upErr } = await createClient().storage.from(prep.bucket).uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type })
      if (upErr) return setError('Falha no envio da foto.')
      setPhoto(prep.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  const submit = () =>
    start(async () => {
      setError(null)
      const r = await submitSuggestion({
        propertyId,
        topic: topic as (typeof SUGGESTION_TOPICS)[number] | typeof REVIEW_TOPIC,
        text,
        photoUrl: photo ?? '',
        consent: consent as true,
        rating: review ? rating : undefined,
      })
      if (!r.ok) return setError(r.error)
      onSent({ id: r.id, createdAt: r.createdAt, firstName: r.firstName })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFF6FF] font-bold text-[#1A56DB]">{firstName.charAt(0).toUpperCase()}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">Olá, {firstName}!</p>
          <button type="button" onClick={signOut} className="text-xs text-[#64748B] underline-offset-2 hover:underline">Não é você? Sair</button>
        </div>
      </div>

      {review ? (
        <fieldset className="rounded-2xl bg-white p-4 text-center ring-1 ring-black/5">
          <legend className="sr-only">Sua nota</legend>
          <p className="text-sm font-bold">Como foi a sua estadia?</p>
          <div className="mt-3 flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
                aria-pressed={rating === n}
                onClick={() => setRating(n)}
                className="rounded-xl p-1 transition active:scale-90"
              >
                <Star size={40} weight={n <= rating ? 'fill' : 'regular'} color={n <= rating ? '#F59E0B' : '#CBD5E1'} />
              </button>
            ))}
          </div>
          <p className="mt-1 h-5 text-sm font-semibold text-[#B45309]">{RATING_LABEL[rating]}</p>
        </fieldset>
      ) : (
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Sobre o que é sua sugestão?</legend>
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                'rounded-full px-3.5 py-2 text-[13px] font-semibold transition active:scale-95',
                topic === t ? 'bg-[#1A56DB] text-white' : 'bg-white text-[#334155] ring-1 ring-[#E2E8F0]',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      )}

      <div>
        <label htmlFor="sug-text" className="mb-2 block text-sm font-bold">{review ? 'Comentário (opcional)' : 'Sua sugestão'}</label>
        <textarea
          id="sug-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={5}
          placeholder={review ? 'O que você mais gostou? O que podemos melhorar?' : 'Conte o que podemos melhorar na casa ou na estadia…'}
          className="w-full rounded-2xl border border-[#E2E8F0] bg-white p-3.5 text-[15px] leading-relaxed focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15"
        />
        <p className={cn('mt-1 text-right text-[11px]', length > 0 && length < MIN ? 'text-amber-600' : 'text-[#94A3B8]')}>
          {!review && length < MIN ? `mínimo de ${MIN} caracteres · ` : ''}{length}/{MAX}
        </p>
      </div>

      <div>
        {photo ? (
          <div className="relative h-36 overflow-hidden rounded-2xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Foto anexada" className="h-full w-full object-cover" />
            <button type="button" onClick={() => setPhoto(null)} aria-label="Remover foto" className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white">
              <X size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" accept={COVER_MIME_TYPES.join(',')} className="hidden" onChange={onFile} />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1A56DB]/30 text-sm font-semibold text-[#1A56DB] disabled:opacity-60"
            >
              {uploading ? <CircleNotch size={18} className="animate-spin" /> : <ImageSquare size={18} weight="duotone" />}
              {uploading ? 'Enviando foto…' : 'Adicionar foto (opcional)'}
            </button>
          </>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-white p-3.5 text-sm text-[#334155] ring-1 ring-black/5">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#1A56DB]" />
        Concordo em compartilhar meus dados com o anfitrião para retorno.
      </label>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!valid || pending || uploading}
        className="h-12 w-full rounded-2xl bg-[#1A56DB] text-[15px] font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? 'Enviando…' : review ? 'Enviar avaliação' : 'Enviar sugestão'}
      </button>
    </div>
  )
}

// ─── Passo 3: obrigado ───

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  left: `${6 + ((i * 37) % 88)}%`,
  delay: `${(i % 5) * 0.06}s`,
  color: i % 2 === 0 ? '#1A56DB' : '#F59E0B',
  rotate: `${(i * 47) % 360}deg`,
  drift: `${((i % 4) - 1.5) * 18}px`,
}))

function StepThanks({ propertyId, sent, propertyName, backHref, mode, channels }: { propertyId: string; sent: Sent; propertyName: string; backHref: string; mode: Mode; channels: ReviewChannel[] }) {
  const review = mode === 'avaliacao'
  const when = new Date(sent.createdAt)
  const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Fortaleza' }).format(when)
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza' }).format(when)

  return (
    <div className="relative mx-auto max-w-sm space-y-5 overflow-hidden py-2 text-center">
      <style>{`
        @keyframes sug-pop { 0% { opacity: 0; transform: scale(.6) } 60% { opacity: 1; transform: scale(1.1) } 100% { transform: scale(1) } }
        @keyframes sug-confetti { 0% { opacity: 0; transform: translate(0, -10px) rotate(0) } 15% { opacity: 1 }
          100% { opacity: 0; transform: translate(var(--drift), 170px) rotate(var(--rot)) } }
        .sug-pop { animation: sug-pop .5s cubic-bezier(.2,.8,.2,1) both }
        .sug-confetti { animation: sug-confetti 1s ease-out both }
        @media (prefers-reduced-motion: reduce) { .sug-pop { animation: none } .sug-confetti { display: none } }
      `}</style>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="sug-confetti absolute top-4 h-2.5 w-1.5 rounded-sm"
            style={{ left: c.left, background: c.color, animationDelay: c.delay, ['--rot' as string]: c.rotate, ['--drift' as string]: c.drift }}
          />
        ))}
      </div>

      <div className="sug-pop mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
        <Heart size={72} weight="duotone" color="#1A56DB" />
      </div>

      <h1 className="text-2xl font-extrabold">Obrigado, {sent.firstName}!</h1>
      <p className="text-[15px] leading-relaxed text-[#334155]">
        Sua {review ? 'avaliação' : 'sugestão'} chegou direitinho ao anfitrião da {propertyName}.
      </p>
      {review ? (
        channels.length > 0 && (
          <div className="space-y-2 text-left">
            <p className="text-center text-[15px] leading-relaxed text-[#334155]">
              Se puder, deixe também sua avaliação no site em que você reservou. Ajuda muito o anfitrião:
            </p>
            {channels.map((c) => (
              <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackGuideEvent(propertyId, { cardKey: 'avaliar', action: linkAction(c.url), partnerId: c.id })} className="flex h-12 items-center justify-between rounded-2xl bg-white px-4 text-[15px] font-semibold ring-1 ring-black/10 active:scale-[0.98]">
                {c.name} <ArrowSquareOut size={18} color="#64748B" />
              </a>
            ))}
          </div>
        )
      ) : (
        <p className="text-[15px] leading-relaxed text-[#334155]">
          É com a opinião de hóspedes como você que cada estadia fica melhor que a anterior. Vamos ler com todo o carinho e, se for preciso, entramos em contato.
        </p>
      )}
      <p className="text-[15px] italic text-[#475569]">Aproveite o restante da sua estadia!</p>

      <a href={backHref} className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#1A56DB] text-[15px] font-semibold text-white active:scale-[0.98]">
        Voltar ao guia
      </a>

      <p className="text-[11px] text-[#94A3B8]">
        Protocolo #{sent.id.slice(0, 6).toUpperCase()} · enviado em {date} às {time}
      </p>
    </div>
  )
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
      {children}
    </div>
  )
}
