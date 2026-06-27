import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ToastContextProvider } from '@/components/ui/toast'
import { BottomNav } from '@/components/shared/BottomNav'

export default async function HospedeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || !['HOSPEDE', 'ADMINISTRADOR'].includes(dbUser.role)) redirect(`/${locale}/login`)

  return (
    <ToastContextProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
          {children}
        </main>
        <BottomNav role="hospede" locale={locale} />
        <footer className="fixed bottom-16 left-0 right-0 text-center pb-1 pointer-events-none">
          <span className="text-[9px] text-muted-foreground/40">Powered by Somar Soluções Digitais</span>
        </footer>
      </div>
    </ToastContextProvider>
  )
}
