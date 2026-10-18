// Coordenadas da casa: links de navegação e leitura de links do Google Maps.

export type LatLng = { lat: number; lng: number }

export const isValidLatLng = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)

const fmt = (n: number) => n.toFixed(6)

/** Link do Google Maps que mostra o ponto (usado em "Copiar localização" e nas mensagens) */
export const googleMapsPointUrl = ({ lat, lng }: LatLng) =>
  `https://www.google.com/maps/search/?api=1&query=${fmt(lat)},${fmt(lng)}`

export const googleMapsDirectionsUrl = ({ lat, lng }: LatLng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${fmt(lat)},${fmt(lng)}`

export const wazeUrl = ({ lat, lng }: LatLng) => `https://waze.com/ul?ll=${fmt(lat)},${fmt(lng)}&navigate=yes`

/** Ponto salvo do imóvel, se houver */
export function propertyPoint(p: { latitude: number | null; longitude: number | null }): LatLng | null {
  return p.latitude != null && p.longitude != null && isValidLatLng(p.latitude, p.longitude)
    ? { lat: p.latitude, lng: p.longitude }
    : null
}

const NUM = String.raw`(-?\d{1,3}(?:\.\d+)?)`

/**
 * Extrai lat/lng de um link do Google Maps. Ordem de confiança:
 * !3d{lat}!4d{lng} (ponto do lugar) → q=/query=/ll=/destination= → @lat,lng (centro do mapa) → "lat, lng" solto.
 */
export function parseLatLngFromText(input: string): LatLng | null {
  let text = input.trim()
  try {
    text = decodeURIComponent(text)
  } catch {
    // mantém o texto original
  }
  const patterns = [
    new RegExp(`!3d${NUM}!4d${NUM}`),
    new RegExp(String.raw`[?&](?:q|query|ll|destination|daddr|center)=(?:loc:)?${NUM}\s*,\s*${NUM}`),
    new RegExp(`@${NUM},${NUM}`),
    new RegExp(String.raw`^${NUM}\s*,\s*${NUM}$`),
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (!m) continue
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (isValidLatLng(lat, lng)) return { lat, lng }
  }
  return null
}

/** Hosts aceitos ao seguir o redirecionamento de links curtos (evita o servidor buscar URLs arbitrárias) */
export function isGoogleMapsHost(host: string) {
  const h = host.toLowerCase()
  return (
    h === 'maps.app.goo.gl' ||
    h === 'goo.gl' ||
    h === 'g.co' ||
    /(^|\.)google\.[a-z.]{2,6}$/.test(h)
  )
}
