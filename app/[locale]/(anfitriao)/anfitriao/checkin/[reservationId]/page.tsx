'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CheckSquare, XSquare, Check, Users, Wifi } from 'lucide-react'

const checklistItems = [
  'Cama(s) arrumada(s)',
  'Roupa de cama limpa',
  'Toalhas disponíveis',
  'Banheiro limpo',
  'Cozinha limpa e organizada',
  'Eletrodomésticos funcionando',
  'TV/Internet funcionando',
  'Ar-condicionado funcionando',
  'Itens de higiene (sabonete, shampoo)',
  'Lixeiras vazias',
]

export default function CheckinPage() {
  const params = useParams<{ locale: string; reservationId: string }>()
  const router = useRouter()
  const [checklist, setChecklist] = useState(
    checklistItems.map((item) => ({ item, ok: true, note: '' }))
  )
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleItem = (idx: number) => {
    setChecklist((prev) => prev.map((c, i) => (i === idx ? { ...c, ok: !c.ok } : c)))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await fetch(`/api/reservations/${params.reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EM_ANDAMENTO' }),
      })

      await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ENTRADA',
          propertyId: '',
          reservationId: params.reservationId,
          checklist,
          notes,
        }),
      })

      router.push(`/${params.locale}/anfitriao/dashboard`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 pt-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Vistoria de Entrada</h1>
        <p className="text-sm text-muted-foreground">Verifique todos os itens abaixo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-success" />
            Checklist ({checklist.filter((c) => c.ok).length}/{checklist.length} OK)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggleItem(idx)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border text-left active:scale-[0.99] transition-transform"
            >
              {item.ok ? (
                <Check className="h-5 w-5 text-success shrink-0" />
              ) : (
                <XSquare className="h-5 w-5 text-danger shrink-0" />
              )}
              <span className={`text-sm ${item.ok ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                {item.item}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Observações</label>
        <Textarea
          placeholder="Adicione observações sobre o estado do imóvel..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        onClick={handleSubmit}
        loading={loading}
        className="w-full"
        size="lg"
        variant="success"
      >
        <Check className="h-4 w-4" />
        Confirmar Check-in
      </Button>

      <p className="text-center text-[11px] text-muted-foreground/50">Powered by Somar Soluções Digitais</p>
    </div>
  )
}
