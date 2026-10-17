'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Line = { label: string; value: string; href: string; external?: boolean }

const HASH = '#emergencia'

/**
 * Folha inferior de emergência. Abre quando a URL tem #emergencia —
 * assim o card da grade e o item da barra inferior abrem a mesma folha sem estado compartilhado.
 */
export function GuiaEmergencySheet({ lines }: { lines: Line[] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === HASH)
    const t = setTimeout(sync, 0) // link aberto já com #emergencia
    window.addEventListener('hashchange', sync)
    return () => {
      clearTimeout(t)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const close = () => {
    setOpen(false)
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-[#0F172A]/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Emergência"
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl bg-white px-4 pt-3 shadow-2xl transition-transform duration-250 ease-out pb-[calc(16px+env(safe-area-inset-bottom,0px))] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
        <div className="mb-2 flex items-center justify-between">
          <p className="text-base font-bold text-[#0F172A]">🚨 Emergência</p>
          <button type="button" onClick={close} aria-label="Fechar" className="rounded-full p-1.5 text-gray-400 active:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {lines.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noopener noreferrer' : undefined}
              className="flex h-14 items-center justify-between active:bg-red-50"
            >
              <span className="text-[15px] font-semibold text-[#0F172A]">{l.label}</span>
              <span className="text-lg font-extrabold tabular-nums text-[#DC2626]">{l.value}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
