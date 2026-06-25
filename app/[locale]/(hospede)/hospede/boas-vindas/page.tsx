import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, ArrowRight, Home, Star } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

// Guest access is via URL params (?code=ACCESS_CODE) or authenticated session
// For demo purposes, showing a beautiful welcome screen
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
      <div className="p-6 pt-12 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
          <span className="text-accent font-black text-2xl">SM</span>
        </div>
        <h1 className="text-2xl font-black text-primary mb-2">Staymet</h1>
        <p className="text-muted-foreground mb-6">Seu link de boas-vindas não foi encontrado.</p>
        <p className="text-sm text-muted-foreground">
          Solicite o link de acesso ao anfitrião ou gestor do imóvel.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Cover image */}
      <div className="h-64 bg-gradient-to-br from-primary-800 to-primary-600 relative overflow-hidden">
        {reservation.property.coverImageUrl ? (
          <img
            src={reservation.property.coverImageUrl}
            alt={reservation.property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="h-20 w-20 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-black text-white">{reservation.property.name}</h1>
          <p className="text-white/80 text-sm">{reservation.property.city}, {reservation.property.state}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Welcome message */}
        <Card className="bg-primary border-0">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-accent" />
              <span className="text-accent font-semibold">Bem-vindo(a)!</span>
            </div>
            <p className="text-white text-lg font-bold">{reservation.guestName}</p>
            <p className="text-white/70 text-sm mt-1">
              Esperamos que sua estadia seja incrível!
            </p>
          </CardContent>
        </Card>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-3">
              <Calendar className="h-4 w-4 text-success mb-1" />
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p className="font-bold text-sm">{formatDate(reservation.checkIn)}</p>
              <p className="text-xs text-muted-foreground">{reservation.property.checkInTime}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3">
              <Calendar className="h-4 w-4 text-accent mb-1" />
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p className="font-bold text-sm">{formatDate(reservation.checkOut)}</p>
              <p className="text-xs text-muted-foreground">{reservation.property.checkOutTime}h</p>
            </CardContent>
          </Card>
        </div>

        {/* Guests */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{reservation.guestCount}</strong> hóspede{reservation.guestCount !== 1 ? 's' : ''} nesta reserva
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Wi-Fi & Infos', href: `/${locale}/hospede/informacoes?code=${code}`, color: 'bg-blue-50 text-blue-700' },
            { label: 'Solicitações', href: `/${locale}/hospede/solicitacoes?code=${code}`, color: 'bg-green-50 text-green-700' },
            { label: 'Cardápio Local', href: `/${locale}/hospede/cardapio?code=${code}`, color: 'bg-orange-50 text-orange-700' },
            { label: 'Suporte', href: `/${locale}/hospede/suporte?code=${code}`, color: 'bg-purple-50 text-purple-700' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-shadow active:scale-[0.98]">
                <CardContent className="py-4 text-center">
                  <p className={`text-sm font-semibold ${item.color}`}>{item.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
