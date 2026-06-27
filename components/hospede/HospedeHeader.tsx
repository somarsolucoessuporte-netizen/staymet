import { StaymetLogo } from '@/components/ui/StaymetLogo'

interface HospedeHeaderProps {
  title: string
  subtitle?: string
  transparent?: boolean
}

export function HospedeHeader({ title, subtitle, transparent = false }: HospedeHeaderProps) {
  return (
    <div className={`px-5 pt-14 pb-5 ${transparent ? 'absolute top-0 left-0 right-0 z-10' : 'bg-white border-b border-gray-50'}`}>
      <div className="mb-2">
        <StaymetLogo variant={transparent ? 'hero' : 'light'} size="xs" />
      </div>
      <h1
        className={`text-xl font-bold ${transparent ? 'text-white' : 'text-gray-900'}`}
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className={`text-sm mt-0.5 ${transparent ? 'text-white/70' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
