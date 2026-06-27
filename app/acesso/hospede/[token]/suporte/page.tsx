'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { HospedeLayout } from '@/components/hospede/HospedeLayout'
import { Send, Circle } from 'lucide-react'

interface Message {
  role: 'guest' | 'host'
  text: string
}

export default function SuportePage() {
  const params = useParams()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then(r => r.json())
      .then(d => setReservationId(d.link?.reservationId))
  }, [params.token])

  const sendMessage = async () => {
    if (!message.trim()) return
    const text = message.trim()
    setSending(true)
    setMessages(prev => [...prev, { role: 'guest', text }])
    setMessage('')

    await fetch('/api/guest-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SUPORTE',
        message: text,
        reservationId,
        magicToken: params.token,
      }),
    })

    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <HospedeLayout token={params.token as string} propertyName="">
      <div className="flex flex-col h-screen">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A56DB]/10 rounded-full flex items-center justify-center">
              <img src="/logo.jpg" alt="Staymet" className="h-6 w-auto" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Anfitrião Staymet</p>
              <div className="flex items-center gap-1.5">
                <Circle size={6} strokeWidth={0} className="fill-green-500" />
                <p className="text-gray-400 text-xs">Online agora</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-32">
          <div className="flex gap-2">
            <div className="w-7 h-7 bg-[#1A56DB] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-[10px] font-bold">S</span>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-gray-800 text-sm">
                Olá! Seja bem-vindo à sua estadia. Estamos aqui para o que precisar. Como podemos ajudar?
              </p>
            </div>
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'guest' ? 'justify-end' : 'gap-2'}`}>
              {msg.role !== 'guest' && (
                <div className="w-7 h-7 bg-[#1A56DB] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-[10px] font-bold">S</span>
                </div>
              )}
              <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                msg.role === 'guest'
                  ? 'bg-[#1A56DB] text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sending && sendMessage()}
              placeholder="Escreva uma mensagem..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              className="w-12 h-12 bg-[#1A56DB] rounded-xl flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            >
              <Send size={18} strokeWidth={1.5} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </HospedeLayout>
  )
}
