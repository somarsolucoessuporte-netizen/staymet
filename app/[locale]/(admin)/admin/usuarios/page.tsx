'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Search, X, UserPlus, Mail, Shield, Building2 } from 'lucide-react'

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador', color: 'bg-red-100 text-red-700' },
  { value: 'GESTOR', label: 'Gestor', color: 'bg-blue-100 text-blue-700' },
  { value: 'PROPRIETARIO', label: 'Proprietário', color: 'bg-amber-100 text-amber-700' },
  { value: 'ANFITRIAO', label: 'Anfitrião', color: 'bg-purple-100 text-purple-700' },
  { value: 'PRESTADOR', label: 'Prestador', color: 'bg-green-100 text-green-700' },
  { value: 'HOSPEDE', label: 'Hóspede', color: 'bg-gray-100 text-gray-700' },
]

const roleColor = (role: string) => ROLES.find(r => r.value === role)?.color ?? 'bg-gray-100 text-gray-700'
const roleLabel = (role: string) => ROLES.find(r => r.value === role)?.label ?? role

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
}

interface Property {
  id: string
  name: string
}

export default function UsuariosPage() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [form, setForm] = useState({ email: '', name: '', role: 'GESTOR', propertyIds: [] as string[] })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ tempPassword?: string; error?: string } | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const loadProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties')
      if (res.ok) {
        const data = await res.json()
        setProperties(data?.properties ?? data ?? [])
      }
    } catch {}
  }

  useEffect(() => { loadUsers(); loadProperties() }, [])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

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
      if (res.ok) {
        setResult({ tempPassword: data.tempPassword })
        loadUsers()
      } else {
        setResult({ error: data.error })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => { setShowModal(false); setForm({ email: '', name: '', role: 'GESTOR', propertyIds: [] }); setResult(null) }

  const toggleProperty = (id: string) => {
    setForm(f => ({
      ...f,
      propertyIds: f.propertyIds.includes(id)
        ? f.propertyIds.filter(p => p !== id)
        : [...f.propertyIds, id],
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Gestão de Usuários
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56DB] text-white rounded-xl text-sm font-semibold hover:bg-[#1745BE] transition-colors"
          >
            <UserPlus size={16} strokeWidth={1.5} />
            Convidar usuário
          </button>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4 flex items-center gap-3">
          <Search size={16} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
          <input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-700 placeholder:text-gray-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500">
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#1A56DB] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Users size={32} strokeWidth={1} className="mb-3" />
              <p className="text-sm font-medium">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Usuário</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">E-mail</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Perfil</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleColor(user.role)}`}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{user.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Ativo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de convite */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserPlus size={18} strokeWidth={1.5} className="text-[#1A56DB]" />
                <p className="font-semibold text-gray-900">Convidar novo usuário</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {result?.tempPassword ? (
              <div className="p-5 space-y-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Shield size={24} strokeWidth={1.5} className="mx-auto text-green-600 mb-2" />
                  <p className="font-semibold text-green-800 mb-1">Usuário criado com sucesso!</p>
                  <p className="text-sm text-green-600 mb-3">Compartilhe as credenciais de acesso inicial:</p>
                  <div className="bg-white rounded-lg p-3 text-left space-y-1 border border-green-100">
                    <p className="text-xs text-gray-400">E-mail</p>
                    <p className="text-sm font-mono font-medium text-gray-800">{form.email}</p>
                    <p className="text-xs text-gray-400 mt-2">Senha temporária</p>
                    <p className="text-sm font-mono font-bold text-[#1A56DB]">{result.tempPassword}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">O usuário deve trocar a senha no primeiro acesso.</p>
                </div>
                <button onClick={closeModal} className="w-full py-3 bg-[#1A56DB] text-white rounded-xl font-semibold text-sm hover:bg-[#1745BE]">
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {result?.error && (
                  <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{result.error}</div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nome completo</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Maria Silva"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Perfil de acesso</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all text-left ${
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
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      <Building2 size={12} strokeWidth={1.5} className="inline mr-1" />
                      Vincular a imóveis (opcional)
                    </label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {properties.map(p => (
                        <label key={p.id} className="flex items-center gap-2.5 cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={form.propertyIds.includes(p.id)}
                            onChange={() => toggleProperty(p.id)}
                            className="accent-[#1A56DB]"
                          />
                          <span className="text-sm text-gray-700">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#1A56DB] text-white rounded-xl font-semibold text-sm hover:bg-[#1745BE] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Criando usuário...' : 'Criar e enviar convite'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
