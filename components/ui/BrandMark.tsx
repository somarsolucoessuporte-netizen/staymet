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
  className,
}: {
  width?: number
  tone?: 'color' | 'white'
  showIcon?: boolean
  className?: string
}) {
  const scale = width / CROP.w
  const iconSize = Math.round(width * 0.36)

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {showIcon && (
        <Image
          src="/icone.png"
          alt=""
          width={iconSize}
          height={iconSize}
          priority
          className="rounded-[22%] shadow-[0_8px_24px_-6px_rgba(26,86,219,0.45)]"
          style={{ width: iconSize, height: 'auto' }}
        />
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
            width: Math.round(1200 * scale),
            height: 'auto',
            left: -Math.round(CROP.x * scale),
            top: -Math.round(CROP.y * scale),
            filter: tone === 'white' ? 'brightness(0) invert(1)' : undefined,
          }}
        />
      </div>
    </div>
  )
}
