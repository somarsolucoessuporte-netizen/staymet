'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { getRoleDashboard } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthBrand, AuthFooter } from '@/components/auth/AuthBrand'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

// Erros devolvidos por /auth/callback
const callbackErrors: Record<string, string> = {
  oauth: 'Não foi possível entrar com o Google. Tente novamente.',
  oauth_email: 'Sua conta Google não informou um e-mail.',
  oauth_conflict: 'Este e-mail já tem conta. Entre com e-mail e senha.',
  link_invalido: 'Link inválido ou expirado. Solicite um novo.',
  callback: 'Não foi possível concluir o login. Tente novamente.',
}

/** Avisos vindos pela URL (?error=... ou ?reset=ok) */
function LoginNotice() {
  const searchParams = useSearchParams()
  const errorMsg = callbackErrors[searchParams.get('error') ?? '']

  if (searchParams.get('reset') === 'ok') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5">
        <p className="text-sm text-emerald-700">Senha redefinida com sucesso. Entre com a nova senha.</p>
      </div>
    )
  }
  if (!errorMsg) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5">
      <p className="text-sm text-red-600">{errorMsg}</p>
    </div>
  )
}

export default function LoginPage() {
  const { locale } = useParams<{ locale: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError('E-mail ou senha incorretos.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const res = await fetch('/api/auth/me')
    if (res.ok) {
      const me = await res.json()
      if (me?.role) {
        router.push(getRoleDashboard(me.role).replace('/pt-BR', `/${locale}`))
        return
      }
    }
    router.push(`/${locale}/gestor/dashboard`)
  }

  return (
    <div className="min-h-screen flex lg:grid lg:grid-cols-2">

      {/* ── PAINEL ESQUERDO (hero) — apenas desktop ── */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0F172A] p-10 relative overflow-hidden">
        {/* Padrão de fundo */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo */}
        <div className="relative">
          <Logo variant="dark" size="lg" />
        </div>

        {/* Copy central */}
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#1A56DB]/20 border border-[#1A56DB]/30 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A56DB] animate-pulse" />
            <span className="text-[#60A5FA] text-xs font-medium">Plataforma de gestão</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Gestão completa.<br />
            <span className="text-[#60A5FA]">Estadia perfeita.</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Gerencie imóveis, reservas, equipes e ocorrências em um só lugar.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: '98%', label: 'Satisfação' },
              { value: '2x', label: 'Mais produtivo' },
              { value: '24/7', label: 'Disponível' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <AuthFooter dark className="relative !text-left" />
      </div>

      {/* ── PAINEL DIREITO (formulário) ── */}
      <div className="flex flex-col items-center justify-center bg-[#F8FAFC] px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <AuthBrand className="lg:hidden" />

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Bem-vindo de volta
            </h2>
            <p className="text-gray-500 text-sm mt-1">Entre na sua conta para continuar</p>
          </div>

          <Suspense fallback={null}>
            <LoginNotice />
          </Suspense>

          <GoogleSignInButton label="Entrar com Google" />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-[#F8FAFC] px-2">ou entre com e-mail</span>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                className="h-11 bg-white border-gray-200 focus:border-[#1A56DB] focus:ring-[#1A56DB]/20"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-xs text-[#1A56DB] hover:underline"
                >
                  Esqueci a senha
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 bg-white border-gray-200 focus:border-[#1A56DB] focus:ring-[#1A56DB]/20"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#1A56DB] hover:bg-[#1648C0] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
              loading={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Não tem conta?{' '}
            <Link href={`/${locale}/register`} className="text-[#1A56DB] font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>

          <AuthFooter className="mt-10 lg:hidden" />
        </div>
      </div>
    </div>
  )
}
