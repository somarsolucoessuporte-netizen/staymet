import {
  WifiHigh, HandWaving, ShoppingCart, ForkKnife, Pizza, UmbrellaSimple, MapTrifold,
  Bus, Airplane, Package, Siren, MapPin,
} from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'

// Ícones do guia público do hóspede: Phosphor duotone, um estilo único por categoria

export type GuiaIconKind =
  | 'WIFI' | 'ENTREGADOR' | 'EMERGENCIA'
  | 'ANFITRIAO' | 'MERCADO' | 'RESTAURANTE' | 'DELIVERY' | 'PASSEIO' | 'TRANSPORTE' | 'OUTRO'

type Style = { Icon: Icon; color: string; from: string; to: string }

const BLUE = { color: '#1A56DB', from: '#EFF6FF', to: '#DBEAFE' }
const ORANGE = { color: '#EA580C', from: '#FFF7ED', to: '#FFEDD5' }

const STYLES: Record<GuiaIconKind, Style> = {
  WIFI:        { Icon: WifiHigh,       ...BLUE },
  ANFITRIAO:   { Icon: HandWaving,     ...BLUE },
  MERCADO:     { Icon: ShoppingCart,   color: '#059669', from: '#ECFDF5', to: '#D1FAE5' },
  RESTAURANTE: { Icon: ForkKnife,      ...ORANGE },
  DELIVERY:    { Icon: Pizza,          ...ORANGE },
  PASSEIO:     { Icon: UmbrellaSimple, color: '#0284C7', from: '#F0F9FF', to: '#E0F2FE' },
  TRANSPORTE:  { Icon: Bus,            color: '#4F46E5', from: '#EEF2FF', to: '#E0E7FF' },
  ENTREGADOR:  { Icon: Package,        color: '#D97706', from: '#FFFBEB', to: '#FEF3C7' },
  EMERGENCIA:  { Icon: Siren,          color: '#DC2626', from: '#FEF2F2', to: '#FEE2E2' },
  OUTRO:       { Icon: MapPin,         ...BLUE },
}

/** Estilo do ícone, com variações pelo conteúdo do botão (rota no Maps, aeroporto) */
export function guiaIconStyle(kind: string, item?: { name?: string; externalUrl?: string | null }): Style {
  const base = STYLES[kind as GuiaIconKind] ?? STYLES.OUTRO
  if (kind === 'PASSEIO' && item?.externalUrl && /maps|goo\.gl/i.test(item.externalUrl)) {
    return { ...base, Icon: MapTrifold }
  }
  if (kind === 'TRANSPORTE' && item?.name && /aeroporto/i.test(item.name)) {
    return { ...base, Icon: Airplane }
  }
  return base
}

/** Ícone em quadrado arredondado de 52px com gradiente suave */
export function GuiaIcon({ kind, item }: { kind: string; item?: { name?: string; externalUrl?: string | null } }) {
  const { Icon, color, from, to } = guiaIconStyle(kind, item)
  return (
    <span
      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <Icon size={34} weight="duotone" color={color} />
    </span>
  )
}
