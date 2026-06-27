'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Wifi, Wrench, MessageCircle, Map, BookOpen,
  Star, ChevronRight, Clock, MapPin,
  Sparkles, Package, Phone,
  AlertTriangle, Copy, Check, ArrowRight,
} from 'lucide-react'
import { HospedeLayout } from '@/components/hospede/HospedeLayout'
import { StaymetLogo } from '@/components/ui/StaymetLogo'

export default function HospedePage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [wifiCopied, setWifiCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d.link)
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [params.token])

  const copyWifi = async () => {
    await navigator.clipboard.writeText(data?.reservation?.property?.wifiPassword || '')
    setWifiCopied(true)
    setTimeout(() => setWifiCopied(false), 2500)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-5">
      <StaymetLogo variant="dark" size="md" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-[#1A56DB]/50 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={28} strokeWidth={1.5} className="text-red-400" />
      </div>
      <h2 className="font-bold text-gray-900 text-lg mb-2">Link inválido</h2>
      <p className="text-gray-400 text-sm">{error}</p>
      <p className="text-gray-300 text-xs mt-6">Staymet — Gestão completa. Estadia perfeita.</p>
    </div>
  )

  const reservation = data?.reservation
  const property = reservation?.property
  const guestName = data?.guestName || reservation?.guestName || 'Hóspede'
  const firstName = guestName.split(' ')[0]
  const checkIn = reservation?.checkIn ? new Date(reservation.checkIn) : null
  const checkOut = reservation?.checkOut ? new Date(reservation.checkOut) : null
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0
  const base = `/acesso/hospede/${params.token}`

  const quickServices = [
    { icon: Sparkles, label: 'Limpeza extra', color: '#3B82F6', bg: '#EFF6FF', type: 'LIMPEZA' },
    { icon: Wrench,   label: 'Manutenção',    color: '#F59E0B', bg: '#FFFBEB', type: 'MANUTENCAO' },
    { icon: Package,  label: 'Reposição',     color: '#10B981', bg: '#ECFDF5', type: 'REPOSICAO' },
    { icon: Map,      label: 'Guia local',    color: '#8B5CF6', bg: '#F5F3FF', type: null },
  ]

  return (
    <HospedeLayout token={params.token as string} propertyName={property?.name || ''}>
      <div className="pb-24">

        {/* HERO — foto do imóvel */}
        <div className="relative h-72 bg-gray-100 overflow-hidden">
          {property?.coverImageUrl ? (
            <img src={property.coverImageUrl} alt={property.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1A56DB]/20 to-[#0F172A]/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

          {/* Logo no topo */}
          <div className="absolute top-12 left-5">
            <StaymetLogo variant="hero" size="xs" />
          </div>

          {/* Saudação */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-white/70 text-sm mb-0.5">Bem-vindo,</p>
            <h1
              className="text-white text-2xl font-bold leading-tight"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {firstName}
            </h1>
            <p className="text-white/70 text-sm mt-0.5">{property?.name}</p>
          </div>
        </div>

        {/* CARD DA ESTADIA */}
        <div className="mx-4 -mt-3 relative z-10">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-gray-100 overflow-hidden">
            <div className="flex items-stretch">
              <div className="flex-1 p-4">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Check-in</p>
                <p className="text-gray-900 font-bold text-base">
                  {checkIn ? format(checkIn, 'dd MMM', { locale: ptBR }) : '--'}
                </p>
                <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                  <Clock size={11} strokeWidth={1.5} />
                  {property?.checkInTime || '14:00'}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center px-4 border-x border-gray-50">
                <div className="w-8 h-8 bg-[#1A56DB]/10 rounded-full flex items-center justify-center mb-0.5">
                  <span className="text-[#1A56DB] font-bold text-sm">{nights}</span>
                </div>
                <span className="text-gray-400 text-[10px]">noites</span>
              </div>

              <div className="flex-1 p-4">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Check-out</p>
                <p className="text-gray-900 font-bold text-base">
                  {checkOut ? format(checkOut, 'dd MMM', { locale: ptBR }) : '--'}
                </p>
                <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                  <Clock size={11} strokeWidth={1.5} />
                  {property?.checkOutTime || '11:00'}
                </p>
              </div>
            </div>

            {property?.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(property.address + ' ' + property.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <MapPin size={14} strokeWidth={1.5} className="text-[#1A56DB] flex-shrink-0" />
                <span className="text-gray-600 text-xs flex-1">{property.address}, {property.city}</span>
                <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300" />
              </a>
            )}
          </div>
        </div>

        {/* WI-FI */}
        <div className="px-4 mt-5">
          <div className="bg-[#0F172A] rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wifi size={22} strokeWidth={1.5} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Wi-Fi da estadia</p>
              <p className="text-white font-bold text-base truncate">{property?.wifiName || 'Nome da rede'}</p>
              <p className="text-white/40 text-xs truncate">
                {property?.wifiPassword ? '••••••••' : 'Sem senha'}
              </p>
            </div>
            <button
              onClick={copyWifi}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 flex-shrink-0 ${
                wifiCopied ? 'bg-green-500 text-white' : 'bg-white text-[#0F172A] hover:bg-gray-100'
              }`}
            >
              {wifiCopied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
              {wifiCopied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* SERVIÇOS RÁPIDOS */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              O que você precisa?
            </h2>
            <Link href={`${base}/servicos`} className="text-[#1A56DB] text-xs font-medium flex items-center gap-1">
              Ver todos <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {quickServices.map(service => (
              <Link
                key={service.type ?? 'local'}
                href={service.type ? `${base}/servicos?tipo=${service.type}` : `${base}/parceiros`}
              >
                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-95 transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: service.bg }}>
                    <service.icon size={20} strokeWidth={1.5} style={{ color: service.color }} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{service.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* MENU */}
        <div className="px-4 mt-6">
          <h2 className="font-bold text-gray-900 text-base mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Sua estadia
          </h2>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {[
              { icon: BookOpen, color: '#1A56DB', bg: '#EFF6FF', title: 'Regras da casa',           subtitle: 'Normas e informações importantes',    href: `${base}/regras` },
              { icon: Map,      color: '#10B981', bg: '#ECFDF5', title: 'Guia local',               subtitle: 'Restaurantes, praias e passeios',      href: `${base}/parceiros` },
              { icon: Phone,    color: '#F59E0B', bg: '#FFFBEB', title: 'Contatos de emergência',   subtitle: 'Hospital, bombeiros, polícia',          href: `${base}/informacoes` },
              { icon: Star,     color: '#8B5CF6', bg: '#F5F3FF', title: 'Avaliar estadia',          subtitle: 'Nos conte como está sendo',            href: `${base}/avaliar` },
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                    <item.icon size={18} strokeWidth={1.5} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{item.subtitle}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* SUPORTE */}
        <div className="px-4 mt-4">
          <Link href={`${base}/suporte`}>
            <div className="flex items-center gap-4 p-4 bg-[#1A56DB] rounded-2xl active:scale-[0.98] transition-all">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle size={20} strokeWidth={1.5} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Falar com o anfitrião</p>
                <p className="text-white/60 text-xs mt-0.5">Estamos aqui para ajudar</p>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-white/50" />
            </div>
          </Link>
        </div>

        {/* FOOTER */}
        <div className="px-4 mt-8 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-5 h-5 bg-[#1A56DB] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[9px]">S</span>
            </div>
            <span className="text-gray-400 text-xs font-semibold">Staymet</span>
          </div>
          <p className="text-gray-200 text-[10px] mt-0.5">Powered by Somar Soluções Digitais</p>
        </div>

      </div>
    </HospedeLayout>
  )
}
