import {
  Lightning, Drop, Broom, Bed, Wall, Television, WifiHigh, Package, Gear, DotsThreeCircle, Lightbulb,
} from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'

const MAP: Record<string, { Icon: Icon; color: string; bg: string }> = {
  ELETRICA:        { Icon: Lightning,       color: '#D97706', bg: '#FFFBEB' },
  HIDRAULICA:      { Icon: Drop,            color: '#0284C7', bg: '#F0F9FF' },
  LIMPEZA:         { Icon: Broom,           color: '#DB2777', bg: '#FDF2F8' },
  ROUPA_CAMA:      { Icon: Bed,             color: '#4F46E5', bg: '#EEF2FF' },
  ESTRUTURA:       { Icon: Wall,            color: '#78716C', bg: '#F5F5F4' },
  ELETRODOMESTICO: { Icon: Television,      color: '#7C3AED', bg: '#F5F3FF' },
  INTERNET:        { Icon: WifiHigh,        color: '#1A56DB', bg: '#EFF6FF' },
  FALTA_ITEM:      { Icon: Package,         color: '#EA580C', bg: '#FFF7ED' },
  OPERACIONAL:     { Icon: Gear,            color: '#475569', bg: '#F1F5F9' },
  OUTRO:           { Icon: DotsThreeCircle, color: '#64748B', bg: '#F1F5F9' },
  SUGESTAO:        { Icon: Lightbulb,       color: '#1A56DB', bg: '#EFF6FF' },
}

/** Ícone da categoria da ocorrência (Phosphor duotone em quadrado arredondado) */
export function OccurrenceCategoryIcon({ category, size = 40 }: { category: string; size?: number }) {
  const { Icon, color, bg } = MAP[category] ?? MAP.OUTRO
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: bg }}
    >
      <Icon size={Math.round(size * 0.55)} weight="duotone" color={color} />
    </span>
  )
}
