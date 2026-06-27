'use client'

import { useState } from 'react'
import { DollarSign, Percent, Layers, Check, Info } from 'lucide-react'

interface FinanceData {
  financeModel: string
  commissionRate?: number
  monthlyFee?: number
  directCommission?: number
  paymentDay?: number
}

interface FinanceModelSelectorProps extends FinanceData {
  onChange: (data: FinanceData) => void
}

const MODELS = [
  {
    id: 'COMISSAO',
    label: 'Só comissão',
    description: 'Cobra % sobre cada reserva. Sem mensalidade.',
    icon: Percent,
    color: '#10B981',
    bg: '#ECFDF5',
    example: 'Ex: 20% de R$ 3.000 = R$ 600 para a gestora',
  },
  {
    id: 'MENSALIDADE',
    label: 'Só mensalidade',
    description: 'Valor fixo mensal. Independente de reservas.',
    icon: DollarSign,
    color: '#3B82F6',
    bg: '#EFF6FF',
    example: 'Ex: R$ 400/mês fixo para a gestora',
  },
  {
    id: 'HIBRIDO',
    label: 'Híbrido',
    description: 'Mensalidade fixa + comissão sobre locações.',
    icon: Layers,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    example: 'Ex: R$ 200/mês + 10% sobre cada reserva',
    recommended: true,
  },
]

export function FinanceModelSelector({
  financeModel, commissionRate, monthlyFee, directCommission, paymentDay = 10, onChange,
}: FinanceModelSelectorProps) {
  const [model, setModel] = useState(financeModel || 'HIBRIDO')
  const [commission, setCommission] = useState(commissionRate || 20)
  const [monthly, setMonthly] = useState(monthlyFee || 300)
  const [direct, setDirect] = useState(directCommission || 10)
  const [day, setDay] = useState(paymentDay)

  const emit = (overrides: Partial<FinanceData> = {}) => {
    onChange({ financeModel: model, commissionRate: commission, monthlyFee: monthly, directCommission: direct, paymentDay: day, ...overrides })
  }

  const handleModel = (m: string) => { setModel(m); emit({ financeModel: m }) }
  const handleCommission = (v: number) => { setCommission(v); emit({ commissionRate: v }) }
  const handleMonthly = (v: number) => { setMonthly(v); emit({ monthlyFee: v }) }
  const handleDirect = (v: number) => { setDirect(v); emit({ directCommission: v }) }
  const handleDay = (v: number) => { setDay(v); emit({ paymentDay: v }) }

  const exampleGross = 3000
  const commissionVal = (model === 'COMISSAO' || model === 'HIBRIDO') ? exampleGross * commission / 100 : 0
  const monthlyVal = (model === 'MENSALIDADE' || model === 'HIBRIDO') ? monthly : 0
  const gestora = commissionVal + monthlyVal
  const ownerNet = exampleGross - gestora

  return (
    <div className="space-y-4">

      {/* Seleção do modelo */}
      <div className="grid grid-cols-1 gap-3">
        {MODELS.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleModel(m.id)}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              model === m.id ? 'border-[#1A56DB] bg-[#EFF6FF]' : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${model === m.id ? 'bg-[#1A56DB]' : ''}`}
                 style={model !== m.id ? { background: m.bg } : {}}>
              <m.icon size={18} strokeWidth={1.5} color={model === m.id ? 'white' : m.color} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                {'recommended' in m && m.recommended && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Recomendado</span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-0.5">{m.description}</p>
              <p className="text-gray-400 text-[11px] mt-1">{m.example}</p>
            </div>
            {model === m.id && <Check size={16} strokeWidth={2} className="text-[#1A56DB] flex-shrink-0 mt-1" />}
          </button>
        ))}
      </div>

      {/* Configurações */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Configurar valores</p>

        {(model === 'COMISSAO' || model === 'HIBRIDO') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Comissão sobre locação (%)</label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="100" step="0.5" value={commission}
                onChange={e => handleCommission(Number(e.target.value))}
                className="w-28 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]"
              />
              <p className="text-gray-400 text-sm">% de cada reserva</p>
            </div>
          </div>
        )}

        {(model === 'MENSALIDADE' || model === 'HIBRIDO') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Taxa mensal de gestão (R$)</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input type="number" min="0" step="50" value={monthly}
                  onChange={e => handleMonthly(Number(e.target.value))}
                  className="w-36 pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]"
                />
              </div>
              <p className="text-gray-400 text-sm">por mês</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            Comissão locação direta (%)
            <span title="Quando a gestora faz a locação diretamente (sem Airbnb/Booking)">
              <Info size={13} strokeWidth={1.5} className="text-gray-400" />
            </span>
          </label>
          <div className="flex items-center gap-3">
            <input type="number" min="0" max="100" step="0.5" value={direct}
              onChange={e => handleDirect(Number(e.target.value))}
              className="w-28 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]"
            />
            <p className="text-gray-400 text-sm">% nas locações diretas</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Dia do repasse ao proprietário</label>
          <div className="flex items-center gap-3">
            <input type="number" min="1" max="28" value={day}
              onChange={e => handleDay(Number(e.target.value))}
              className="w-20 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]"
            />
            <p className="text-gray-400 text-sm">de cada mês</p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg border border-gray-100 p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Exemplo com reserva de R$ {exampleGross.toLocaleString('pt-BR')}</p>
          <div className="space-y-1.5 text-xs">
            {commissionVal > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Comissão ({commission}%)</span>
                <span className="font-medium text-red-500">- R$ {commissionVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {monthlyVal > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Taxa mensal</span>
                <span className="font-medium text-red-500">- R$ {monthlyVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-gray-100">
              <span className="font-semibold text-gray-700">Repasse ao proprietário</span>
              <span className="font-bold text-green-600">R$ {Math.max(0, ownerNet).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Receita da gestora</span>
              <span className="font-bold text-[#1A56DB]">R$ {gestora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
