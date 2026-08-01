import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'dark' | 'light' | 'hero'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  subtitle?: string
  href?: string
}

const sizes = {
  xs: { w: 88,  sub: 'text-[9px]' },
  sm: { w: 112, sub: 'text-[10px]' },
  md: { w: 150, sub: 'text-xs' },
  lg: { w: 190, sub: 'text-sm' },
}

const variants = {
  dark:  { filter: 'brightness(0) invert(1)', sub: 'text-white/40' },
  light: { filter: 'none',                    sub: 'text-gray-400' },
  hero:  { filter: 'brightness(0) invert(1)', sub: 'text-white/60' },
}

export function Logo({
  variant = 'dark',
  size = 'sm',
  subtitle,
  href,
}: LogoProps) {
  const s = sizes[size]
  const v = variants[variant]

  const content = (
    <div className="flex flex-col items-start">
      <Image
        src="/logo.png"
        alt="Anfitrião Management"
        width={1200}
        height={400}
        priority
        style={{ width: s.w, height: 'auto', filter: v.filter }}
      />
      {subtitle && (
        <span
          className={`font-semibold uppercase tracking-widest leading-none mt-1 ${s.sub} ${v.sub}`}
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
