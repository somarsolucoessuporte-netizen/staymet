import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

function isPublicPath(pathname: string): boolean {
  return (
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/auth/') ||
    pathname.includes('/hospede/')
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Páginas de link mágico: bypass total (sem locale, sem auth)
  if (pathname.startsWith('/acesso/')) {
    return NextResponse.next()
  }

  const intlResponse = intlMiddleware(request)

  if (isPublicPath(pathname)) {
    return intlResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isPublicPath(pathname)) {
    const locale = pathname.startsWith('/en') ? 'en' : 'pt-BR'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // Admin com ?viewAs pode acessar qualquer persona sem redirect
  if (user) {
    const viewAs = request.nextUrl.searchParams.get('viewAs')
    if (viewAs) {
      const response = NextResponse.next()
      response.headers.set('x-staymet-admin-bypass', '1')
      return response
    }
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
