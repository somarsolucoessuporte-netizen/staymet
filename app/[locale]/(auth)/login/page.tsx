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
import { StaymetLogo } from '@/components/ui/StaymetLogo'

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
          <StaymetLogo variant="dark" size="lg" />
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
        <p className="relative text-white/20 text-xs">
          © 2025 Staymet · Powered by Somar Soluções Digitais
        </p>
      </div>

      {/* ── PAINEL DIREITO (formulário) ── */}
      <div className="flex flex-col items-center justify-center bg-[#F8FAFC] px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <StaymetLogo variant="light" size="md" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Bem-vindo de volta
            </h2>
            <p className="text-gray-500 text-sm mt-1">Entre na sua conta para continuar</p>
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
                  href={`/${locale}/auth/reset-password`}
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
        </div>
      </div>
    </div>
  )
}
