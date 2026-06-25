import { Calendar, Users, Home, Wifi, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getReservationFromCode(code?: string) {
  if (!code) return null
  const { prisma } = await import('@/lib/prisma')
  return prisma.reservation.findUnique({
    where: { accessCode: code },
    include: {
      property: {
        select: {
          name: true, coverImageUrl: true, city: true, state: true,
          wifiName: true, wifiPassword: true, rules: true,
          checkInTime: true, checkOutTime: true,
        },
      },
    },
  })
}

export default async function GuestWelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const { locale } = await params
  const { code } = await searchParams
  const reservation = await getReservationFromCode(code)

  if (!reservation) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-5 border border-white/10">
          <Home className="w-8 h-8 text-white/30" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Link não encontrado
        </h1>
        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
          Seu link de boas-vindas não foi encontrado. Solicite o link de acesso ao seu anfitrião.
        </p>
      </div>
    )
  }

  const prop = reservation.property
  const firstName = reservation.guestName.split(' ')[0]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── HERO ── */}
      <div className="relative h-72 lg:h-80 overflow-hidden">
        {prop.coverImageUrl ? (
          <img
            src={prop.coverImageUrl}
            alt={prop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1A56DB] to-[#0F172A]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Staymet badge */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
            <div className="w-5 h-5 bg-[#1A56DB] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">S</span>
            </div>
            <span className="text-white text-xs font-medium">Staymet</span>
          </div>
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-white/60 text-xs mb-1 flex items-center gap-1.5">
            <MapPin size={11} />
            {prop.city}, {prop.state}
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {prop.name}
          </h1>
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10 pb-10 space-y-4">

        {/* Boas-vindas */}
        <div className="bg-[#1A56DB] rounded-2xl px-5 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-base">👋</span>
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium">Bem-vindo(a) à sua estadia</p>
              <p className="text-white font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {firstName}!
              </p>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            Esperamos que sua estadia seja incrível. Aqui você encontra tudo que precisa.
          </p>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Calendar size={13} className="text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Check-in</span>
            </div>
            <p className="font-bold text-gray-900 text-sm">{formatDate(reservation.checkIn)}</p>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={11} className="text-gray-400" />
              <span className="text-xs text-gray-400">{prop.checkInTime}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar size={13} className="text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Check-out</span>
            </div>
            <p className="font-bold text-gray-900 text-sm">{formatDate(reservation.checkOut)}</p>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={11} className="text-gray-400" />
              <span className="text-xs text-gray-400">{prop.checkOutTime}</span>
            </div>
          </div>
        </div>

        {/* Hóspedes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users size={15} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {reservation.guestCount} hóspede{reservation.guestCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400">nesta reserva</p>
          </div>
        </div>

        {/* Wi-Fi */}
        {(prop.wifiName || prop.wifiPassword) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Wifi size={13} className="text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Wi-Fi</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {prop.wifiName && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Rede</p>
                  <p className="text-sm font-semibold text-gray-800">{prop.wifiName}</p>
                </div>
              )}
              {prop.wifiPassword && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Senha</p>
                  <p className="text-sm font-semibold text-gray-800 font-mono">{prop.wifiPassword}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Links rápidos */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Wi-Fi & Infos', href: `/${locale}/hospede/informacoes?code=${code}`, emoji: '📶', bg: 'bg-blue-50', color: 'text-blue-700' },
            { label: 'Solicitações', href: `/${locale}/hospede/solicitacoes?code=${code}`, emoji: '💬', bg: 'bg-emerald-50', color: 'text-emerald-700' },
            { label: 'Cardápio Local', href: `/${locale}/hospede/cardapio?code=${code}`, emoji: '🍽️', bg: 'bg-orange-50', color: 'text-orange-700' },
            { label: 'Suporte', href: `/${locale}/hospede/suporte?code=${code}`, emoji: '🆘', bg: 'bg-purple-50', color: 'text-purple-700' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`${item.bg} rounded-2xl p-4 flex flex-col gap-2 hover:opacity-90 active:scale-[0.97] transition-all border border-transparent hover:border-${item.color.split('-')[1]}-100`}>
                <span className="text-2xl">{item.emoji}</span>
                <p className={`text-sm font-semibold ${item.color}`}>{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Regras */}
        {prop.rules && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 mb-2">Regras da casa</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{prop.rules}</p>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 pt-2">
          Powered by Staymet · Somar Soluções Digitais
        </p>
      </div>
    </div>
  )
}
