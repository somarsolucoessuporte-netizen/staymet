import Link from 'next/link'

interface StaymetLogoProps {
  variant?: 'dark' | 'light' | 'hero'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  subtitle?: string
  href?: string
}

const sizes = {
  xs: { text: 'text-base', sub: 'text-[9px]' },
  sm: { text: 'text-lg',   sub: 'text-[10px]' },
  md: { text: 'text-2xl',  sub: 'text-xs' },
  lg: { text: 'text-3xl',  sub: 'text-sm' },
}

const variants = {
  dark:  { name: 'text-white',      sub: 'text-white/40' },
  light: { name: 'text-[#1A56DB]',  sub: 'text-gray-400' },
  hero:  { name: 'text-white',      sub: 'text-white/60' },
}

export function StaymetLogo({
  variant = 'dark',
  size = 'sm',
  subtitle,
  href,
}: StaymetLogoProps) {
  const s = sizes[size]
  const v = variants[variant]

  const content = (
    <div className="flex flex-col">
      <span
        className={`font-bold tracking-tight leading-none ${s.text} ${v.name}`}
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        Staymet
      </span>
      {subtitle && (
        <span
          className={`font-semibold uppercase tracking-widest leading-none mt-0.5 ${s.sub} ${v.sub}`}
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {subtitle}
        </span>
      )}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}
