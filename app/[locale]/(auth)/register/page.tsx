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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { getRoleDashboard } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['PROPRIETARIO', 'GESTOR', 'ANFITRIAO', 'PRESTADOR']),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { locale } = useParams<{ locale: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    setError(null)
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name, role: data.role },
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
          email: data.email,
          role: data.role,
        }),
      })

      if (res.ok) {
        router.push(getRoleDashboard(data.role).replace('/pt-BR', `/${locale}`))
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3">
            <span className="text-accent font-black text-xl">SM</span>
          </div>
          <h1 className="text-2xl font-black text-primary">Staymet</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-1">Criar conta</h2>
          <p className="text-sm text-muted-foreground mb-6">Preencha os dados abaixo</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Seu nome" {...register('name')} />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="Mín. 6 caracteres" {...register('password')} />
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Perfil de acesso</Label>
              <Select onValueChange={(v) => setValue('role', v as FormData['role'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                  <SelectItem value="GESTOR">Gestor</SelectItem>
                  <SelectItem value="ANFITRIAO">Anfitrião</SelectItem>
                  <SelectItem value="PRESTADOR">Prestador</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-danger">{errors.role.message}</p>}
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Criar conta
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Já tem conta?{' '}
          <Link href={`/${locale}/login`} className="text-accent font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
