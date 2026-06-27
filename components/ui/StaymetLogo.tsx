import Link from 'next/link'

interface StaymetLogoProps {
  /**
   * "dark"  → fundo escuro (sidebar, hero, telas dark) — texto branco
   * "light" → fundo claro (formulários, headers brancos) — texto cinza-escuro
   * "hero"  → sobre foto/imagem com overlay — ícone fosco, texto branco
   */
  variant?: 'dark' | 'light' | 'hero'
  /** Tamanho do ícone S e do texto */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Substitui "Staymet". Ex: "Admin" no painel administrativo */
  label?: string
  /** Linha secundária abaixo do label. Ex: "Gestão" */
  subtitle?: string
  /** Se false, mostra só o ícone S */
  showLabel?: boolean
  /** Envolve o componente em um Link */
  href?: string
  className?: string
}

const sizes = {
  xs: { icon: 'w-5 h-5 rounded-md',  letter: 'text-[9px]',  label: 'text-xs',  sub: 'text-[9px]', gap: 'gap-1.5' },
  sm: { icon: 'w-7 h-7 rounded-lg',  letter: 'text-xs',     label: 'text-base', sub: 'text-[10px]', gap: 'gap-2' },
  md: { icon: 'w-9 h-9 rounded-xl',  letter: 'text-base',   label: 'text-xl',   sub: 'text-[10px]', gap: 'gap-3' },
  lg: { icon: 'w-11 h-11 rounded-xl', letter: 'text-lg',    label: 'text-2xl',  sub: 'text-xs',    gap: 'gap-3' },
}

const variants = {
  dark: {
    icon: 'bg-[#1A56DB] shadow-lg shadow-[#1A56DB]/30',
    letter: 'text-white',
    label: 'text-white',
    sub: 'text-white/30',
  },
  light: {
    icon: 'bg-[#1A56DB] shadow-sm shadow-[#1A56DB]/20',
    letter: 'text-white',
    label: 'text-gray-900',
    sub: 'text-gray-400',
  },
  hero: {
    icon: 'bg-white/20 backdrop-blur-sm border border-white/20',
    letter: 'text-white',
    label: 'text-white/90',
    sub: 'text-white/50',
  },
}

export function StaymetLogo({
  variant = 'dark',
  size = 'md',
  label = 'Staymet',
  subtitle,
  showLabel = true,
  href,
  className = '',
}: StaymetLogoProps) {
  const s = sizes[size]
  const v = variants[variant]

  const inner = (
    <span className={`flex items-center ${s.gap} ${className}`}>
      {/* Ícone S */}
      <span className={`${s.icon} ${v.icon} flex items-center justify-center flex-shrink-0`}>
        <span
          className={`${v.letter} font-bold ${s.letter} tracking-tight`}
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          S
        </span>
      </span>

      {/* Texto */}
      {showLabel && (
        <span className="flex flex-col leading-none">
          <span
            className={`${v.label} font-bold ${s.label} tracking-tight leading-none`}
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            {label}
          </span>
          {subtitle && (
            <span
              className={`${v.sub} ${s.sub} font-medium tracking-widest uppercase mt-0.5`}
            >
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }

  return inner
}
