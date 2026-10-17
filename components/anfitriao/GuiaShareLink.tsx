'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, MessageCircle } from 'lucide-react'

export function GuiaShareLink({ url, propertyName }: { url: string; propertyName: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  const msg = encodeURIComponent(
    `Olá! Seja bem-vindo(a) à ${propertyName} 🌊\n\nAqui está o guia da casa com Wi-Fi, contatos e dicas da região:\n${url}`,
  )

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono break-all">{url}</div>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={copy} className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-semibold text-primary hover:opacity-90">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-sm font-semibold text-white hover:opacity-90">
          <MessageCircle className="h-4 w-4" /> Enviar
        </a>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted">
          <ExternalLink className="h-4 w-4" /> Abrir
        </a>
      </div>
    </div>
  )
}
