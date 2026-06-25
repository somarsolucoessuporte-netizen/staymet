'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function VistoriasPage() {
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const res = await fetch('/api/admin/inspections')
        if (res.ok) {
          const data = await res.json()
          setInspections(data)
        }
      } catch (error) {
        console.error('Failed to fetch inspections:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInspections()
  }, [])

  const handleApprove = async (inspectionId: string) => {
    try {
      const res = await fetch(`/api/admin/inspections/${inspectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      if (res.ok) {
        setInspections((prev) => prev.filter((i: any) => i.id !== inspectionId))
      }
    } catch (error) {
      console.error('Failed to approve inspection:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold">Validar Vistorias</h1>
          <p className="text-muted-foreground mt-1">Aprovar vistorias de entrada e saída pendentes</p>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : inspections.length === 0 ? (
            <Card className="p-6">
              <div className="flex items-center justify-center text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mr-4" />
                <div>
                  <p className="font-semibold">Nenhuma vistoria pendente</p>
                  <p className="text-sm text-muted-foreground">Todas as vistorias foram validadas</p>
                </div>
              </div>
            </Card>
          ) : (
            inspections.map((inspection: any) => (
              <Card key={inspection.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <h3 className="font-semibold">{inspection.propertyName}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vistoria de {inspection.type === 'ENTRADA' ? 'entrada' : 'saída'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reserva: {inspection.guestName}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleApprove(inspection.id)}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </Button>
                </div>
                {inspection.photos?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Fotos:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {inspection.photos.map((photo: string, idx: number) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
