'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Check, XSquare, AlertTriangle } from 'lucide-react'

const checklistItems = [
  'Imóvel limpo pelo hóspede',
  'Chaves devolvidas',
  'Nenhum dano visível',
  'Eletrodomésticos desligados',
  'Janelas fechadas',
  'Ar-condicionado desligado',
  'Lixeiras esvaziadas',
  'Itens do inventário presentes',
]

export default function CheckoutPage() {
  const params = useParams<{ locale: string; reservationId: string }>()
  const router = useRouter()
  const [checklist, setChecklist] = useState(
    checklistItems.map((item) => ({ item, ok: true, note: '' }))
  )
  const [notes, setNotes] = useState('')
  const [hasDamage, setHasDamage] = useState(false)
  const [damageDesc, setDamageDesc] = useState('')
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
        body: JSON.stringify({ status: 'ENCERRADA' }),
      })

      await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SAIDA',
          propertyId: '',
          reservationId: params.reservationId,
          checklist,
          notes: hasDamage ? `DANO: ${damageDesc}\n${notes}` : notes,
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
        <h1 className="text-xl font-bold">Vistoria de Saída</h1>
        <p className="text-sm text-muted-foreground">Verifique todos os itens ao final da estadia</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Checklist de Saída</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggleItem(idx)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border text-left"
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

      {/* Registro de danos */}
      <Card className={hasDamage ? 'border-danger' : ''}>
        <CardContent className="pt-4">
          <button
            onClick={() => setHasDamage(!hasDamage)}
            className="flex items-center gap-3 w-full"
          >
            <AlertTriangle className={`h-5 w-5 ${hasDamage ? 'text-danger' : 'text-muted-foreground'}`} />
            <span className="font-medium text-sm">Registrar dano ou problema</span>
          </button>
          {hasDamage && (
            <Textarea
              className="mt-3"
              placeholder="Descreva o dano ou problema encontrado..."
              value={damageDesc}
              onChange={(e) => setDamageDesc(e.target.value)}
              rows={3}
            />
          )}
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Observações gerais</label>
        <Textarea
          placeholder="Outras observações..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <Button onClick={handleSubmit} loading={loading} className="w-full" size="lg">
        <Check className="h-4 w-4" />
        Confirmar Check-out
      </Button>
    </div>
  )
}
