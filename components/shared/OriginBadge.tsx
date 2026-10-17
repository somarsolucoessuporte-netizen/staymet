import { cn } from '@/lib/utils'

// Selo de origem de ocorrências/sugestões (quem registrou)
const ORIGINS: Record<string, { emoji: string; label: string; cls: string }> = {
  HOSPEDE:       { emoji: '🧳', label: 'Hóspede',      cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  PRESTADOR:     { emoji: '🔧', label: 'Prestador',    cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ANFITRIAO:     { emoji: '🏠', label: 'Anfitrião',    cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  GESTOR:        { emoji: '📋', label: 'Gestor',       cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  PROPRIETARIO:  { emoji: '👤', label: 'Proprietário', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  ADMINISTRADOR: { emoji: '⭐', label: 'Admin',        cls: 'bg-purple-50 text-purple-700 ring-purple-200' },
  PAINEL:        { emoji: '🗂', label: 'Painel',       cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
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
  if (source === 'HOSPEDE' && name) label = `${o.label} ${name.split(' ')[0]}`
  if (source === 'PRESTADOR' && prestadorKind === 'LIMPEZA') label = 'Limpeza'
  if (source === 'PRESTADOR' && prestadorKind === 'MANUTENCAO') label = 'Manutenção'
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', o.cls, className)}>
      <span aria-hidden>{o.emoji}</span>
      {label}
    </span>
  )
}
