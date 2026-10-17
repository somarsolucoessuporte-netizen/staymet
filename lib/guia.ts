// Constantes e helpers do Guia do Hóspede — compartilhados entre painel do anfitrião e telas do hóspede

export const PARTNER_CATEGORIES = [
  { value: 'MERCADO',     label: 'Mercado',     emoji: '🛒', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'DELIVERY',    label: 'Delivery',    emoji: '🍕', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'RESTAURANTE', label: 'Restaurante', emoji: '🍽️', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'PASSEIO',     label: 'Passeio',     emoji: '🏖️', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'OUTRO',       label: 'Outro',       emoji: '📦', badge: 'bg-slate-50 text-slate-700 border-slate-200' },
] as const

export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number]['value']

export const PARTNER_CATEGORY_VALUES = PARTNER_CATEGORIES.map((c) => c.value) as [PartnerCategory, ...PartnerCategory[]]

export function getCategoryMeta(category: string) {
  return PARTNER_CATEGORIES.find((c) => c.value === category)
}

/** Extrai só os dígitos de uma URL wa.me (para preencher o form de edição) */
export function whatsappDigitsFromUrl(url?: string | null) {
  if (!url) return ''
  return url.replace(/^https?:\/\/(api\.)?wa\.me\//i, '').replace(/\D/g, '')
}
