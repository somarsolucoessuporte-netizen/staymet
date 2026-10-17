import { AuthBrand } from '@/components/auth/AuthBrand'
import { SomarFooter } from '@/components/shared/SomarFooter'

/** Moldura padrão das telas de auth (login, cadastro, esqueci/redefinir senha) */
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
    <div className="font-display min-h-screen flex flex-col bg-gradient-to-b from-[#F8FAFC] to-[#EEF2FF] px-4">
      <main className="flex flex-1 flex-col items-center justify-center py-10">
        <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 shadow-[0_12px_40px_-12px_rgba(26,86,219,0.25)] ring-1 ring-[#1A56DB]/[0.06] sm:px-8">
          <AuthBrand />

          <div className="mb-6 text-center">
            <h1 className="text-xl font-extrabold text-[#0F172A]">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>}
          </div>

          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-[#64748B]">{footer}</div>}
      </main>

      <SomarFooter />
    </div>
  )
}

/** Divisor "ou ..." entre o botão do Google e o formulário */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs text-gray-400">
        <span className="bg-white px-3">{label}</span>
      </div>
    </div>
  )
}

/** Classes padrão dos campos das telas de auth (48px de altura) */
export const authInputClass = 'h-12 rounded-xl bg-white border-gray-200 focus:border-[#1A56DB] focus:ring-[#1A56DB]/20'
export const authButtonClass = 'w-full h-12 rounded-xl bg-[#1A56DB] hover:bg-[#1648C0] text-white font-semibold shadow-sm'
