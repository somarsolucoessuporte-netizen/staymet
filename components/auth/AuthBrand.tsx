import { cn } from '@/lib/utils'

/** Cabeçalho das telas de auth: ícone SM + "Anfitrião Management" */
export function AuthBrand({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center mb-8', className)}>
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3">
        <span className="text-accent font-black text-xl">SM</span>
      </div>
      <h1 className="text-2xl font-black text-primary">Anfitrião Management</h1>
    </div>
  )
}

/** Rodapé legal das telas de auth */
export function AuthFooter({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={cn('text-center text-[11px] leading-relaxed', dark ? 'text-white/30' : 'text-gray-400', className)}>
      <p>© 2019–2026 Somar.IA — Todos os direitos reservados.</p>
      <p>SOMMAR SOLUÇÕES DIGITAIS — CNPJ: 65.771.133/0001-07 — Brasil</p>
    </div>
  )
}
