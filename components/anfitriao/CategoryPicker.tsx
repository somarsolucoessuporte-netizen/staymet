'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CaretDown } from '@phosphor-icons/react/ssr'
import { GuiaSheet } from '@/components/guia/GuiaSheet'
import { CategoryIcon } from '@/components/guia/CategoryIcon'
import { PARTNER_CATEGORIES, PARTNER_GROUPS, getCategoryMeta, type PartnerCategory } from '@/lib/guia'
import { cn } from '@/lib/utils'

/** Botão com o ícone da categoria que abre um bottom sheet com a grade de tipos, agrupada */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (v: PartnerCategory) => void }) {
  const [open, setOpen] = useState(false)
  const label = getCategoryMeta(value)?.label ?? 'Tipo'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Tipo do botão: ${label}. Trocar`}
        className="relative flex h-11 w-[52px] shrink-0 items-center justify-center rounded-xl active:scale-95"
      >
        <CategoryIcon kind={value} size={44} />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow ring-1 ring-black/5">
          <CaretDown size={10} weight="bold" color="#475569" />
        </span>
      </button>

      {open &&
        createPortal(
          <GuiaSheet open onClose={() => setOpen(false)} title="Tipo do botão">
            <div className="space-y-5">
              {PARTNER_GROUPS.map((g) => (
                <section key={g.value}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">{g.label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PARTNER_CATEGORIES.filter((c) => c.group === g.value).map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={c.value === value}
                        onClick={() => {
                          onChange(c.value)
                          setOpen(false)
                        }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-white px-1 py-2.5 transition active:scale-95',
                          c.value === value ? 'border-[#1A56DB] bg-[#F5F8FF]' : 'border-transparent ring-1 ring-[#E2E8F0]',
                        )}
                      >
                        <CategoryIcon kind={c.value} size={44} />
                        <span className="w-full truncate text-center text-[12px] font-semibold text-[#0F172A]">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </GuiaSheet>,
          document.body,
        )}
    </>
  )
}
