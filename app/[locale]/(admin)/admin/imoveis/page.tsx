'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Search } from 'lucide-react'

export default function ImoveisPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/admin/properties')
        if (res.ok) {
          const data = await res.json()
          setProperties(data)
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Imóveis</h1>
          <p className="text-muted-foreground mt-1">Visualizar todos os imóveis cadastrados na plataforma</p>
        </div>

        <Card className="p-6 mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou cidade..."
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
                    <th className="text-left py-3 px-2 font-semibold">Tipo</th>
                    <th className="text-left py-3 px-2 font-semibold">Cidade</th>
                    <th className="text-left py-3 px-2 font-semibold">Proprietário</th>
                    <th className="text-left py-3 px-2 font-semibold">Status</th>
                    <th className="text-left py-3 px-2 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum imóvel encontrado
                      </td>
                    </tr>
                  ) : (
                    properties.map((prop: any) => (
                      <tr key={prop.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{prop.name}</td>
                        <td className="py-3 px-2">{prop.type}</td>
                        <td className="py-3 px-2">{prop.city}</td>
                        <td className="py-3 px-2">{prop.ownerName}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            prop.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {prop.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <Button variant="ghost" size="sm">
                            Ver Detalhes
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
