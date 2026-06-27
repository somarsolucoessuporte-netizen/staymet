'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface MonthData {
  label: string
  receita: number
  gestora: number
  repasse: number
}

const BRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold">{BRL(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function FinanceBarChart({ data }: { data: MonthData[] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
      Sem dados para exibir
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%" barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          formatter={(value) => <span className="text-gray-500">{value}</span>}
        />
        <Bar dataKey="receita" name="Receita bruta" fill="#1A56DB" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gestora" name="Gestora" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="repasse" name="Repasse" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
