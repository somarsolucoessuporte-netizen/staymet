'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, authInputClass, authButtonClass } from '@/components/auth/AuthCard'

const schema = z
  .object({
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'As senhas não coincidem', path: ['confirm'] })

type FormData = z.infer<typeof schema>

type SessionState = 'checking' | 'ready' | 'invalid'

export default function ResetPasswordPage() {
  const { locale } = useParams<{ locale: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionState>('checking')
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // O fluxo normal passa por /auth/callback, que já cria a sessão de recovery.
  // Também aceita o link chegando direto aqui (?code= ou ?token_hash=&type=recovery).
  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const tokenHash = params.get('token_hash')

    async function establish() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) return false
      } else if (tokenHash && params.get('type') === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        if (error) return false
      }
      const { data } = await supabase.auth.getUser()
      return !!data.user
    }

    establish().then((ok) => {
      setSession(ok ? 'ready' : 'invalid')
      // Remove tokens da URL depois de usados
      if (code || tokenHash) window.history.replaceState(null, '', window.location.pathname)
    })
  }, [])

  const onSubmit = async (data: FormData) => {
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
    if (updateError) {
      setError(
        updateError.code === 'same_password'
          ? 'A nova senha precisa ser diferente da atual.'
          : 'Não foi possível salvar a nova senha. Tente novamente.',
      )
      return
    }
    await supabase.auth.signOut()
    router.replace(`/${locale}/login?reset=ok`)
  }

  const backToLogin = (
    <Link href={`/${locale}/login`} className="text-accent font-medium hover:underline">
      Voltar para o login
    </Link>
  )

  if (session === 'checking') {
    return (
      <AuthCard title="Redefinir senha" footer={backToLogin}>
        <p className="text-sm text-muted-foreground">Validando link...</p>
      </AuthCard>
    )
  }

  if (session === 'invalid') {
    return (
      <AuthCard title="Link inválido ou expirado" footer={backToLogin}>
        <p className="text-sm text-muted-foreground mb-4">
          Este link de recuperação não é mais válido. Solicite um novo para redefinir sua senha.
        </p>
        <Link
          href={`/${locale}/auth/forgot-password`}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1A56DB] text-sm font-semibold text-white hover:bg-[#1648C0] transition-colors"
        >
          Solicitar novo link
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Redefinir senha" subtitle="Escolha uma nova senha para sua conta" footer={backToLogin}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700" htmlFor="password">Nova senha</Label>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" className={authInputClass} {...register('password')} />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700" htmlFor="confirm">Confirmar nova senha</Label>
          <Input id="confirm" type="password" placeholder="••••••••" autoComplete="new-password" className={authInputClass} {...register('confirm')} />
          {errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button type="submit" className={authButtonClass} loading={isSubmitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthCard>
  )
}
