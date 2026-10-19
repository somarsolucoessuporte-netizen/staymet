import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Seletor de imóvel (só aparece com mais de um) */
export function PropertyChips({ properties, selectedId, hrefFor }: { properties: { id: string; name: string }[]; selectedId: string; hrefFor: (id: string) => string }) {
  if (properties.length < 2) return null
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {properties.map((p) => (
        <Link
          key={p.id}
          href={hrefFor(p.id)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
            p.id === selectedId ? 'bg-[#1A56DB] text-white' : 'bg-white text-[#0F172A] ring-1 ring-black/10',
          )}
        >
          {p.name}
        </Link>
      ))}
    </div>
  )
}
