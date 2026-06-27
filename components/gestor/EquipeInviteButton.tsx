'use client'

import { useState } from 'react'
import { UserPlus, X, Mail, Shield } from 'lucide-react'

const ALLOWED_ROLES = [
  { value: 'ANFITRIAO', label: 'Anfitrião' },
  { value: 'PRESTADOR', label: 'Prestador' },
]

interface Property { id: string; name: string }

export function EquipeInviteButton({ properties }: { properties: Property[] }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', role: 'ANFITRIAO', propertyIds: [] as string[] })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ tempPassword?: string; error?: string } | null>(null)

  const toggleProperty = (id: string) =>
    setForm(f => ({
      ...f,
      propertyIds: f.propertyIds.includes(id) ? f.propertyIds.filter(p => p !== id) : [...f.propertyIds, id],
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) setResult({ tempPassword: data.tempPassword })
      else setResult({ error: data.error })
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => { setOpen(false); setForm({ email: '', name: '', role: 'ANFITRIAO', propertyIds: [] }); setResult(null) }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1A56DB] text-white rounded-xl text-xs font-semibold hover:bg-[#1745BE] transition-colors flex-shrink-0"
      >
        <UserPlus size={14} strokeWidth={1.5} />
        Convidar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">Convidar para a equipe</p>
              <button onClick={close} className="text-gray-400"><X size={16} strokeWidth={1.5} /></button>
            </div>

            {result?.tempPassword ? (
              <div className="p-5 space-y-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Shield size={22} strokeWidth={1.5} className="mx-auto text-green-600 mb-2" />
                  <p className="font-semibold text-green-800 text-sm mb-1">Usuário criado!</p>
                  <div className="bg-white rounded-lg p-3 text-left border border-green-100 mt-2 space-y-1">
                    <p className="text-[11px] text-gray-400">E-mail</p>
                    <p className="text-sm font-mono text-gray-800">{form.email}</p>
                    <p className="text-[11px] text-gray-400 mt-2">Senha temporária</p>
                    <p className="text-sm font-mono font-bold text-[#1A56DB]">{result.tempPassword}</p>
                  </div>
                </div>
                <button onClick={close} className="w-full py-2.5 bg-[#1A56DB] text-white rounded-xl font-semibold text-sm">Fechar</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {result?.error && (
                  <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-xl">{result.error}</div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nome</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Função</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALLOWED_ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                          form.role === r.value ? 'border-[#1A56DB] bg-[#EFF6FF] text-[#1A56DB]' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {properties.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Vincular a imóveis</label>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {properties.map(p => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input type="checkbox" checked={form.propertyIds.includes(p.id)} onChange={() => toggleProperty(p.id)} className="accent-[#1A56DB]" />
                          <span className="text-sm text-gray-700">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-[#1A56DB] text-white rounded-xl font-semibold text-sm hover:bg-[#1745BE] disabled:opacity-50">
                  {submitting ? 'Criando...' : 'Criar e convidar'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
