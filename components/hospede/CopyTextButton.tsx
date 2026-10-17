'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyTextButton({ text, label = 'Copiar texto' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard indisponível (ex: contexto não seguro)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 mt-3 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-accent hover:bg-muted transition-colors"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copiado!' : label}
    </button>
  )
}
