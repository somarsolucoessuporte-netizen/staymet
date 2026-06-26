'use client'

import { useState } from 'react'
import { MessageSquare, Check, Copy } from 'lucide-react'

interface TaskLinkButtonProps {
  taskId: string
  assigneeName?: string | null
  assigneePhone?: string | null
}

export function TaskLinkButton({ taskId, assigneeName, assigneePhone }: TaskLinkButtonProps) {
  const [generating, setGenerating] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/magic-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PRESTADOR',
          taskId,
          prestadorName: assigneeName ?? undefined,
          prestadorPhone: assigneePhone ?? undefined,
          expiresInDays: 7,
        }),
      })
      const data = await res.json()
      setUrl(data.url)
      setWhatsappUrl(data.whatsappUrl)
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank')
      }
    } finally {
      setGenerating(false)
    }
  }

  const copyUrl = () => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (url) {
    return (
      <div className="mt-2.5 p-2.5 bg-green-50 rounded-xl border border-green-100">
        <p className="text-[11px] text-green-600 font-medium mb-1.5">Link gerado!</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 text-[10px] bg-transparent text-green-800 outline-none truncate"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={copyUrl}
            className="flex-shrink-0 flex items-center gap-1 text-[11px] text-green-700 font-medium hover:text-green-900"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1.5 text-[11px] text-green-700 font-medium hover:underline"
          >
            <MessageSquare size={11} />
            Abrir WhatsApp novamente
          </a>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={generate}
      disabled={generating}
      className="flex items-center gap-1.5 text-xs text-[#1A56DB] font-medium hover:underline disabled:opacity-50 mt-1"
    >
      <MessageSquare size={12} />
      {generating ? 'Gerando...' : 'Enviar link WhatsApp'}
    </button>
  )
}
