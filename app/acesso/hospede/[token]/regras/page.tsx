'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { HospedeLayout } from '@/components/hospede/HospedeLayout'
import { HospedeHeader } from '@/components/hospede/HospedeHeader'
import { Clock, Users, Volume2, Cigarette, PawPrint, Flame, Info } from 'lucide-react'

export default function RegrasPage() {
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then(r => r.json())
      .then(d => setProperty(d.link?.reservation?.property))
      .finally(() => setLoading(false))
  }, [params.token])

  const standardRules = [
    { icon: Clock,     title: 'Horários',            value: `Check-in: ${property?.checkInTime || '14:00'} · Check-out: ${property?.checkOutTime || '11:00'}`, color: '#3B82F6', bg: '#EFF6FF' },
    { icon: Users,     title: 'Capacidade máxima',   value: `${property?.maxGuests || 4} hóspedes`,                                                            color: '#10B981', bg: '#ECFDF5' },
    { icon: Volume2,   title: 'Silêncio',            value: 'Após as 22h respeite os vizinhos',                                                                color: '#F59E0B', bg: '#FFFBEB' },
    { icon: Cigarette, title: 'Fumar',               value: 'Proibido fumar dentro do imóvel',                                                                 color: '#EF4444', bg: '#FEF2F2' },
    { icon: PawPrint,  title: 'Animais',             value: 'Consulte o anfitrião',                                                                            color: '#8B5CF6', bg: '#F5F3FF' },
    { icon: Flame,     title: 'Churrasqueira',       value: 'Apenas nas áreas permitidas',                                                                     color: '#F97316', bg: '#FFF7ED' },
  ]

  return (
    <HospedeLayout token={params.token as string} propertyName="">
      <HospedeHeader title="Regras da casa" subtitle="Por favor leia com atenção" />

      <div className="px-4 pt-4 pb-28 space-y-4">

        {loading ? (
          <div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {standardRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: rule.bg }}
                  >
                    <rule.icon size={18} strokeWidth={1.5} style={{ color: rule.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{rule.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{rule.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {property?.rules && (
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={15} strokeWidth={1.5} className="text-amber-600" />
                  <p className="font-semibold text-amber-800 text-sm">Regras específicas deste imóvel</p>
                </div>
                <p className="text-amber-700 text-sm leading-relaxed whitespace-pre-line">{property.rules}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-xs leading-relaxed">
                Ao acessar este imóvel você concorda com todas as regras acima.
                Em caso de dúvidas, fale com o anfitrião.
              </p>
            </div>
          </>
        )}
      </div>
    </HospedeLayout>
  )
}
