'use client'

import { useEffect, useState } from 'react'
import { BrandMark } from '@/components/ui/BrandMark'

const TOTAL_MS = 2300   // duração total da abertura
const LEAVE_MS = 400    // fade-out + slide final
const REDUCED_MS = 450  // prefers-reduced-motion: só um fade rápido

type Phase = 'show' | 'leaving' | 'done'

/** Abertura curta do guia público — 1 vez por sessão, toque para pular */
export function GuiaSplash({ id, propertyName, coverUrl }: { id: string; propertyName?: string; coverUrl?: string | null }) {
  // Renderiza visível já no servidor para o guia não "piscar" antes da abertura
  const [phase, setPhase] = useState<Phase>('show')
  const key = `guia_splash_${id}`

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(key) === '1'
      sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage bloqueado (aba privada etc.): mostra a abertura normalmente
    }

    if (seen) {
      const t = setTimeout(() => setPhase('done'), 0)
      return () => clearTimeout(t)
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = reduced ? REDUCED_MS : TOTAL_MS
    const leave = setTimeout(() => setPhase('leaving'), total - LEAVE_MS)
    const done = setTimeout(() => setPhase('done'), total)
    return () => {
      clearTimeout(leave)
      clearTimeout(done)
    }
  }, [key])

  // Depois do fade-out, remove de vez
  useEffect(() => {
    if (phase !== 'leaving') return
    const t = setTimeout(() => setPhase('done'), LEAVE_MS)
    return () => clearTimeout(t)
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      role="presentation"
      onClick={() => setPhase('leaving')}
      className={`guia-splash fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-[#0B1B3A] ${
        phase === 'leaving' ? 'guia-splash-leave' : ''
      }`}
    >
      <style>{`
        @keyframes guia-zoom { from { transform: scale(1.12) } to { transform: scale(1) } }
        @keyframes guia-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes guia-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        @keyframes guia-line { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes guia-leave { to { opacity: 0 } }
        .guia-splash-photo { animation: guia-fade-in .5s ease-out both, guia-zoom ${TOTAL_MS + 400}ms cubic-bezier(.2,.7,.2,1) both }
        .guia-splash-brand { animation: guia-rise .6s cubic-bezier(.2,.8,.2,1) both }
        .guia-splash-k { animation: guia-rise .55s cubic-bezier(.2,.8,.2,1) .35s both }
        .guia-splash-name { animation: guia-rise .6s cubic-bezier(.2,.8,.2,1) .5s both }
        .guia-splash-line { transform-origin: center; animation: guia-line .6s cubic-bezier(.2,.8,.2,1) .75s both }
        .guia-splash-foot { animation: guia-fade-in .5s ease-out .7s both }
        .guia-splash-leave { animation: guia-leave ${LEAVE_MS}ms ease-in forwards }
        @media (prefers-reduced-motion: reduce) {
          .guia-splash-photo, .guia-splash-brand, .guia-splash-k, .guia-splash-name, .guia-splash-line, .guia-splash-foot { animation: none }
          .guia-splash-leave { animation: guia-leave .25s linear forwards }
        }
      `}</style>

      {/* Foto de capa da casa (ou só o fundo azul) com zoom lento */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="guia-splash-photo absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="guia-splash-photo absolute inset-0 bg-gradient-to-br from-[#1A56DB] via-[#0F3A7A] to-[#0B1B3A]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3A] via-[#0B1B3A]/60 to-[#0B1B3A]/45" />

      {/* Marca no alto, com brilho correndo dentro das letras */}
      <div className="guia-splash-brand absolute inset-x-0 top-[24%] flex justify-center">
        <BrandMark width={190} tone="white" shine />
      </div>

      <div className="absolute inset-x-0 bottom-[20%] flex flex-col items-center px-8 text-center text-white">
        <p className="guia-splash-k text-[11px] font-semibold uppercase tracking-[0.35em] text-white/75">Bem-vindo(a) à</p>
        {propertyName && (
          <h1 className="guia-splash-name mt-3 max-w-[18rem] text-[30px] font-extrabold leading-[1.1] tracking-tight [text-wrap:balance] [text-shadow:0_2px_16px_rgba(0,0,0,.35)]">
            {propertyName}
          </h1>
        )}
        <span className="guia-splash-line mt-5 h-[2px] w-12 rounded-full bg-[#F59E0B]" />
      </div>

      <p className="guia-splash-foot absolute inset-x-0 bottom-[calc(24px+env(safe-area-inset-bottom,0px))] text-center text-[11px] text-white/45">
        Guia digital da casa · toque para entrar
      </p>
    </div>
  )
}
