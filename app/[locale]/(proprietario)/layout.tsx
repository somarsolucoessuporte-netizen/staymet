import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/shared/AppShell'
import { ToastContextProvider } from '@/components/ui/toast'

export default async function ProprietarioLayout({
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
  if (!dbUser || dbUser.role !== 'PROPRIETARIO') redirect(`/${locale}/login`)

  return (
    <ToastContextProvider>
      <AppShell role="proprietario" locale={locale}>
        {children}
      </AppShell>
    </ToastContextProvider>
  )
}
