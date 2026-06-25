'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="flex flex-col items-center mb-8">
          <span
            className="text-primary font-display font-bold tracking-tight leading-none"
            style={{ fontSize: '34px' }}
          >
            Staymet
          </span>
          <p className="text-sm text-muted-foreground mt-2">Gestão gourmet do seu imóvel.</p>
        </div>

        <div
          className="bg-card rounded-2xl border border-border p-6"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
          <h2 className="text-lg font-bold mb-1">Bem-vindo de volta</h2>
          <p className="text-sm text-muted-foreground mb-6">Faça login para continuar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Não tem conta?{' '}
          <Link href={`/${locale}/register`} className="text-primary font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-8">
          Powered by Somar Soluções Digitais
        </p>
      </div>
    </div>
  )
}
