'use client'

import { useEffect, useRef } from 'react'
import type { Map as LMap, Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '@/lib/geo'

// Mapa OpenStreetMap via Leaflet (gratuito, sem chave). Carrega o Leaflet só no navegador.

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M18 43s15-14.2 15-25.5C33 8.9 26.3 2 18 2S3 8.9 3 17.5C3 28.8 18 43 18 43z" fill="#1A56DB" stroke="#fff" stroke-width="3"/><circle cx="18" cy="17.5" r="5.5" fill="#fff"/></svg>`

export function LeafletMap({
  center,
  marker,
  zoom = 17,
  interactive = true,
  draggable = false,
  onMove,
  className,
}: {
  center: LatLng
  /** ponto do pino; sem ele o mapa só mostra a região */
  marker?: LatLng | null
  zoom?: number
  interactive?: boolean
  draggable?: boolean
  /** chamado ao soltar o pino ou tocar no mapa (modo arrastável) */
  onMove?: (p: LatLng) => void
  className?: string
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<LMap | null>(null)
  const pin = useRef<Marker | null>(null)
  const onMoveRef = useRef(onMove)
  const leaflet = useRef<typeof import('leaflet') | null>(null)

  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  // Cria o mapa uma vez
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !el.current || map.current) return
      leaflet.current = L
      const m = L.map(el.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        attributionControl: true,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(m)
      if (draggable) {
        m.on('click', (e) => {
          pin.current?.setLatLng(e.latlng)
          onMoveRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng })
        })
      }
      map.current = m
      syncMarker()
    })()
    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
      pin.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function syncMarker() {
    const L = leaflet.current
    const m = map.current
    if (!L || !m) return
    if (!marker) {
      pin.current?.remove()
      pin.current = null
      return
    }
    if (!pin.current) {
      const icon = L.divIcon({ html: PIN_SVG, className: '', iconSize: [36, 44], iconAnchor: [18, 43] })
      pin.current = L.marker([marker.lat, marker.lng], { icon, draggable, keyboard: false }).addTo(m)
      pin.current.on('dragend', () => {
        const p = pin.current!.getLatLng()
        onMoveRef.current?.({ lat: p.lat, lng: p.lng })
      })
    } else {
      pin.current.setLatLng([marker.lat, marker.lng])
    }
  }

  // Pino e centro acompanham as props
  useEffect(() => {
    syncMarker()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker?.lat, marker?.lng])

  useEffect(() => {
    map.current?.setView([center.lat, center.lng], map.current.getZoom() < zoom ? zoom : map.current.getZoom())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng])

  return <div ref={el} className={`isolate z-0 overflow-hidden ${className ?? ''}`} />
}
