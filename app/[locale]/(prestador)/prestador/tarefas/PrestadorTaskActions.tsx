'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Play, Check, Camera } from 'lucide-react'

interface PrestadorTaskActionsProps {
  taskId: string
  status: string
}

export function PrestadorTaskActions({ taskId, status }: PrestadorTaskActionsProps) {
  const router = useRouter()
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'EM_ANDAMENTO' }),
    })
    setLoading(false)
    router.refresh()
  }

  const handleComplete = async () => {
    setLoading(true)
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONCLUIDA', notes }),
    })
    setLoading(false)
    setShowCompleteModal(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-2">
        {status === 'PENDENTE' && (
          <Button variant="default" size="sm" onClick={handleStart} loading={loading} className="flex-1">
            <Play className="h-3.5 w-3.5" />
            Iniciar
          </Button>
        )}
        {status === 'EM_ANDAMENTO' && (
          <Button variant="success" size="sm" onClick={() => setShowCompleteModal(true)} className="flex-1">
            <Check className="h-3.5 w-3.5" />
            Concluir
          </Button>
        )}
      </div>

      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                placeholder="Descreva o que foi feito..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg p-3">
              <Camera className="h-4 w-4" />
              <span>Fotos podem ser adicionadas via Supabase Storage</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteModal(false)}>Cancelar</Button>
            <Button variant="success" onClick={handleComplete} loading={loading}>
              <Check className="h-4 w-4" />
              Confirmar Conclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
