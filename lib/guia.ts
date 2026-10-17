// Constantes e helpers do Guia do Hóspede — compartilhados entre painel do anfitrião e telas do hóspede

// Grupos do seletor de tipo no painel (e ordem dos botões no guia)
export const PARTNER_GROUPS = [
  { value: 'COMER',    label: 'Comer e comprar' },
  { value: 'SERVICOS', label: 'Serviços da casa' },
  { value: 'PASSEIOS', label: 'Passeios e transporte' },
  { value: 'SAUDE',    label: 'Saúde e outros' },
] as const

// Paleta (ícone + fundo em gradiente suave)
const C = {
  verde:    { color: '#059669', bg: '#ECFDF5', bg2: '#D1FAE5' },
  ambar:    { color: '#D97706', bg: '#FFFBEB', bg2: '#FEF3C7' },
  laranja:  { color: '#EA580C', bg: '#FFF7ED', bg2: '#FFEDD5' },
  laranjaV: { color: '#DC4A26', bg: '#FFF1EC', bg2: '#FFE0D4' },
  azul:     { color: '#1A56DB', bg: '#EFF6FF', bg2: '#DBEAFE' },
  ciano:    { color: '#0891B2', bg: '#ECFEFF', bg2: '#CFFAFE' },
  rosa:     { color: '#DB2777', bg: '#FDF2F8', bg2: '#FCE7F3' },
  indigo:   { color: '#4F46E5', bg: '#EEF2FF', bg2: '#E0E7FF' },
  ceu:      { color: '#0284C7', bg: '#F0F9FF', bg2: '#E0F2FE' },
  violeta:  { color: '#7C3AED', bg: '#F5F3FF', bg2: '#EDE9FE' },
  amarelo:  { color: '#CA8A04', bg: '#FEFCE8', bg2: '#FEF9C3' },
  vermelho: { color: '#DC2626', bg: '#FEF2F2', bg2: '#FEE2E2' },
  cinza:    { color: '#64748B', bg: '#F8FAFC', bg2: '#E2E8F0' },
} as const

// icon: nome do ícone Phosphor (components/guia/CategoryIcon.tsx)
// section: contatos → grade principal do guia | dicas → "Dicas & Roteiros"
// Valores antigos (ANFITRIAO, MERCADO, RESTAURANTE, DELIVERY, PASSEIO, TRANSPORTE, OUTRO) mantidos.
export const PARTNER_CATEGORIES = [
  { value: 'MERCADO',     label: 'Mercado',            group: 'COMER',    section: 'contatos', icon: 'ShoppingCart',    ...C.verde },
  { value: 'PADARIA',     label: 'Padaria',            group: 'COMER',    section: 'contatos', icon: 'Bread',           ...C.ambar },
  { value: 'RESTAURANTE', label: 'Restaurante',        group: 'COMER',    section: 'contatos', icon: 'ForkKnife',       ...C.laranja },
  { value: 'PIZZARIA',    label: 'Pizzaria',           group: 'COMER',    section: 'contatos', icon: 'Pizza',           ...C.laranjaV },
  { value: 'LANCHES',     label: 'Lanches',            group: 'COMER',    section: 'contatos', icon: 'Hamburger',       ...C.ambar },
  { value: 'DELIVERY',    label: 'Delivery',           group: 'COMER',    section: 'contatos', icon: 'Moped',           ...C.laranja },
  { value: 'ANFITRIAO',   label: 'Anfitrião',          group: 'SERVICOS', section: 'contatos', icon: 'HandWaving',      ...C.azul },
  { value: 'CASEIRO',     label: 'Caseiro',            group: 'SERVICOS', section: 'contatos', icon: 'Key',             ...C.azul },
  { value: 'GAS_AGUA',    label: 'Gás e água',         group: 'SERVICOS', section: 'contatos', icon: 'Flame',           ...C.ciano },
  { value: 'LIMPEZA',     label: 'Limpeza',            group: 'SERVICOS', section: 'contatos', icon: 'Broom',           ...C.rosa },
  { value: 'MANUTENCAO',  label: 'Manutenção',         group: 'SERVICOS', section: 'contatos', icon: 'Wrench',          ...C.ambar },
  { value: 'LAVANDERIA',  label: 'Lavanderia',         group: 'SERVICOS', section: 'contatos', icon: 'TShirt',          ...C.indigo },
  { value: 'PASSEIO',     label: 'Passeio',            group: 'PASSEIOS', section: 'dicas',    icon: 'Jeep',            ...C.ceu },
  { value: 'PRAIA',       label: 'Praia',              group: 'PASSEIOS', section: 'dicas',    icon: 'Waves',           ...C.ceu },
  { value: 'ESPORTE',     label: 'Esporte',            group: 'PASSEIOS', section: 'dicas',    icon: 'Wind',            ...C.ceu },
  { value: 'ROTA',        label: 'Rota',               group: 'PASSEIOS', section: 'dicas',    icon: 'MapTrifold',      ...C.violeta },
  { value: 'TRANSPORTE',  label: 'Transporte',         group: 'PASSEIOS', section: 'dicas',    icon: 'Bus',             ...C.indigo },
  { value: 'TAXI',        label: 'Táxi',               group: 'PASSEIOS', section: 'dicas',    icon: 'Taxi',            ...C.amarelo },
  { value: 'TRANSFER',    label: 'Transfer',           group: 'PASSEIOS', section: 'dicas',    icon: 'Airplane',        ...C.indigo },
  { value: 'FARMACIA',    label: 'Farmácia',           group: 'SAUDE',    section: 'contatos', icon: 'Pill',            ...C.vermelho },
  { value: 'SAUDE',       label: 'Saúde',              group: 'SAUDE',    section: 'contatos', icon: 'FirstAid',        ...C.vermelho },
  { value: 'OUTRO',       label: 'Outro',              group: 'SAUDE',    section: 'contatos', icon: 'DotsThreeCircle', ...C.cinza },
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

/** Dígitos do WhatsApp → "(85) 99999-8888" (tira o 55 do Brasil para exibir) */
export function formatWhatsappBR(digits: string) {
  const d = digits.replace(/\D/g, '')
  const local = d.startsWith('55') && (d.length === 12 || d.length === 13) ? d.slice(2) : d
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return d
}

// ─── Mensagens prontas do WhatsApp (guia do hóspede + prévia no painel) ───

/** Categorias em que o hóspede faz pedido com entrega (mensagem leva o endereço) */
export const ORDER_CATEGORIES = [
  'MERCADO', 'PADARIA', 'RESTAURANTE', 'PIZZARIA', 'LANCHES', 'DELIVERY', 'GAS_AGUA', 'FARMACIA',
] as const

export function isOrderCategory(category: string) {
  return (ORDER_CATEGORIES as readonly string[]).includes(category)
}

/** Mensagem que o hóspede envia ao tocar no botão de WhatsApp */
export function buildGuestMessage(category: string, propertyName: string, address?: string | null) {
  if (category === 'ANFITRIAO') return `Olá! Sou hóspede da ${propertyName}.`
  if (!isOrderCategory(category)) return `Olá! Estou hospedado(a) na ${propertyName}.`
  const base = `Olá! Estou hospedado(a) na ${propertyName} e gostaria de fazer um pedido.`
  return address?.trim() ? `${base}\n\nEndereço para entrega:\n${address.trim()}` : base
}

/** Acrescenta ?text= a um link wa.me (respeita links que já têm parâmetros) */
export function withWhatsappText(url: string, text: string) {
  return `${url}${url.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`
}

/** Exemplo de "Endereço padrão para entregas" (painel do anfitrião e cadastro do imóvel) */
export const DELIVERY_PLACEHOLDER = [
  'Rua ..., nº ... – Preá, Cruz/CE',
  'Referência: casa azul, portão de madeira, ao lado da pousada X',
  'Ao chegar: chame no WhatsApp',
].join('\n')
