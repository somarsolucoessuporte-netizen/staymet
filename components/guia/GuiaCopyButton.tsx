'use client'

import { useState } from 'react'
import { CheckCircle, ClipboardText } from '@phosphor-icons/react/ssr'

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
  children,
  onCopied,
}: {
  text: string
  label?: string
  toast: string
  className?: string
  children?: React.ReactNode
  /** chamado após copiar (contador de uso do guia) */
  onCopied?: () => void
}) {
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(true)

  const show = (m: string, success = true) => {
    setMsg(m)
    setOk(success)
    setTimeout(() => setMsg(null), 2400)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      show(toast)
      onCopied?.()
    } catch {
      show('Selecione o texto e copie manualmente', false)
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        {children ?? (
          <>
            <CopyIcon />
            {label}
          </>
        )}
      </button>
      <div
        role="status"
        className={`fixed left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#252525] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 pointer-events-none ${
          msg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        {msg && (ok ? <CheckCircle size={18} weight="fill" color="#34D399" /> : <ClipboardText size={18} weight="bold" color="#FBBF24" />)}
        {msg}
      </div>
    </>
  )
}
