import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { routing } from '@/i18n/routing'
import { getRoleDashboard } from '@/lib/utils'

/** Só aceita caminhos internos (evita open redirect via ?next=//site-externo) */
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))
  const localeParam = searchParams.get('locale')
  const locale = routing.locales.includes(localeParam as (typeof routing.locales)[number])
    ? localeParam!
    : routing.defaultLocale

  const loginError = (reason: string) => NextResponse.redirect(`${origin}/${locale}/login?error=${reason}`)

  // Com ?next= é um link de e-mail (ex: recuperação de senha); sem, é login OAuth
  const failReason = next ? 'link_invalido' : 'oauth'
  if (!code) return loginError(failReason)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return loginError(failReason)

  const authUser = data.user
  let dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })

  // Só cria o User automaticamente em login social; e-mail/senha é criado pelo /register
  const isOAuth = authUser.app_metadata?.provider !== 'email'
  if (!dbUser && !isOAuth) {
    return NextResponse.redirect(`${origin}${next ?? `/${locale}/login`}`)
  }

  if (!dbUser) {
    const email = authUser.email
    if (!email) {
      await supabase.auth.signOut()
      return loginError('oauth_email')
    }

    // E-mail já cadastrado com outra conta do Supabase: não sobrescreve o vínculo
    const sameEmail = await prisma.user.findUnique({ where: { email } })
    if (sameEmail) {
      await supabase.auth.signOut()
      return loginError('oauth_conflict')
    }

    const meta = authUser.user_metadata ?? {}
    dbUser = await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email,
        name: meta.full_name ?? meta.name ?? email.split('@')[0],
        avatarUrl: meta.avatar_url ?? meta.picture ?? null,
        role: 'HOSPEDE',
      },
    })
  }

  const destination = next ?? getRoleDashboard(dbUser.role).replace('/pt-BR', `/${locale}`)
  return NextResponse.redirect(`${origin}${destination}`)
}
