interface HospedeHeaderProps {
  title: string
  subtitle?: string
  transparent?: boolean
}

export function HospedeHeader({ title, subtitle, transparent = false }: HospedeHeaderProps) {
  return (
    <div className={`px-5 pt-14 pb-5 ${transparent ? 'absolute top-0 left-0 right-0 z-10' : 'bg-white border-b border-gray-50'}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-5 h-5 bg-[#1A56DB] rounded-md flex items-center justify-center`}>
          <span className="text-white font-bold text-[9px]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>S</span>
        </div>
        <span className={`text-xs font-semibold tracking-wide ${transparent ? 'text-white/70' : 'text-gray-400'}`}>
          STAYMET
        </span>
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
