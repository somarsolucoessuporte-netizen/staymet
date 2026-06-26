'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Wifi, Copy, Check, MapPin, Clock, MessageCircle,
  Wrench, Sparkles, Package, Phone, FileText,
  ChevronRight, AlertTriangle,
} from 'lucide-react'

const quickActions = [
  { type: 'LIMPEZA',   Icon: Sparkles,       label: 'Limpeza extra',        color: '#3B82F6', bg: '#EFF6FF' },
  { type: 'MANUTENCAO',Icon: Wrench,          label: 'Manutenção',           color: '#F59E0B', bg: '#FFFBEB' },
  { type: 'REPOSICAO', Icon: Package,         label: 'Reposição',            color: '#10B981', bg: '#ECFDF5' },
  { type: 'SUPORTE',   Icon: MessageCircle,   label: 'Falar com anfitrião',  color: '#8B5CF6', bg: '#F5F3FF' },
]

export default function HospedeMagicPage() {
  const params = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [requestNote, setRequestNote] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d.link)
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [params.token])

  const copyWifi = () => {
    if (!data?.reservation?.property?.wifiPassword) return
    navigator.clipboard.writeText(data.reservation.property.wifiPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendRequest = async (type: string) => {
    if (!data?.reservationId) return
    setSending(true)
    await fetch('/api/guest-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        message: requestNote || type,
        reservationId: data.reservationId,
      }),
    })
    setSending(false)
    setRequestSent(true)
    setActiveSection(null)
    setRequestNote('')
    setTimeout(() => setRequestSent(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1A56DB 0%, #0F172A 100%)' }}>
        <div className="text-white/50 text-sm animate-pulse">Carregando sua estadia...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Link inválido ou expirado</h2>
          <p className="text-white/40 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const reservation = data?.reservation
  const property = reservation?.property
  const firstName = (data?.guestName ?? reservation?.guestName ?? 'Hóspede').split(' ')[0]
  const nights = reservation
    ? Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / 86400000)
    : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero gradient */}
      <div style={{ background: 'linear-gradient(160deg, #1A56DB 0%, #0F172A 100%)' }}
        className="px-5 pt-10 pb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-white/70 text-sm font-medium">Staymet</span>
        </div>

        <p className="text-blue-200 text-sm mb-1">Bem-vindo,</p>
        <h1 className="text-white text-2xl font-bold mb-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {firstName}! 🌊
        </h1>

        {/* Card da estadia */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          {property?.coverImageUrl && (
            <div className="h-28 rounded-xl overflow-hidden mb-3">
              <img src={property.coverImageUrl} alt={property.name} className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-white font-semibold text-base mb-1">{property?.name}</h2>
          <div className="flex items-center gap-1 mb-3">
            <MapPin size={11} className="text-blue-300" />
            <span className="text-blue-200 text-xs">{property?.city}, {property?.state}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 rounded-xl p-2.5">
              <p className="text-blue-300 text-[10px] uppercase tracking-wide mb-0.5">Check-in</p>
              <p className="text-white text-sm font-semibold">
                {reservation?.checkIn ? format(new Date(reservation.checkIn), 'dd/MM/yyyy') : '—'}
              </p>
              <p className="text-blue-200 text-xs">{property?.checkInTime}</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2.5">
              <p className="text-blue-300 text-[10px] uppercase tracking-wide mb-0.5">Check-out</p>
              <p className="text-white text-sm font-semibold">
                {reservation?.checkOut ? format(new Date(reservation.checkOut), 'dd/MM/yyyy') : '—'}
              </p>
              <p className="text-blue-200 text-xs">{property?.checkOutTime}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[52px]">
              <p className="text-white text-xl font-bold">{nights}</p>
              <p className="text-blue-200 text-[10px]">noites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-5 space-y-4 pb-12 max-w-lg mx-auto">

        {/* Wi-Fi destaque */}
        {(property?.wifiName || property?.wifiPassword) && (
          <div className="bg-[#1A56DB] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wifi size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-blue-200 text-xs mb-0.5">Wi-Fi da casa</p>
              <p className="text-white font-semibold text-sm truncate">{property.wifiName}</p>
            </div>
            {property?.wifiPassword && (
              <button
                onClick={copyWifi}
                className="bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-medium px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado!' : 'Copiar senha'}
              </button>
            )}
          </div>
        )}

        {/* Feedback de solicitação enviada */}
        {requestSent && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
            <Check size={16} className="text-green-600" />
            <span className="text-green-700 text-sm font-medium">
              Solicitação enviada! Em breve te atendemos.
            </span>
          </div>
        )}

        {/* Solicitações rápidas */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm mb-3">O que você precisa?</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.type}
                onClick={() => setActiveSection(action.type)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.97] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
                  style={{ background: action.bg }}>
                  <action.Icon size={18} style={{ color: action.color }} />
                </div>
                <p className="text-gray-800 text-sm font-medium leading-tight">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Modal de solicitação inline */}
        {activeSection && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-3">
              {quickActions.find((a) => a.type === activeSection)?.label}
            </h3>
            <textarea
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="Descreva o que precisa (opcional)..."
              className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] resize-none mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveSection(null); setRequestNote('') }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => sendRequest(activeSection)}
                disabled={sending}
                className="flex-1 bg-[#1A56DB] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}

        {/* Informações da casa */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Informações da estadia</h3>
          <div className="space-y-2">
            {[
              {
                Icon: Clock,
                label: 'Horários',
                value: `Check-in ${property?.checkInTime} · Check-out ${property?.checkOutTime}`,
                href: null,
              },
              property?.rules ? {
                Icon: FileText,
                label: 'Regras da casa',
                value: property.rules.length > 80 ? property.rules.slice(0, 80) + '…' : property.rules,
                href: null,
              } : null,
              property?.address ? {
                Icon: MapPin,
                label: 'Endereço',
                value: `${property.address}, ${property.city}`,
                href: `https://maps.google.com/?q=${encodeURIComponent(`${property.address} ${property.city}`)}`,
              } : null,
            ].filter(Boolean).map((info: any, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl p-3.5 border border-gray-100 flex items-center gap-3 ${info.href ? 'cursor-pointer' : ''}`}
                onClick={info.href ? () => window.open(info.href, '_blank') : undefined}
              >
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <info.Icon size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wide">{info.label}</p>
                  <p className="text-gray-800 text-sm">{info.value}</p>
                </div>
                {info.href && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-300 text-xs text-center pt-2">
          Powered by Somar Soluções Digitais
        </p>
      </div>
    </div>
  )
}
