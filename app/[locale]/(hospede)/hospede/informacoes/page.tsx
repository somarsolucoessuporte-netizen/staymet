import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, Clock, FileText, MapPin, Phone, Copy } from 'lucide-react'

async function getPropertyFromCode(code?: string) {
  if (!code) return null
  const { prisma } = await import('@/lib/prisma')
  const res = await prisma.reservation.findUnique({
    where: { accessCode: code },
    include: {
      property: {
        select: {
          name: true, wifiName: true, wifiPassword: true,
          rules: true, checkInTime: true, checkOutTime: true,
          address: true, city: true, state: true,
        },
      },
    },
  })
  return res?.property ?? null
}

export default async function GuestInformacoesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const property = await getPropertyFromCode(code)

  if (!property) {
    return (
      <div className="p-6 pt-12 text-center">
        <p className="text-muted-foreground">Informações não disponíveis.</p>
      </div>
    )
  }

  return (
    <div className="p-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold">Informações do Imóvel</h1>

      {/* Wi-Fi */}
      <Card className="bg-primary border-0">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="h-5 w-5 text-accent" />
            <span className="text-white font-semibold">Wi-Fi</span>
          </div>
          {property.wifiName ? (
            <div className="space-y-2">
              <div>
                <p className="text-white/60 text-xs">Rede</p>
                <p className="text-white font-bold text-lg">{property.wifiName}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Senha</p>
                <p className="text-accent font-bold text-lg">{property.wifiPassword}</p>
              </div>
            </div>
          ) : (
            <p className="text-white/60">Wi-Fi não cadastrado.</p>
          )}
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-accent" />
            <span className="font-semibold">Horários</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p className="text-2xl font-black text-success">{property.checkInTime}h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p className="text-2xl font-black text-danger">{property.checkOutTime}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="font-semibold">Endereço</span>
          </div>
          <p className="text-sm text-foreground">{property.address}</p>
          <p className="text-sm text-muted-foreground">{property.city}, {property.state}</p>
        </CardContent>
      </Card>

      {/* Regras */}
      {property.rules && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-accent" />
              <span className="font-semibold">Regras da Casa</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{property.rules}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
