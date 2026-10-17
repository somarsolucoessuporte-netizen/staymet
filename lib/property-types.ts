// Rótulos legíveis do enum PropertyType (prisma/schema.prisma) — seguro para client e server
export const PROPERTY_TYPES = [
  { value: 'CASA_PRAIA',  label: 'Casa de praia' },
  { value: 'CASA_SERRA',  label: 'Casa de serra' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'CHACARA',     label: 'Chácara' },
  { value: 'OUTRO',       label: 'Outro' },
] as const

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number]['value']

export function propertyTypeLabel(type: string) {
  return PROPERTY_TYPES.find((t) => t.value === type)?.label ?? type
}

// Upload da foto de capa
export const COVER_BUCKET = 'imoveis'
export const COVER_MAX_BYTES = 5 * 1024 * 1024
export const COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
