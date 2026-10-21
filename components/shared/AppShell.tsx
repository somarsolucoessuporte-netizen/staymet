import { BottomNav } from './BottomNav'
import { BackButton } from './BackButton'
import { SomarFooter } from './SomarFooter'

interface AppShellProps {
  children: React.ReactNode
  role: string
  locale: string
}

export function AppShell({ children, role, locale }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
        <BackButton
          locale={locale}
          role={role}
          skip={['/anfitriao/agenda/canais', '/anfitriao/ocorrencias/', '/gestor/ocorrencias/']}
        />
        {children}
        {/* Anfitrião: rodapé padrão da Somar no fim do conteúdo */}
        {role === 'anfitriao' && <SomarFooter className="mt-6" />}
      </main>
      <BottomNav role={role} locale={locale} />
      {role !== 'anfitriao' && (
        <footer className="fixed bottom-16 left-0 right-0 text-center pb-1 safe-area-bottom pointer-events-none">
          <span className="text-[9px] text-muted-foreground/50">Powered by Somar Soluções Digitais</span>
        </footer>
      )}
    </div>
  )
}
