'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSearchParams } from 'next/navigation'
import { Send, Check, ListTodo } from 'lucide-react'

export default function GuestSolicitacoesPage() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [type, setType] = useState<string>('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!type || !message.trim()) return
    setLoading(true)
    try {
      await fetch('/api/guest-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message,
          reservationId: 'placeholder', // In production, fetch from accessCode
        }),
      })
      setSent(true)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="p-6 pt-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold mb-2">Solicitação enviada!</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Seu pedido foi recebido. Em breve entraremos em contato.
        </p>
        <Button onClick={() => setSent(false)} variant="outline">Fazer outra solicitação</Button>
      </div>
    )
  }

  return (
    <div className="p-4 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Solicitações</h1>
        <p className="text-sm text-muted-foreground">Precisou de algo? Nos avise!</p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de solicitação</label>
            <Select onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="O que você precisa?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LIMPEZA">🧹 Limpeza extra</SelectItem>
                <SelectItem value="MANUTENCAO">🔧 Manutenção</SelectItem>
                <SelectItem value="INFORMACAO">ℹ️ Informação</SelectItem>
                <SelectItem value="OUTRO">💬 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mensagem</label>
            <Textarea
              placeholder="Descreva o que precisa..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!type || !message.trim()}
            className="w-full"
            size="lg"
            variant="accent"
          >
            <Send className="h-4 w-4" />
            Enviar Solicitação
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
