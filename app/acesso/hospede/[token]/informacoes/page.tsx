'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { HospedeLayout } from '@/components/hospede/HospedeLayout'
import { HospedeHeader } from '@/components/hospede/HospedeHeader'
import { Phone, MapPin, Clock, Truck, ChevronRight } from 'lucide-react'

const EMERGENCY = [
  { label: 'SAMU',           number: '192', color: '#EF4444', bg: '#FEF2F2' },
  { label: 'Bombeiros',      number: '193', color: '#F97316', bg: '#FFF7ED' },
  { label: 'Polícia Militar', number: '190', color: '#1A56DB', bg: '#EFF6FF' },
  { label: 'Defesa Civil',   number: '199', color: '#10B981', bg: '#ECFDF5' },
]

export default function InformacoesPage() {
  const params = useParams()
  const [reservation, setReservation] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then(r => r.json())
      .then(d => {
        setReservation(d.link?.reservation)
        setProperty(d.link?.reservation?.property)
      })
      .finally(() => setLoading(false))
  }, [params.token])

  return (
    <HospedeLayout token={params.token as string} propertyName="">
      <HospedeHeader title="Informações" subtitle="Tudo que você precisa saber" />

      <div className="px-4 pt-4 pb-28 space-y-5">

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Endereço */}
            {property?.address && (
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Endereço</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(property.address + ' ' + property.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} strokeWidth={1.5} className="text-[#1A56DB]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{property.address}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{property.city}, {property.state}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300" />
                </a>
              </div>
            )}

            {/* Horários */}
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Horários</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock size={18} strokeWidth={1.5} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Check-in</p>
                    <p className="text-gray-400 text-xs">{property?.checkInTime || '14:00'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock size={18} strokeWidth={1.5} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Check-out</p>
                    <p className="text-gray-400 text-xs">{property?.checkOutTime || '11:00'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coleta de lixo */}
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Serviços locais</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck size={18} strokeWidth={1.5} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Coleta de lixo</p>
                  <p className="text-gray-400 text-xs">Consulte o anfitrião sobre dias e horários</p>
                </div>
              </div>
            </div>

            {/* Emergência */}
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Emergência</p>
              <div className="grid grid-cols-2 gap-3">
                {EMERGENCY.map(e => (
                  <a key={e.label} href={`tel:${e.number}`}>
                    <div
                      className="rounded-2xl p-4 flex flex-col gap-1 border active:scale-[0.97] transition-all"
                      style={{ background: e.bg, borderColor: e.color + '20' }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center mb-1">
                        <Phone size={16} strokeWidth={1.5} style={{ color: e.color }} />
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{e.label}</p>
                      <p className="font-mono font-bold text-lg" style={{ color: e.color }}>{e.number}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </HospedeLayout>
  )
}
