'use client'

import { usePathname, useRouter } from 'next/navigation'
import { CaretLeft } from '@phosphor-icons/react/ssr'
import { navByRole } from './BottomNav'

/**
 * "Voltar" no topo das telas internas (no app instalado não há botão de voltar do navegador).
 * Some nas telas principais da barra inferior e nas que já têm o próprio link de voltar.
 */
export function BackButton({ locale, role, skip = [] }: { locale: string; role: string; skip?: string[] }) {
  const roots = (navByRole[role.toLowerCase()] ?? []).map((i) => i.href)
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const path = pathname.replace(new RegExp(`^/${locale}`), '')

  if (roots.some((r) => path === r) || skip.some((s) => path.startsWith(s))) return null

  const parent = `/${locale}${roots[0] ?? ''}`
  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push(parent)
  }

  return (
    <div className="px-4 pt-3">
      <button
        type="button"
        onClick={goBack}
        className="-ml-2 inline-flex h-9 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-[#475569] transition active:scale-[0.97] active:bg-gray-100"
      >
        <CaretLeft size={18} weight="bold" /> Voltar
      </button>
    </div>
  )
}
