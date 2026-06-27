'use client'

import { useState } from 'react'
import { Save, CheckCircle } from 'lucide-react'
import { FinanceModelSelector } from './FinanceModelSelector'

interface FinanceTabFormProps {
  propertyId: string
  initial: {
    financeModel: string
    commissionRate?: number | null
    monthlyFee?: number | null
    directCommission?: number | null
    paymentDay?: number | null
    financeNotes?: string | null
  }
}

export function FinanceTabForm({ propertyId, initial }: FinanceTabFormProps) {
  const [data, setData] = useState<{
    financeModel: string
    commissionRate: number
    monthlyFee: number
    directCommission: number
    paymentDay: number
  }>({
    financeModel: initial.financeModel || 'HIBRIDO',
    commissionRate: initial.commissionRate ? Number(initial.commissionRate) : 20,
    monthlyFee: initial.monthlyFee ? Number(initial.monthlyFee) : 300,
    directCommission: initial.directCommission ? Number(initial.directCommission) : 10,
    paymentDay: initial.paymentDay || 10,
  })
  const [notes, setNotes] = useState(initial.financeNotes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, financeNotes: notes }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <FinanceModelSelector {...data} onChange={(d) => setData({
        financeModel: d.financeModel,
        commissionRate: d.commissionRate ?? 20,
        monthlyFee: d.monthlyFee ?? 300,
        directCommission: d.directCommission ?? 10,
        paymentDay: d.paymentDay ?? 10,
      })} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações financeiras</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Condições especiais, acordos adicionais..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
          disabled:opacity-50 bg-[#1A56DB] text-white hover:bg-[#1745BE] active:scale-[0.98]"
      >
        {saved ? (
          <>
            <CheckCircle size={16} strokeWidth={1.5} />
            Salvo com sucesso
          </>
        ) : saving ? (
          'Salvando...'
        ) : (
          <>
            <Save size={16} strokeWidth={1.5} />
            Salvar configuração financeira
          </>
        )}
      </button>
    </div>
  )
}
