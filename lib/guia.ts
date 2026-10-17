// Constantes e helpers do Guia do Hóspede — compartilhados entre painel do anfitrião e telas do hóspede

// section: em qual bloco o botão aparece na página pública do guia
//   contatos → "Contatos úteis" (lista)   |   dicas → "Dicas & Roteiros" (cards)
export const PARTNER_CATEGORIES = [
  { value: 'ANFITRIAO',   label: 'Anfitrião',          emoji: '👋', section: 'contatos', iconBg: '#FFF0F0', badge: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'MERCADO',     label: 'Mercado',            emoji: '🛒', section: 'contatos', iconBg: '#E7F9F0', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'RESTAURANTE', label: 'Restaurante/Almoço', emoji: '🍽️', section: 'contatos', iconBg: '#FFF4E6', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'DELIVERY',    label: 'Delivery',           emoji: '🍕', section: 'contatos', iconBg: '#FFF0F0', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'PASSEIO',     label: 'Passeio/Dica',       emoji: '🏖️', section: 'dicas',    iconBg: '#F5E6C8', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'TRANSPORTE',  label: 'Transporte',         emoji: '🚌', section: 'dicas',    iconBg: '#E8F1FD', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'OUTRO',       label: 'Outro',              emoji: '📌', section: 'contatos', iconBg: '#F3F0FD', badge: 'bg-slate-50 text-slate-700 border-slate-200' },
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
