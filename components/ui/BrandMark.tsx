import Image from 'next/image'
import { cn } from '@/lib/utils'

// public/logo.png é 1200×400 com muita margem; o wordmark ocupa ~x 300–930, y 122–288.
// Recortamos essa área para o texto ter de fato a largura pedida.
const CROP = { x: 300, y: 122, w: 630, h: 166 }

/**
 * Logomarca oficial: ícone "Am" (public/icone.png) + wordmark "Anfitrião MANAGEMENT" (public/logo.png).
 * tone="white" deixa o wordmark branco para fundos escuros.
 */
export function BrandMark({
  width = 200,
  tone = 'color',
  showIcon = true,
  shine = false,
  className,
}: {
  width?: number
  tone?: 'color' | 'white'
  showIcon?: boolean
  /** Brilho que atravessa só o desenho das letras (máscara com o próprio logo) */
  shine?: boolean
  className?: string
}) {
  const scale = width / CROP.w
  const iconSize = Math.round(width * 0.36)
  const imgW = Math.round(1200 * scale)
  const left = -Math.round(CROP.x * scale)
  const top = -Math.round(CROP.y * scale)
  const mask = {
    WebkitMaskImage: 'url(/logo.png)',
    maskImage: 'url(/logo.png)',
    WebkitMaskSize: `${imgW}px auto`,
    maskSize: `${imgW}px auto`,
    WebkitMaskPosition: `${left}px ${top}px`,
    maskPosition: `${left}px ${top}px`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {showIcon && (
        <span className="relative block overflow-hidden rounded-[22%]" style={{ width: iconSize }}>
        <Image
          src="/icone.png"
          alt=""
          width={iconSize}
          height={iconSize}
          priority
          className="block rounded-[22%] shadow-[0_8px_24px_-6px_rgba(26,86,219,0.45)]"
          style={{ width: iconSize, height: 'auto' }}
        />
          {shine && <span aria-hidden className="brand-shine pointer-events-none absolute inset-0" />}
        </span>
      )}
      <div className="relative overflow-hidden" style={{ width, height: Math.round(CROP.h * scale) }}>
        <Image
          src="/logo.png"
          alt="Anfitrião Management"
          width={1200}
          height={400}
          priority
          className="absolute max-w-none"
          style={{
            width: imgW,
            height: 'auto',
            left,
            top,
            filter: tone === 'white' ? 'brightness(0) invert(1)' : undefined,
            opacity: shine && tone === 'white' ? 0.88 : undefined,
          }}
        />
        {shine && <span aria-hidden className="brand-shine pointer-events-none absolute inset-0" style={mask} />}
      </div>
      {shine && (
        <style>{`
          @keyframes brand-shine { from { background-position: 160% 0 } to { background-position: -60% 0 } }
          .brand-shine {
            background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.95) 50%, transparent 65%) no-repeat;
            background-size: 45% 100%;
            background-position: 160% 0;
            animation: brand-shine 1.1s ease-in-out .6s both;
          }
          @media (prefers-reduced-motion: reduce) { .brand-shine { animation: none; display: none } }
        `}</style>
      )}
    </div>
  )
}
