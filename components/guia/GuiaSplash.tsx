'use client'

import { useEffect, useState } from 'react'
import { BrandMark } from '@/components/ui/BrandMark'

const TOTAL_MS = 1850   // duração total da abertura
const LEAVE_MS = 400    // fade-out + slide final
const REDUCED_MS = 450  // prefers-reduced-motion: só um fade rápido

type Phase = 'show' | 'leaving' | 'done'

/** Abertura curta do guia público — 1 vez por sessão, toque para pular */
export function GuiaSplash({ id, propertyName }: { id: string; propertyName?: string }) {
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
      className={`guia-splash fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-gradient-to-br from-[#1A56DB] to-[#0F172A] ${
        phase === 'leaving' ? 'guia-splash-leave' : ''
      }`}
    >
      <style>{`
        @keyframes guia-logo-in { from { opacity: 0; transform: scale(.8) } to { opacity: 1; transform: scale(1) } }
        @keyframes guia-ring { 0% { opacity: .55; transform: scale(.7) } 100% { opacity: 0; transform: scale(1.9) } }
        @keyframes guia-shine { from { transform: translateX(-140%) skewX(-20deg) } to { transform: translateX(240%) skewX(-20deg) } }
        @keyframes guia-text-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes guia-leave { to { opacity: 0; transform: translateY(-24px) } }
        .guia-splash-logo { animation: guia-logo-in .5s cubic-bezier(.2,.8,.2,1) both }
        .guia-splash-ring { animation: guia-ring 1.4s ease-out .35s both }
        .guia-splash-shine { animation: guia-shine .9s ease-in-out .55s both }
        .guia-splash-text { animation: guia-text-in .45s ease-out .5s both }
        .guia-splash-leave { animation: guia-leave ${LEAVE_MS}ms ease-in forwards }
        @media (prefers-reduced-motion: reduce) {
          .guia-splash-logo, .guia-splash-ring, .guia-splash-shine, .guia-splash-text { animation: none }
          .guia-splash-ring, .guia-splash-shine { display: none }
          .guia-splash-leave { animation: guia-fade .25s linear forwards }
          @keyframes guia-fade { to { opacity: 0 } }
        }
      `}</style>

      <div className="relative flex flex-col items-center">
        {/* anel branco que pulsa atrás do ícone */}
        <span className="guia-splash-ring pointer-events-none absolute top-0 h-[72px] w-[72px] rounded-[1.4rem] border-2 border-white/70" />

        <div className="guia-splash-logo relative">
          <BrandMark width={200} tone="white" />
          {/* brilho que atravessa a logo */}
          <span className="guia-splash-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        </div>

        {propertyName && (
          <p className="guia-splash-text mt-6 max-w-[16rem] text-center text-sm font-medium text-white/80">
            Bem-vindo(a) à {propertyName}
          </p>
        )}
      </div>

      <p className="guia-splash-text absolute bottom-[calc(28px+env(safe-area-inset-bottom,0px))] text-[11px] text-white/40">
        Toque para pular
      </p>
    </div>
  )
}
