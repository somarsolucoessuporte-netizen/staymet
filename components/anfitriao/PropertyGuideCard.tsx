import Link from 'next/link'
import { Eye, Link2, SlidersHorizontal, MapPin, AlertCircle } from 'lucide-react'
import { GuiaCopyButton } from '@/components/guia/GuiaCopyButton'

export type PropertyGuideInfo = {
  id: string
  name: string
  city: string
  state: string
  coverImageUrl: string | null
  hasWifi: boolean
  activeButtons: number
}

/** O que falta para o guia ficar completo (Wi-Fi, foto de capa, pelo menos 1 botão ativo) */
export function missingGuideItems(p: PropertyGuideInfo) {
  return [
    !p.hasWifi && 'Wi-Fi',
    !p.coverImageUrl && 'foto de capa',
    p.activeButtons === 0 && 'botões',
  ].filter(Boolean) as string[]
}

/** Card do imóvel com atalhos do guia (dashboard e lista de imóveis do anfitrião) */
export function PropertyGuideCard({ property: p, locale, origin }: { property: PropertyGuideInfo; locale: string; origin: string }) {
  const missing = missingGuideItems(p)
  const btn = 'flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition active:scale-[0.98]'

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_-10px_rgba(26,86,219,0.3)] ring-1 ring-[#1A56DB]/[0.06]">
      <div className="relative h-28 bg-gradient-to-br from-[#1A56DB] to-[#0F172A]">
        {p.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="truncate text-base font-bold">{p.name}</p>
          <p className="flex items-center gap-1 text-xs text-white/75">
            <MapPin size={11} /> {p.city}{p.state ? `, ${p.state}` : ''}
          </p>
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-bold text-[#0F172A]">
          {p.activeButtons} {p.activeButtons === 1 ? 'botão' : 'botões'}
        </span>
      </div>

      <div className="space-y-2 p-4">
        {missing.length > 0 && (
          <p className="flex items-start gap-1.5 rounded-xl bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
            <AlertCircle size={14} className="mt-px shrink-0" />
            <span>
              <strong>Guia incompleto</strong> · falta {missing.join(', ')}
            </span>
          </p>
        )}
        <a
          href={`/guia/${p.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} h-11 w-full bg-[#1A56DB] text-sm text-white hover:bg-[#1648C0]`}
        >
          <Eye size={16} /> Ver como hóspede
        </a>
        <div className="grid grid-cols-2 gap-2">
          <GuiaCopyButton text={`${origin}/guia/${p.id}`} toast="✅ Link do guia copiado!" className={`${btn} bg-[#F1F5FF] text-[#1A56DB]`}>
            <Link2 size={14} /> Copiar link
          </GuiaCopyButton>
          <Link href={`/${locale}/anfitriao/guia?propertyId=${p.id}`} className={`${btn} bg-[#F1F5FF] text-[#1A56DB]`}>
            <SlidersHorizontal size={14} /> Configurar botões
          </Link>
        </div>
      </div>
    </div>
  )
}
