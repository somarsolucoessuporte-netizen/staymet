import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const roleRoutes: Record<string, string[]> = {
  ADMINISTRADOR: ['/admin'],
  PROPRIETARIO: ['/proprietario'],
  GESTOR: ['/gestor'],
  ANFITRIAO: ['/anfitriao'],
  HOSPEDE: ['/hospede'],
  PRESTADOR: ['/prestador'],
}

const roleDashboards: Record<string, string> = {
  ADMINISTRADOR: '/admin/dashboard',
  PROPRIETARIO: '/proprietario/dashboard',
  GESTOR: '/gestor/dashboard',
  ANFITRIAO: '/anfitriao/dashboard',
  HOSPEDE: '/hospede/boas-vindas',
  PRESTADOR: '/prestador/tarefas',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Update session (Supabase auth)
  const response = await updateSession(request)

  // Check if user is authenticated (check for auth cookie)
  const supabaseSession = request.cookies.get('sb-auth-token')
  if (!supabaseSession && !pathname.includes('/login') && !pathname.includes('/register')) {
    const loginUrl = new URL('/pt-BR/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Get user role from API route (fetch user data)
  if (supabaseSession && pathname.includes('/admin')) {
    try {
      const role = request.headers.get('x-user-role')
      if (role && role !== 'ADMINISTRADOR') {
        const locale = pathname.split('/')[1]
        const dashboardUrl = new URL(`/${locale}${roleDashboards[role] || '/'}`, request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    } catch (error) {
      console.error('Role check error:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
