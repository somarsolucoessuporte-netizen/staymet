'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Search } from 'lucide-react'

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-1">Listar, criar e gerenciar todos os usuários</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-semibold">Nome</th>
                    <th className="text-left py-3 px-2 font-semibold">E-mail</th>
                    <th className="text-left py-3 px-2 font-semibold">Role</th>
                    <th className="text-left py-3 px-2 font-semibold">Status</th>
                    <th className="text-left py-3 px-2 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    users.map((user: any) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">{user.name}</td>
                        <td className="py-3 px-2">{user.email}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Ativo
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
