'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { updatePropertyGuia } from '@/lib/actions/guia'
import { buildGuestMessage, DELIVERY_PLACEHOLDER } from '@/lib/guia'

interface GuiaWifiFormProps {
  propertyId: string
  propertyName: string
  wifiName: string | null
  wifiPassword: string | null
  deliveryInstructions: string | null
  /** link do Google Maps do ponto salvo, igual ao que vai na mensagem do hóspede */
  mapsUrl: string | null
}

export function GuiaWifiForm({ propertyId, propertyName, wifiName, wifiPassword, deliveryInstructions, mapsUrl }: GuiaWifiFormProps) {
  const [pending, startTransition] = useTransition()
  const [address, setAddress] = useState(deliveryInstructions ?? '')
  const { toast } = useToast()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updatePropertyGuia(propertyId, {
        wifiName: String(fd.get('wifiName') ?? ''),
        wifiPassword: String(fd.get('wifiPassword') ?? ''),
        deliveryInstructions: address,
      })
      toast(res.ok
        ? { title: 'Guia atualizado', variant: 'success' }
        : { title: 'Erro ao salvar', description: res.error, variant: 'error' })
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="wifiName">Nome da rede Wi-Fi</Label>
          <Input id="wifiName" name="wifiName" defaultValue={wifiName ?? ''} autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wifiPassword">Senha Wi-Fi</Label>
          <Input id="wifiPassword" name="wifiPassword" defaultValue={wifiPassword ?? ''} autoComplete="off" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="deliveryInstructions">Endereço padrão para entregas</Label>
        <Textarea
          id="deliveryInstructions"
          name="deliveryInstructions"
          rows={4}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={DELIVERY_PLACEHOLDER}
        />
        <p className="text-xs text-muted-foreground">
          Usado no botão “Entregador” e nas mensagens de pedido (Mercado, Restaurante, Delivery) que não tiverem endereço próprio.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-[#25D366]/50 bg-[#F0FDF4] p-3">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          Prévia: mensagem que o hóspede vai mandar
        </p>
        <p className="whitespace-pre-line text-xs leading-relaxed text-[#334155]">
          {buildGuestMessage('DELIVERY', propertyName, address, mapsUrl)}
        </p>
      </div>
      <Button type="submit" loading={pending} className="w-full">
        Salvar
      </Button>
    </form>
  )
}
