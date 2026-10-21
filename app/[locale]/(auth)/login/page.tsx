'use client'

import { Suspense, useEffect, useState } from 'react'
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
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthCard, AuthDivider, authInputClass, authButtonClass } from '@/components/auth/AuthCard'

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

  // Já tem sessão (ex.: voltou do Google com aviso de erro, mas o login concluiu): vai direto pro painel
  useEffect(() => {
    let alive = true
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!alive || !user) return
      const res = await fetch('/api/auth/me')
      if (!alive || !res.ok) return
      const me = await res.json()
      if (me?.role) router.replace(getRoleDashboard(me.role).replace('/pt-BR', `/${locale}`))
    })
    return () => { alive = false }
  }, [locale, router])

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
    <AuthCard
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
      footer={
        <>
          Não tem conta?{' '}
          <Link href={`/${locale}/register`} className="text-[#1A56DB] font-semibold hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginNotice />
      </Suspense>

      <GoogleSignInButton label="Entrar com Google" />

      <AuthDivider label="ou entre com e-mail" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className={authInputClass}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</Label>
            <Link href={`/${locale}/auth/forgot-password`} className="text-xs font-medium text-[#1A56DB] hover:underline">
              Esqueci a senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className={authInputClass}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button type="submit" className={authButtonClass} loading={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthCard>
  )
}
