'use client'

import { useState } from 'react'

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
)

/** Botão de copiar com toast flutuante — usado no Wi-Fi e no texto do entregador */
export function GuiaCopyButton({
  text,
  label,
  toast,
  className,
}: {
  text: string
  label: string
  toast: string
  className?: string
}) {
  const [msg, setMsg] = useState<string | null>(null)

  const show = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 2400)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      show(toast)
    } catch {
      show('📋 Selecione o texto e copie manualmente')
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        <CopyIcon />
        {label}
      </button>
      <div
        role="status"
        className={`fixed left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#252525] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 pointer-events-none ${
          msg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        {msg}
      </div>
    </>
  )
}
