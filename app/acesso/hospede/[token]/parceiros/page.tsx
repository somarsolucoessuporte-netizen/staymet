'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { HospedeLayout } from '@/components/hospede/HospedeLayout'
import { HospedeHeader } from '@/components/hospede/HospedeHeader'
import { MapPin, ExternalLink, Utensils, Waves, ShoppingBag, Coffee } from 'lucide-react'

const CATEGORIES = [
  { icon: Utensils,    label: 'Restaurantes',  color: '#F59E0B', bg: '#FFFBEB' },
  { icon: Waves,       label: 'Praias',        color: '#3B82F6', bg: '#EFF6FF' },
  { icon: Coffee,      label: 'Cafés',         color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: ShoppingBag, label: 'Compras',       color: '#10B981', bg: '#ECFDF5' },
]

export default function ParceirosPage() {
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then(r => r.json())
      .then(d => setProperty(d.link?.reservation?.property))
      .finally(() => setLoading(false))
  }, [params.token])

  const mapsUrl = property?.address
    ? `https://maps.google.com/?q=${encodeURIComponent(property.address + ' ' + property.city)}`
    : `https://maps.google.com`

  return (
    <HospedeLayout token={params.token as string} propertyName="">
      <HospedeHeader title="Guia local" subtitle="Descubra a região" />

      <div className="px-4 pt-4 pb-28 space-y-5">

        {/* Explorar no Maps */}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <div className="bg-[#0F172A] rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin size={22} strokeWidth={1.5} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-base">Explorar no mapa</p>
              <p className="text-white/50 text-xs mt-0.5">
                {property?.city ? `Ver o que há perto de ${property.city}` : 'Ver atrações próximas'}
              </p>
            </div>
            <ExternalLink size={16} strokeWidth={1.5} className="text-white/40" />
          </div>
        </a>

        {/* Categorias */}
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Explorar por categoria
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(cat => {
              const q = property?.city
                ? `${cat.label} em ${property.city}`
                : cat.label
              return (
                <a
                  key={cat.label}
                  href={`https://maps.google.com/?q=${encodeURIComponent(q)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md active:scale-[0.97] transition-all">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: cat.bg }}
                    >
                      <cat.icon size={20} strokeWidth={1.5} style={{ color: cat.color }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">{cat.label}</p>
                      <ExternalLink size={12} strokeWidth={1.5} className="text-gray-300" />
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs leading-relaxed">
            Dica de passeio ou restaurante? Fale com o anfitrião pelo suporte — adoramos indicar os melhores lugares.
          </p>
        </div>
      </div>
    </HospedeLayout>
  )
}
