'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Phone, MessageSquare, AlertCircle, Send } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function GuestSuportePage() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ text: string; from: 'guest' | 'host' }>>([
    { text: 'Olá! Estou aqui para ajudar. Como posso te auxiliar?', from: 'host' },
  ])
  const [sending, setSending] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    const text = message
    setMessages((prev) => [...prev, { text, from: 'guest' }])
    setMessage('')

    // Simulate host response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: 'Recebi sua mensagem! Estou verificando e já te respondo.', from: 'host' },
      ])
    }, 2000)

    setSending(false)
  }

  return (
    <div className="p-4 pt-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Suporte</h1>
        <p className="text-sm text-muted-foreground">Fale com o anfitrião</p>
      </div>

      {/* Emergency button */}
      <Card className="border-danger bg-danger/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-danger shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-danger">Emergência</p>
              <p className="text-xs text-muted-foreground">Bombeiros / SAMU / Polícia</p>
            </div>
            <a href="tel:190">
              <Button variant="danger" size="sm">
                <Phone className="h-4 w-4" />
                190
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <div className="flex flex-col h-[50vh] bg-card rounded-xl border border-border overflow-hidden">
        <div className="bg-primary px-4 py-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-accent" />
          <span className="text-white font-medium text-sm">Chat com o anfitrião</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.from === 'guest' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.from === 'guest'
                    ? 'bg-accent text-primary font-medium'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-border flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} loading={sending} size="icon" variant="accent">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
