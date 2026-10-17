import { headers } from 'next/headers'

/** Origem pública da requisição atual (ex.: https://staymet.somar.ia.br), para montar links completos */
export async function getRequestOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? '')
}
