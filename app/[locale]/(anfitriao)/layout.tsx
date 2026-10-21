import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { getCurrentDbUser } from '@/lib/guia-access'
import { AppShell } from '@/components/shared/AppShell'
import { ToastContextProvider } from '@/components/ui/toast'

export default async function AnfitriaoLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getAuthUser()

  if (!user) redirect(`/${locale}/login`)

  const dbUser = await getCurrentDbUser()
  if (!dbUser || !['ANFITRIAO', 'GESTOR', 'ADMINISTRADOR'].includes(dbUser.role)) redirect(`/${locale}/login`)

  return (
    <ToastContextProvider>
      <AppShell role="anfitriao" locale={locale}>
        {children}
      </AppShell>
    </ToastContextProvider>
  )
}
