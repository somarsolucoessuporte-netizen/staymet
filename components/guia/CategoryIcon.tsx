import {
  ShoppingCart, Bread, ForkKnife, Pizza, Hamburger, Moped, HandWaving, Key, Flame, Broom, Wrench, TShirt,
  Jeep, Waves, Wind, MapTrifold, Bus, Taxi, Airplane, Pill, FirstAid, DotsThreeCircle,
  WifiHigh, Package, Siren, Lightbulb, Ambulance, FireTruck, ShieldCheck, NavigationArrow,
} from '@phosphor-icons/react/ssr'
import type { Icon, IconWeight } from '@phosphor-icons/react'
import { getCategoryMeta } from '@/lib/guia'

// Ícone único das categorias do guia: usado no painel do anfitrião (seletor, linhas) e no guia do hóspede.
// Os ícones /ssr não dependem de contexto do React, então funcionam em Server e Client Components.

const ICONS: Record<string, Icon> = {
  ShoppingCart, Bread, ForkKnife, Pizza, Hamburger, Moped, HandWaving, Key, Flame, Broom, Wrench, TShirt,
  Jeep, Waves, Wind, MapTrifold, Bus, Taxi, Airplane, Pill, FirstAid, DotsThreeCircle,
}

type Style = { Icon: Icon; color: string; bg: string; bg2: string }

const BLUE = { color: '#1A56DB', bg: '#EFF6FF', bg2: '#DBEAFE' }
const RED = { color: '#DC2626', bg: '#FEF2F2', bg2: '#FEE2E2' }

/** Cards fixos do guia que não são categorias de botão */
const SPECIAL: Record<string, Style> = {
  WIFI:       { Icon: WifiHigh,  ...BLUE },
  ENTREGADOR: { Icon: Package,   color: '#D97706', bg: '#FFFBEB', bg2: '#FEF3C7' },
  EMERGENCIA: { Icon: Siren,     ...RED },
  SUGESTOES:  { Icon: Lightbulb, ...BLUE },
  LOCALIZACAO: { Icon: NavigationArrow, color: '#7C3AED', bg: '#F5F3FF', bg2: '#EDE9FE' },
  SAMU:       { Icon: Ambulance,   ...RED },
  BOMBEIROS:  { Icon: FireTruck,   ...RED },
  POLICIA:    { Icon: ShieldCheck, color: '#1E40AF', bg: '#EFF6FF', bg2: '#DBEAFE' },
}

export function categoryStyle(kind: string): Style {
  if (SPECIAL[kind]) return SPECIAL[kind]
  const meta = getCategoryMeta(kind) ?? getCategoryMeta('OUTRO')!
  return { Icon: ICONS[meta.icon] ?? DotsThreeCircle, color: meta.color, bg: meta.bg, bg2: meta.bg2 }
}

/** Ícone em quadrado arredondado com gradiente suave (52px no guia) */
export function CategoryIcon({
  kind,
  size = 52,
  weight = 'duotone',
  className,
}: {
  kind: string
  size?: number
  weight?: IconWeight
  className?: string
}) {
  const { Icon, color, bg, bg2 } = categoryStyle(kind)
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl ${className ?? ''}`}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${bg}, ${bg2})` }}
    >
      <Icon size={Math.round(size * 0.65)} weight={weight} color={color} />
    </span>
  )
}

/** Só o ícone, sem o quadrado (botões pequenos, linhas de lista) */
export function CategoryGlyph({ kind, size = 18, weight = 'bold' }: { kind: string; size?: number; weight?: IconWeight }) {
  const { Icon, color } = categoryStyle(kind)
  return <Icon size={size} weight={weight} color={color} />
}
