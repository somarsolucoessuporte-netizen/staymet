import { createClient } from '@supabase/supabase-js'

/** Client com service role — usar SOMENTE no servidor (route handlers / server actions) */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/** Garante que um bucket público exista no Storage (cria na primeira vez) */
export async function ensurePublicBucket(
  name: string,
  options: { fileSizeLimit?: number; allowedMimeTypes?: string[] } = {},
) {
  const admin = createAdminClient()
  const { data } = await admin.storage.getBucket(name)
  if (data) return admin

  const { error } = await admin.storage.createBucket(name, { public: true, ...options })
  // Corrida entre duas requisições criando ao mesmo tempo: tudo bem se já existir
  if (error && !/already exists/i.test(error.message)) throw new Error(`Storage: ${error.message}`)
  return admin
}
