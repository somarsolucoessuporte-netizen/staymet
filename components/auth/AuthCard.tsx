import { Logo } from '@/components/ui/Logo'

/** Card centralizado usado pelas telas de auth secundárias (esqueci a senha, redefinir senha) */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo variant="light" size="md" />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-1">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
          {children}
        </div>

        {footer && <div className="text-center text-sm text-muted-foreground mt-4">{footer}</div>}

        <p className="text-center text-[11px] text-gray-400 mt-8">
          © 2025 Anfitrião Management · Powered by Somar Soluções Digitais
        </p>
      </div>
    </div>
  )
}
