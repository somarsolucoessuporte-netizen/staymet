'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { updatePropertyGuia } from '@/lib/actions/guia'

interface GuiaWifiFormProps {
  propertyId: string
  wifiName: string | null
  wifiPassword: string | null
  deliveryInstructions: string | null
}

export function GuiaWifiForm({ propertyId, wifiName, wifiPassword, deliveryInstructions }: GuiaWifiFormProps) {
  const [pending, startTransition] = useTransition()
  const { toast } = useToast()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updatePropertyGuia(propertyId, {
        wifiName: String(fd.get('wifiName') ?? ''),
        wifiPassword: String(fd.get('wifiPassword') ?? ''),
        deliveryInstructions: String(fd.get('deliveryInstructions') ?? ''),
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
        <Label htmlFor="deliveryInstructions">Instruções para entregadores</Label>
        <Textarea
          id="deliveryInstructions"
          name="deliveryInstructions"
          rows={4}
          defaultValue={deliveryInstructions ?? ''}
          placeholder="Ex: Casa azul no final da Rua das Dunas, portão de madeira. Tocar a campainha ao chegar."
        />
      </div>
      <Button type="submit" loading={pending} className="w-full">
        Salvar
      </Button>
    </form>
  )
}
