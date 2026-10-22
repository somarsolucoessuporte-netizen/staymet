'use client'

import { Printer } from '@phosphor-icons/react/ssr'

export function PrintButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer size={18} weight="duotone" /> Imprimir
    </button>
  )
}
