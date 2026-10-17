'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/auth/AuthCard'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { locale } = useParams<{ locale: string }>()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const callback = new URL('/auth/callback', window.location.origin)
    callback.searchParams.set('locale', locale)
    callback.searchParams.set('next', `/${locale}/auth/reset-password`)

    const { error: resetError } = await createClient().auth.resetPasswordForEmail(data.email, {
      redirectTo: callback.toString(),
    })

    if (resetError) {
      setError('Não foi possível enviar o e-mail. Tente novamente em instantes.')
      return
    }
    setSentTo(data.email)
  }

  const backToLogin = (
    <Link href={`/${locale}/login`} className="text-accent font-medium hover:underline">
      Voltar para o login
    </Link>
  )

  if (sentTo) {
    return (
      <AuthCard title="Confira seu e-mail" footer={backToLogin}>
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <MailCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Se existir uma conta com <span className="font-medium text-foreground">{sentTo}</span>, você receberá
            um link para criar uma nova senha. Verifique também a caixa de spam.
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Esqueci a senha"
      subtitle="Informe seu e-mail e enviaremos um link de recuperação"
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="seu@email.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Enviar link de recuperação
        </Button>
      </form>
    </AuthCard>
  )
}
