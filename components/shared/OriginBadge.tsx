import { Suitcase, Wrench, Broom, House, ClipboardText, User, Star, Archive } from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Selo de origem de ocorrências/sugestões (quem registrou)
const ORIGINS: Record<string, { Icon: Icon; label: string; cls: string }> = {
  HOSPEDE:       { Icon: Suitcase,      label: 'Hóspede',      cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  PRESTADOR:     { Icon: Wrench,        label: 'Prestador',    cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ANFITRIAO:     { Icon: House,         label: 'Anfitrião',    cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  GESTOR:        { Icon: ClipboardText, label: 'Gestor',       cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  PROPRIETARIO:  { Icon: User,          label: 'Proprietário', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  ADMINISTRADOR: { Icon: Star,          label: 'Admin',        cls: 'bg-purple-50 text-purple-700 ring-purple-200' },
  PAINEL:        { Icon: Archive,       label: 'Painel',       cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
}

export function OriginBadge({
  source,
  name,
  prestadorKind,
  className,
}: {
  source: string
  name?: string | null
  /** tipo da tarefa do prestador no imóvel: LIMPEZA → "Limpeza", MANUTENCAO → "Manutenção" */
  prestadorKind?: string | null
  className?: string
}) {
  const o = ORIGINS[source] ?? ORIGINS.PAINEL
  let label = o.label
  let Glyph = o.Icon
  if (source === 'HOSPEDE' && name) label = `${o.label} ${name.split(' ')[0]}`
  if (source === 'PRESTADOR' && prestadorKind === 'LIMPEZA') { label = 'Limpeza'; Glyph = Broom }
  if (source === 'PRESTADOR' && prestadorKind === 'MANUTENCAO') label = 'Manutenção'
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', o.cls, className)}>
      <Glyph size={12} weight="bold" aria-hidden />
      {label}
    </span>
  )
}
