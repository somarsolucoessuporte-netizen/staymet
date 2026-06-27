'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MapPin, Clock, Camera, CheckCircle, Navigation,
  Wrench, Sparkles, AlertTriangle, ClipboardCheck,
} from 'lucide-react'

const taskTypeConfig: Record<string, { color: string; label: string; Icon: typeof CheckCircle }> = {
  LIMPEZA:         { color: '#3B82F6', label: 'Limpeza',           Icon: Sparkles },
  MANUTENCAO:      { color: '#F59E0B', label: 'Manutenção',        Icon: Wrench },
  VISTORIA_ENTRADA:{ color: '#10B981', label: 'Vistoria entrada',  Icon: ClipboardCheck },
  VISTORIA_SAIDA:  { color: '#EF4444', label: 'Vistoria saída',    Icon: ClipboardCheck },
  OUTRO:           { color: '#8B5CF6', label: 'Tarefa',            Icon: AlertTriangle },
}

export default function PrestadorMagicPage() {
  const params = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/magic-links/${params.token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d.link)
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [params.token])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const uploaded: string[] = []
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'task-photos')
      formData.append('path', `magic/${params.token}/${Date.now()}-${file.name}`)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (json.url) uploaded.push(json.url)
      } catch {
        // upload falhou para este arquivo
      }
    }
    setPhotos((prev) => [...prev, ...uploaded])
    setUploading(false)
  }

  const handleComplete = async () => {
    if (!data?.taskId) return
    setCompleting(true)
    await fetch(`/api/tasks/${data.taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONCLUIDA',
        photos,
        notes: notes || undefined,
        completedAt: new Date().toISOString(),
        magicToken: params.token,
      }),
    })
    setCompleting(false)
    setDone(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-white/50 text-sm animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Link inválido</h2>
          <p className="text-white/40 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Tarefa concluída!
          </h2>
          <p className="text-white/50 text-sm">O responsável foi notificado. Obrigado!</p>
          {photos.length > 0 && (
            <p className="text-white/30 text-xs mt-3">{photos.length} foto(s) enviada(s)</p>
          )}
          <p className="text-white/20 text-xs mt-8">Powered by Somar Soluções Digitais</p>
        </div>
      </div>
    )
  }

  const task = data?.task
  const property = task?.property
  const cfg = taskTypeConfig[task?.type ?? 'OUTRO'] ?? taskTypeConfig.OUTRO
  const { Icon } = cfg

  return (
    <div className="min-h-screen bg-[#0F172A]">

      {/* Header */}
      <div className="px-5 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 bg-[#1A56DB] rounded-lg flex items-center justify-center shadow-md shadow-[#1A56DB]/30">
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
          </div>
          <span className="text-white font-semibold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Staymet</span>
        </div>
        <p className="text-white/50 text-sm">Olá, {data?.prestadorName ?? 'prestador'}!</p>
        <h1 className="text-white text-xl font-bold mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Sua tarefa de hoje
        </h1>
      </div>

      {/* Card da tarefa */}
      <div className="mx-4 bg-white rounded-2xl overflow-hidden mb-4 shadow-lg">
        <div className="h-1.5" style={{ background: cfg.color }} />
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.color + '20' }}>
              <Icon size={18} style={{ color: cfg.color }} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">{task?.title}</h2>
            </div>
          </div>

          {task?.description && (
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{task.description}</p>
          )}

          {/* Imóvel */}
          {property && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{property.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{property.address}</p>
                  <p className="text-gray-500 text-xs">{property.city}, {property.state}</p>
                </div>
              </div>
            </div>
          )}

          {/* Horário */}
          {task?.scheduledFor && (
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-600 text-sm">
                {format(new Date(task.scheduledFor), "HH:mm 'de' dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          )}

          {/* Google Maps */}
          {property?.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`${property.address} ${property.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Navigation size={14} />
              Abrir no Google Maps
            </a>
          )}
        </div>
      </div>

      {/* Upload de fotos + notas */}
      <div className="mx-4 bg-white rounded-2xl p-5 mb-4 shadow-lg">
        <h3 className="font-semibold text-gray-900 mb-0.5">Registrar execução</h3>
        <p className="text-gray-500 text-xs mb-4">Tire fotos antes e depois do serviço</p>

        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1A56DB]/40 hover:bg-blue-50/30 transition-all mb-3">
          {uploading ? (
            <p className="text-sm text-gray-400 animate-pulse">Enviando fotos...</p>
          ) : (
            <>
              <Camera size={24} className="text-gray-300 mb-2" />
              <span className="text-sm text-gray-400">Toque para fotografar</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={url} className="w-full h-full object-cover" alt={`Foto ${i + 1}`} />
              </div>
            ))}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações (opcional)..."
          className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] resize-none"
          rows={3}
        />
      </div>

      {/* Botão concluir */}
      <div className="px-4 pb-10">
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <CheckCircle size={20} />
          {completing ? 'Enviando...' : 'Concluir tarefa'}
        </button>
        <p className="text-white/25 text-xs text-center mt-4">
          Powered by Somar Soluções Digitais
        </p>
      </div>
    </div>
  )
}
