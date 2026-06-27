'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { HospedeLayout } from '@/components/hospede/HospedeLayout'
import { HospedeHeader } from '@/components/hospede/HospedeHeader'
import { Wifi, Copy, Check, Signal, Lock } from 'lucide-react'

export default function WifiPage() {
  const params = useParams()
  const [property, setProperty] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then(r => r.json())
      .then(d => setProperty(d.link?.reservation?.property))
      .finally(() => setLoading(false))
  }, [params.token])

  const copyPassword = async () => {
    if (!property?.wifiPassword) return
    await navigator.clipboard.writeText(property.wifiPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <HospedeLayout token={params.token as string} propertyName="">
      <HospedeHeader title="Wi-Fi" subtitle="Conecte seus dispositivos" />

      <div className="px-4 pt-4 pb-28 space-y-4">

        {loading ? (
          <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        ) : (
          <>
            {/* Card principal */}
            <div className="bg-[#0F172A] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Wifi size={24} strokeWidth={1.5} className="text-white" />
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider">Rede Wi-Fi</p>
                  <p className="text-white font-bold text-lg">{property?.wifiName || '—'}</p>
                </div>
              </div>

              {property?.wifiPassword && (
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1.5">Senha</p>
                  <p className="text-white font-mono text-lg font-semibold tracking-widest">
                    {property.wifiPassword}
                  </p>
                </div>
              )}

              <button
                onClick={copyPassword}
                disabled={!property?.wifiPassword}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                  copied ? 'bg-green-500 text-white' : 'bg-white text-[#0F172A]'
                } disabled:opacity-40`}
              >
                {copied
                  ? <><Check size={16} strokeWidth={1.5} /> Senha copiada</>
                  : <><Copy size={16} strokeWidth={1.5} /> Copiar senha</>
                }
              </button>
            </div>

            {/* Dicas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {[
                { icon: Signal, title: 'Melhor sinal', desc: 'Fique próximo ao roteador para melhor conexão' },
                { icon: Lock,   title: 'Segurança', desc: 'Use esta rede apenas para uso pessoal' },
                { icon: Wifi,   title: 'Dispositivos', desc: 'Conecte quantos dispositivos precisar' },
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <tip.icon size={16} strokeWidth={1.5} className="text-[#1A56DB]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{tip.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {!property?.wifiPassword && !loading && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                <p className="text-amber-700 text-sm font-medium">Wi-Fi não configurado</p>
                <p className="text-amber-500 text-xs mt-1">Entre em contato com o anfitrião para obter a senha.</p>
              </div>
            )}
          </>
        )}
      </div>
    </HospedeLayout>
  )
}
