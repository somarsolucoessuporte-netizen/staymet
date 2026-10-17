'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore, CheckCircle2, Eye, Mail, MessageSquare, Pencil, Repeat, Send, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import {
  updateOccurrence, changeStatus, changePriority, assignOccurrence, addComment, resolveOccurrence,
  archiveOccurrence, unarchiveOccurrence, deleteOccurrence, markSuggestion, convertSuggestion,
} from '@/lib/actions/ocorrencias'
import { OPERATIONAL_CATEGORIES, PRIORITIES } from '@/lib/occurrences'
import { cn } from '@/lib/utils'

type Res = { ok: boolean; error?: string }

export type ControlsData = {
  id: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  archived: boolean
  assignedToId: string | null
  photos: string[]
  isSuggestion: boolean
  whatsappHref: string | null
  mailHref: string | null
}

const field = 'w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15'
const btn = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50'

export function OccurrenceControls({
  data,
  basePath,
  canManage,
  isAdmin,
  assignees,
}: {
  data: ControlsData
  basePath: string
  canManage: boolean
  isAdmin: boolean
  assignees: { id: string; name: string }[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [comment, setComment] = useState('')
  const [resolution, setResolution] = useState('')

  const run = (fn: () => Promise<Res>, ok?: string, after?: () => void) =>
    start(async () => {
      const r = await fn()
      if (!r.ok) return toast({ title: 'Não foi possível', description: r.error, variant: 'error' })
      if (ok) toast({ title: ok, variant: 'success' })
      after?.()
    })

  return (
    <div className="space-y-4">
      {/* Status, prioridade e responsável */}
      {canManage && !data.isSuggestion && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5">
          <label className="space-y-1 text-[11px] font-semibold text-[#64748B]">
            Status
            <select
              value={data.status === 'RESOLVIDA' ? 'RESOLVIDA' : data.status}
              disabled={pending}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'RESOLVIDA') return setResolving(true)
                run(() => changeStatus(data.id, v as 'ABERTA' | 'EM_ANDAMENTO'), 'Status atualizado')
              }}
              className={cn(field, 'h-10 py-0')}
            >
              <option value="ABERTA">Aberta</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="RESOLVIDA">Resolvida</option>
            </select>
          </label>
          <label className="space-y-1 text-[11px] font-semibold text-[#64748B]">
            Prioridade
            <select
              value={data.priority}
              disabled={pending}
              onChange={(e) => run(() => changePriority(data.id, e.target.value as 'BAIXA'), 'Prioridade atualizada')}
              className={cn(field, 'h-10 py-0')}
            >
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          <label className="col-span-2 space-y-1 text-[11px] font-semibold text-[#64748B]">
            Responsável
            <select
              value={data.assignedToId ?? ''}
              disabled={pending}
              onChange={(e) => run(() => assignOccurrence(data.id, e.target.value || null), 'Responsável atualizado')}
              className={cn(field, 'h-10 py-0')}
            >
              <option value="">Ninguém</option>
              {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
        </div>
      )}

      {/* Sugestões: lida / responder / converter */}
      {canManage && data.isSuggestion && (
        <div className="space-y-2 rounded-2xl bg-white p-3 ring-1 ring-black/5">
          <div className="grid grid-cols-2 gap-2">
            {data.status === 'ABERTA' && (
              <button type="button" disabled={pending} onClick={() => run(() => markSuggestion(data.id, 'lida'), 'Marcada como lida')} className={cn(btn, 'bg-[#F1F5FF] text-[#1A56DB]')}>
                <Eye size={16} /> Marcar como lida
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await convertSuggestion(data.id)
                  if (!r.ok) return toast({ title: 'Não foi possível', description: r.error, variant: 'error' })
                  toast({ title: 'Ocorrência criada a partir da sugestão', variant: 'success' })
                  router.push(`${basePath}/${r.id}`)
                })
              }
              className={cn(btn, 'bg-[#F1F5FF] text-[#1A56DB]')}
            >
              <Repeat size={16} /> Converter em ocorrência
            </button>
          </div>
          {(data.whatsappHref || data.mailHref) && (
            <div className="grid grid-cols-2 gap-2">
              {data.whatsappHref && (
                <a
                  href={data.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => run(() => markSuggestion(data.id, 'respondida', 'WhatsApp'))}
                  className={cn(btn, 'bg-[#25D366] text-white')}
                >
                  <MessageSquare size={16} /> Responder no WhatsApp
                </a>
              )}
              {data.mailHref && (
                <a
                  href={data.mailHref}
                  onClick={() => run(() => markSuggestion(data.id, 'respondida', 'e-mail'))}
                  className={cn(btn, 'bg-[#0F172A] text-white')}
                >
                  <Mail size={16} /> Responder por e-mail
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resolver (exige a solução) */}
      {canManage && !data.isSuggestion && data.status !== 'RESOLVIDA' && (
        resolving ? (
          <div className="space-y-2 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
            <p className="text-sm font-semibold text-emerald-800">Como foi resolvido?</p>
            <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} placeholder="Descreva a solução (obrigatório)" className={field} />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending || resolution.trim().length < 3}
                onClick={() => run(() => resolveOccurrence(data.id, resolution), 'Ocorrência resolvida', () => setResolving(false))}
                className={cn(btn, 'flex-1 bg-emerald-600 text-white')}
              >
                <CheckCircle2 size={16} /> Resolver
              </button>
              <button type="button" onClick={() => setResolving(false)} className={cn(btn, 'bg-white text-gray-700')}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setResolving(true)} className={cn(btn, 'w-full bg-emerald-600 text-white')}>
            <CheckCircle2 size={16} /> Resolver
          </button>
        )
      )}

      {/* Editar */}
      {canManage && (
        editing ? (
          <form
            className="space-y-2 rounded-2xl bg-white p-3 ring-1 ring-black/5"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              run(
                () => updateOccurrence(data.id, {
                  title: String(fd.get('title') ?? ''),
                  description: String(fd.get('description') ?? ''),
                  category: String(fd.get('category') ?? data.category),
                  photos: data.photos,
                }),
                'Ocorrência atualizada',
                () => setEditing(false),
              )
            }}
          >
            <input name="title" defaultValue={data.title} className={field} aria-label="Título" />
            <textarea name="description" defaultValue={data.description} rows={4} className={field} aria-label="Descrição" />
            {!data.isSuggestion && (
              <select name="category" defaultValue={data.category} className={cn(field, 'h-10 py-0')} aria-label="Categoria">
                {OPERATIONAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className={cn(btn, 'flex-1 bg-[#1A56DB] text-white')}>Salvar</button>
              <button type="button" onClick={() => setEditing(false)} className={cn(btn, 'bg-gray-100 text-gray-700')}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditing(true)} className={cn(btn, 'bg-white text-[#0F172A] ring-1 ring-[#E2E8F0]')}>
              <Pencil size={15} /> Editar
            </button>
            {data.archived ? (
              <button type="button" disabled={pending} onClick={() => run(() => unarchiveOccurrence(data.id), 'Desarquivada')} className={cn(btn, 'bg-white text-[#0F172A] ring-1 ring-[#E2E8F0]')}>
                <ArchiveRestore size={15} /> Desarquivar
              </button>
            ) : (
              <button type="button" disabled={pending} onClick={() => run(() => archiveOccurrence(data.id), 'Arquivada')} className={cn(btn, 'bg-white text-[#0F172A] ring-1 ring-[#E2E8F0]')}>
                <Archive size={15} /> Arquivar
              </button>
            )}
            {isAdmin && (
              confirmDelete ? (
                <span className="flex items-center gap-2 rounded-xl bg-red-50 px-3 text-xs text-red-700">
                  Excluir de vez?
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deleteOccurrence(data.id), 'Ocorrência excluída', () => router.push(basePath))}
                    className="rounded-lg bg-red-600 px-2.5 py-1.5 font-semibold text-white"
                  >
                    Sim, excluir
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg bg-white px-2.5 py-1.5 font-semibold text-gray-700">Não</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className={cn(btn, 'bg-red-50 text-red-700')}>
                  <Trash2 size={15} /> Excluir
                </button>
              )
            )}
          </div>
        )
      )}

      {/* Comentário (inclui prestador) */}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => addComment(data.id, comment), 'Comentário adicionado', () => setComment(''))
        }}
      >
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Escreva um comentário…" className={field} aria-label="Comentário" />
        <button type="submit" disabled={pending || !comment.trim()} aria-label="Enviar comentário" className={cn(btn, 'h-11 w-11 shrink-0 bg-[#1A56DB] p-0 text-white')}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
