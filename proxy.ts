import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

function isPublicPath(pathname: string): boolean {
  return (
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/auth/')
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Páginas de link mágico e guia de instalação: bypass total (sem locale, sem auth)
  // Callback do OAuth/Supabase: sem prefixo de locale e sem checagem de sessão (é ele que cria a sessão)
  // Guia público do hóspede (/guia/<id> e o link amigável /g/<slug>): link compartilhado, sem login
  if (pathname.startsWith('/acesso/') || pathname.startsWith('/guia/') || pathname.startsWith('/g/') || pathname.startsWith('/instalar') || pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    return intlMiddleware(request)
  }

  // Cookies renovados pelo Supabase vão para a requisição E para a resposta
  // (sem isso a sessão renovada se perde e o login "cai" e volta)
  const pending: { name: string; value: string; options?: Parameters<NextResponse['cookies']['set']>[2] }[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            pending.push({ name, value, options })
          })
        },
      },
    }
  )
  const withCookies = (res: NextResponse) => {
    pending.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  }

  // getClaims valida o token localmente quando possível (mais rápido que getUser em toda navegação)
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  if (!user) {
    const locale = pathname.startsWith('/en') ? 'en' : 'pt-BR'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    url.search = ''
    return withCookies(NextResponse.redirect(url))
  }

  // Admin com ?viewAs pode acessar qualquer persona sem redirect
  if (request.nextUrl.searchParams.get('viewAs')) {
    const response = NextResponse.next()
    response.headers.set('x-anfitriao-management-admin-bypass', '1')
    return withCookies(response)
  }

  // next-intl roda depois da sessão, então já repassa os cookies renovados para a página
  return withCookies(intlMiddleware(request))
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
