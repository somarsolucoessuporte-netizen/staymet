import type { LatLng } from '@/lib/geo'

// Centro aproximado da cidade (OpenStreetMap Nominatim), só para abrir o mapa do painel no lugar certo.

const BRASIL: LatLng = { lat: -14.235, lng: -51.925 }

export async function geocodeCity(city: string, state: string, country = 'Brasil'): Promise<{ center: LatLng; found: boolean }> {
  const q = [city, state, country].filter(Boolean).join(', ')
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      {
        headers: { 'User-Agent': 'Staymet/1.0 (https://staymet.somar.ia.br)', 'Accept-Language': 'pt-BR' },
        signal: AbortSignal.timeout(3000),
        next: { revalidate: 60 * 60 * 24 * 7 },
      },
    )
    if (!res.ok) return { center: BRASIL, found: false }
    const [hit] = (await res.json()) as { lat: string; lon: string }[]
    if (!hit) return { center: BRASIL, found: false }
    return { center: { lat: Number(hit.lat), lng: Number(hit.lon) }, found: true }
  } catch {
    return { center: BRASIL, found: false }
  }
}
