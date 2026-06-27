'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { HospedeLayout } from '@/components/hospede/HospedeLayout'
import { HospedeHeader } from '@/components/hospede/HospedeHeader'
import { Star, CheckCircle } from 'lucide-react'

const CATEGORIES = [
  { key: 'limpeza',      label: 'Limpeza',      icon: '✓', desc: 'Estado geral e limpeza do imóvel' },
  { key: 'conforto',     label: 'Conforto',     icon: '✓', desc: 'Camas, ar-condicionado, comodidades' },
  { key: 'localizacao',  label: 'Localização',  icon: '✓', desc: 'Acesso e proximidade de pontos de interesse' },
  { key: 'atendimento',  label: 'Atendimento',  icon: '✓', desc: 'Suporte e comunicação com o anfitrião' },
]

export default function AvaliarPage() {
  const params = useParams()
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then(r => r.json())
      .then(d => setReservationId(d.link?.reservationId))
  }, [params.token])

  const setRating = (category: string, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await fetch('/api/guest-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'OUTRO',
        message: JSON.stringify({ ratings, comment }),
        reservationId,
        magicToken: params.token,
      }),
    })
    setSubmitted(true)
    setSubmitting(false)
  }

  const allRated = CATEGORIES.every(c => ratings[c.key])
  const avgRating = allRated
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / CATEGORIES.length).toFixed(1)
    : null

  if (submitted) return (
    <HospedeLayout token={params.token as string} propertyName="">
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-24">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={36} strokeWidth={1.5} className="text-green-500" />
        </div>
        <h2
          className="font-bold text-gray-900 text-xl mb-2"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Obrigado pelo feedback
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Sua avaliação é muito importante para continuarmos melhorando nosso serviço.
        </p>
      </div>
    </HospedeLayout>
  )

  return (
    <HospedeLayout token={params.token as string} propertyName="">
      <HospedeHeader title="Avaliar estadia" subtitle="Como foi sua experiência?" />

      <div className="px-4 pt-4 pb-28 space-y-4">

        {allRated && (
          <div className="bg-[#1A56DB]/5 border border-[#1A56DB]/10 rounded-2xl p-4 text-center">
            <p className="text-[#1A56DB] text-xs font-semibold uppercase tracking-wider mb-1">Sua média</p>
            <div className="flex items-center justify-center gap-1.5">
              <Star size={20} strokeWidth={0} fill="#F59E0B" />
              <span className="text-2xl font-bold text-gray-900">{avgRating}</span>
            </div>
          </div>
        )}

        {CATEGORIES.map(cat => (
          <div key={cat.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="mb-3">
              <p className="font-semibold text-gray-900 text-sm">{cat.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{cat.desc}</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(cat.key, star)}
                  className="flex-1 active:scale-110 transition-transform"
                >
                  <Star
                    size={28}
                    strokeWidth={1.5}
                    className="mx-auto transition-colors"
                    fill={ratings[cat.key] >= star ? '#F59E0B' : 'none'}
                    color={ratings[cat.key] >= star ? '#F59E0B' : '#D1D5DB'}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="font-semibold text-gray-900 text-sm mb-2">Comentário (opcional)</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Conte como foi sua estadia..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 resize-none"
            rows={4}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allRated || submitting}
          className="w-full py-4 rounded-2xl font-semibold text-base bg-[#1A56DB] text-white disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {submitting ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </div>
    </HospedeLayout>
  )
}
