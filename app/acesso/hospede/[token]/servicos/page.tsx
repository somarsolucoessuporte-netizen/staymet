'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { HospedeLayout } from '@/components/hospede/HospedeLayout'
import { HospedeHeader } from '@/components/hospede/HospedeHeader'
import { Sparkles, Wrench, Package, MoreHorizontal, CheckCircle, Send, ChevronLeft } from 'lucide-react'

const SERVICE_TYPES = [
  {
    type: 'LIMPEZA',
    icon: Sparkles,
    label: 'Limpeza extra',
    description: 'Solicite uma limpeza adicional do imóvel',
    color: '#3B82F6',
    bg: '#EFF6FF',
    options: ['Limpeza completa', 'Apenas banheiros', 'Apenas cozinha', 'Troca de toalhas'],
  },
  {
    type: 'MANUTENCAO',
    icon: Wrench,
    label: 'Manutenção',
    description: 'Algo não está funcionando? Nos avise.',
    color: '#F59E0B',
    bg: '#FFFBEB',
    options: ['Ar-condicionado', 'Chuveiro / torneira', 'Eletricidade', 'Fechadura', 'Outro'],
  },
  {
    type: 'REPOSICAO',
    icon: Package,
    label: 'Reposição',
    description: 'Toalhas, papel higiênico, amenities',
    color: '#10B981',
    bg: '#ECFDF5',
    options: ['Toalhas', 'Papel higiênico', 'Shampoo / sabonete', 'Roupa de cama', 'Produtos de limpeza'],
  },
  {
    type: 'OUTRO',
    icon: MoreHorizontal,
    label: 'Outro pedido',
    description: 'Qualquer outra necessidade durante a estadia',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    options: [],
  },
]

export default function ServicosPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tipoInicial = searchParams.get('tipo') || null

  const [selectedType, setSelectedType] = useState<string | null>(tipoInicial)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then(r => r.json())
      .then(d => setReservationId(d.link?.reservationId))
  }, [params.token])

  const selectedService = SERVICE_TYPES.find(s => s.type === selectedType)

  const handleSend = async () => {
    if (!selectedType) return
    setSending(true)
    await fetch('/api/guest-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: selectedType,
        message: selectedOption
          ? `${selectedOption}${note ? ': ' + note : ''}`
          : (note || selectedType),
        reservationId,
        magicToken: params.token,
      }),
    })
    setSent(true)
    setSending(false)
    setTimeout(() => {
      setSent(false)
      setSelectedType(null)
      setNote('')
      setSelectedOption('')
    }, 3000)
  }

  return (
    <HospedeLayout token={params.token as string} propertyName="">
      <HospedeHeader title="Solicitar serviço" subtitle="Em que podemos ajudar?" />

      <div className="px-4 pt-2 pb-28">

        {sent && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl mb-4">
            <CheckCircle size={20} strokeWidth={1.5} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">Solicitação enviada</p>
              <p className="text-green-600 text-xs mt-0.5">Em breve nossa equipe entrará em contato.</p>
            </div>
          </div>
        )}

        {!selectedType && (
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_TYPES.map(service => (
              <button
                key={service.type}
                onClick={() => setSelectedType(service.type)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md active:scale-[0.97] transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: service.bg }}
                >
                  <service.icon size={22} strokeWidth={1.5} style={{ color: service.color }} />
                </div>
                <p className="font-bold text-gray-900 text-sm">{service.label}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{service.description}</p>
              </button>
            ))}
          </div>
        )}

        {selectedType && selectedService && (
          <div>
            <button
              onClick={() => { setSelectedType(null); setSelectedOption(''); setNote('') }}
              className="text-[#1A56DB] text-sm font-medium mb-5 flex items-center gap-1"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
              Voltar
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: selectedService.bg }}
              >
                <selectedService.icon size={22} strokeWidth={1.5} style={{ color: selectedService.color }} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedService.label}</p>
                <p className="text-gray-400 text-xs">{selectedService.description}</p>
              </div>
            </div>

            {selectedService.options.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                  O que você precisa?
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedService.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedOption(opt === selectedOption ? '' : opt)}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                        selectedOption === opt
                          ? 'border-[#1A56DB] bg-[#1A56DB] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-[#1A56DB]/40'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                Detalhes adicionais (opcional)
              </p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Descreva com mais detalhes se necessário..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] resize-none transition-all"
                rows={4}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || (!selectedOption && !note)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-40 text-white"
              style={{ background: selectedService.color }}
            >
              <Send size={18} strokeWidth={1.5} />
              {sending ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </div>
        )}
      </div>
    </HospedeLayout>
  )
}
