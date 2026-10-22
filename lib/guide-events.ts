// Contador de uso do Guia do Hóspede — compartilhado entre o guia público (cliente), a rota de eventos e os relatórios.
// Sem dado pessoal do hóspede: só imóvel, botão, ação, parceiro e a origem da reserva do dia.

export const GUIDE_ACTIONS = ['abrir_guia', 'abrir_card', 'whatsapp', 'ligar', 'link', 'waze', 'google_maps', 'copiar'] as const
export type GuideAction = (typeof GUIDE_ACTIONS)[number]

/** Botões fixos do guia; os de parceiro usam 'partner' + partnerId. 'guia' = abertura do guia */
export const GUIDE_CARD_KEYS = ['guia', 'wifi', 'localizacao', 'emergencia', 'entregador', 'avaliar', 'sugestoes', 'partner'] as const
export type GuideCardKey = (typeof GUIDE_CARD_KEYS)[number]

export const CARD_KEY_LABEL: Record<string, string> = {
  guia: 'Guia',
  wifi: 'Wi-Fi',
  localizacao: 'Como chegar',
  emergencia: 'Emergência',
  entregador: 'Entregador',
  avaliar: 'Avaliar estadia',
  sugestoes: 'Caixinha de sugestões',
}

export const ACTION_LABEL: Record<GuideAction, string> = {
  abrir_guia: 'Abriu o guia',
  abrir_card: 'Abriu o botão',
  whatsapp: 'WhatsApp',
  ligar: 'Ligação',
  link: 'Site',
  waze: 'Waze',
  google_maps: 'Google Maps',
  copiar: 'Copiou',
}

/** Ações que levam o hóspede até o parceiro (contam como "contato" no relatório do parceiro) */
export const CONTACT_ACTIONS: GuideAction[] = ['whatsapp', 'ligar', 'link', 'waze', 'google_maps']

export type GuideEventInput = { cardKey: GuideCardKey; action: GuideAction; partnerId?: string | null }

/**
 * Registra um clique no guia público. Nunca lança erro nem atrasa a navegação:
 * sendBeacon sobrevive à troca de página (WhatsApp, tel:, link externo); fallback fetch keepalive.
 */
export function trackGuideEvent(propertyId: string, ev: GuideEventInput) {
  try {
    const url = `/api/guia/${encodeURIComponent(propertyId)}/evento`
    // text/plain evita preflight e é aceito pelo sendBeacon em todos os navegadores
    const body = new Blob([JSON.stringify(ev)], { type: 'text/plain;charset=UTF-8' })
    if (navigator.sendBeacon?.(url, body)) return
    void fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {})
  } catch {
    // contador nunca quebra o guia
  }
}

/** Abertura do guia: 1 vez por sessão do navegador e por imóvel */
export function trackGuideOpen(propertyId: string) {
  try {
    const key = `staymet-guia-aberto-${propertyId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    // sessionStorage bloqueado (aba anônima etc.): registra mesmo assim
  }
  trackGuideEvent(propertyId, { cardKey: 'guia', action: 'abrir_guia' })
}

/** Ação de um link externo: rota (Waze/Google Maps) ou site */
export function linkAction(url: string): GuideAction {
  if (/waze\.com/i.test(url)) return 'waze'
  if (/maps|goo\.gl/i.test(url)) return 'google_maps'
  return 'link'
}
