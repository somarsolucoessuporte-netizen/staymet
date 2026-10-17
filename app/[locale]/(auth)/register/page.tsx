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
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthCard, AuthDivider, authInputClass, authButtonClass } from '@/components/auth/AuthCard'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
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

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
      },
    })

    if (authError) {
      setError(authError.message)
      return
    }

    if (authData.user) {
      // Create user in our DB
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseId: authData.user.id,
          name: data.name,
        }),
      })

      if (res.ok) {
        const created = await res.json()
        router.push(getRoleDashboard(created.role).replace('/pt-BR', `/${locale}`))
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    }
  }

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Preencha os dados abaixo"
      footer={
        <>
          Já tem conta?{' '}
          <Link href={`/${locale}/login`} className="text-[#1A56DB] font-semibold hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <GoogleSignInButton label="Cadastrar com Google" />

      <AuthDivider label="ou cadastre-se com e-mail" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome completo</Label>
          <Input id="name" placeholder="Seu nome" autoComplete="name" className={authInputClass} {...register('name')} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</Label>
          <Input id="email" type="email" placeholder="seu@email.com" autoComplete="email" className={authInputClass} {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</Label>
          <Input id="password" type="password" placeholder="Mín. 6 caracteres" autoComplete="new-password" className={authInputClass} {...register('password')} />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button type="submit" className={authButtonClass} loading={isSubmitting}>
          Criar conta
        </Button>
      </form>
    </AuthCard>
  )
}
