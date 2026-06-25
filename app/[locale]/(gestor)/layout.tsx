import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/shared/AppShell'
import { ToastContextProvider } from '@/components/ui/toast'

export default async function GestorLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) console.error('[gestor/layout] supabase auth error:', authError)
  if (!user) redirect(`/${locale}/login`)

  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  } catch (e) {
    console.error('[gestor/layout] prisma error:', e)
    throw e
  }
  if (!dbUser || dbUser.role !== 'GESTOR') redirect(`/${locale}/login`)

  return (
    <ToastContextProvider>
      <AppShell role="gestor" locale={locale}>
        {children}
      </AppShell>
    </ToastContextProvider>
  )
}
