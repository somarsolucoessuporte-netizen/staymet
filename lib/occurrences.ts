// Constantes de ocorrências e sugestões — seguro para client e server

export const OPERATIONAL_CATEGORIES = [
  { value: 'ELETRICA',        label: 'Elétrica' },
  { value: 'HIDRAULICA',      label: 'Hidráulica' },
  { value: 'LIMPEZA',         label: 'Limpeza' },
  { value: 'ROUPA_CAMA',      label: 'Roupa de cama/banho' },
  { value: 'ESTRUTURA',       label: 'Estrutura' },
  { value: 'ELETRODOMESTICO', label: 'Eletrodoméstico' },
  { value: 'INTERNET',        label: 'Internet/TV' },
  { value: 'FALTA_ITEM',      label: 'Falta de item' },
  { value: 'OPERACIONAL',     label: 'Operacional' },
  { value: 'OUTRO',           label: 'Outro' },
] as const

export const SUGGESTION_CATEGORY = 'SUGESTAO'

export type OperationalCategory = (typeof OPERATIONAL_CATEGORIES)[number]['value']
export const OPERATIONAL_CATEGORY_VALUES = OPERATIONAL_CATEGORIES.map((c) => c.value) as [
  OperationalCategory,
  ...OperationalCategory[],
]

export function categoryLabel(category: string) {
  if (category === SUGGESTION_CATEGORY) return 'Sugestão'
  return OPERATIONAL_CATEGORIES.find((c) => c.value === category)?.label ?? category
}

export const SOURCES = [
  { value: 'HOSPEDE',       label: 'Hóspede' },
  { value: 'PRESTADOR',     label: 'Prestador' },
  { value: 'ANFITRIAO',     label: 'Anfitrião' },
  { value: 'GESTOR',        label: 'Gestor' },
  { value: 'PROPRIETARIO',  label: 'Proprietário' },
  { value: 'ADMINISTRADOR', label: 'Admin' },
  { value: 'PAINEL',        label: 'Painel' },
] as const

export const PRIORITIES = [
  { value: 'BAIXA',   label: 'Baixa',   cls: 'bg-gray-100 text-gray-600' },
  { value: 'MEDIA',   label: 'Média',   cls: 'bg-amber-50 text-amber-700' },
  { value: 'ALTA',    label: 'Alta',    cls: 'bg-orange-50 text-orange-700' },
  { value: 'URGENTE', label: 'Urgente', cls: 'bg-red-50 text-red-700' },
] as const

export type PriorityValue = (typeof PRIORITIES)[number]['value']

export const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDA: 'Resolvida',
}

/** Status da sugestão no painel (mapeados nos status existentes + archivedAt) */
export function suggestionStatusLabel(status: string, archivedAt: Date | string | null) {
  if (archivedAt) return 'Arquivada'
  return { ABERTA: 'Nova', EM_ANDAMENTO: 'Lida', RESOLVIDA: 'Respondida' }[status] ?? status
}

export const SUGGESTION_TOPICS = [
  'Conforto',
  'Limpeza',
  'Cozinha/utensílios',
  'Roupa de cama/banho',
  'Wi-Fi/TV',
  'Localização/dicas',
  'Atendimento',
  'Outro',
] as const

export const SUGGESTION_TITLE_PREFIX = 'Sugestão – '
/** Avaliação com estrelas pelo guia: gravada como sugestão (aparece na mesma aba do painel) */
export const REVIEW_TOPIC = 'Avaliação'
export const SUGGESTIONS_PER_DAY = 5

export const EVENT_LABEL: Record<string, string> = {
  CRIADA: 'Criada',
  STATUS: 'Status alterado',
  PRIORIDADE: 'Prioridade alterada',
  ATRIBUIDA: 'Responsável definido',
  COMENTARIO: 'Comentário',
  RESOLVIDA: 'Resolvida',
  ARQUIVADA: 'Arquivada',
  REABERTA: 'Reaberta',
  EDITADA: 'Editada',
  CONVERTIDA: 'Convertida',
}

export function timeAgo(date: Date | string) {
  const min = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}

export function formatDateTimeBR(date: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza',
  }).format(new Date(date))
}
