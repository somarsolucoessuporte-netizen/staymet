'use client'

import { useState, useTransition } from 'react'
import { Crosshair, LinkSimple, CircleNotch, NavigationArrow, Warning, CheckCircle, Trash } from '@phosphor-icons/react/ssr'
import { useToast } from '@/components/ui/toast'
import { LeafletMap } from '@/components/shared/LeafletMap'
import { resolveMapsLink, updateGuiaLocation } from '@/lib/actions/guia'
import { googleMapsPointUrl, wazeUrl, type LatLng } from '@/lib/geo'

const field = 'h-10 w-full min-w-0 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm focus:border-[#1A56DB] focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/15'
const softBtn = 'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F1F5FF] text-xs font-semibold text-[#1A56DB] active:scale-[0.98]'

const GPS_ERRORS: Record<number, string> = {
  1: 'Permissão de localização negada. Libere o acesso à localização no navegador e tente de novo.',
  2: 'Não foi possível obter sua localização. Vá para a frente da casa e tente de novo.',
  3: 'A localização demorou demais. Tente de novo ao ar livre.',
}

/** Ponto exato da casa: GPS do celular, mapa com pino arrastável ou link do Google Maps */
export function GuiaLocationForm({
  propertyId,
  saved,
  fallbackCenter,
  locationUrl,
}: {
  propertyId: string
  saved: LatLng | null
  /** centro quando ainda não há ponto (cidade do imóvel) */
  fallbackCenter: LatLng
  locationUrl: string | null
}) {
  const { toast } = useToast()
  const [point, setPoint] = useState<LatLng | null>(saved)
  const [focus, setFocus] = useState<LatLng>(saved ?? fallbackCenter)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [link, setLink] = useState('')
  const [linkUsed, setLinkUsed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resolving, startResolve] = useTransition()
  const [saving, startSave] = useTransition()

  const changed = point?.lat !== saved?.lat || point?.lng !== saved?.lng

  const place = (p: LatLng) => {
    setPoint(p)
    setFocus(p)
  }

  const useGps = () => {
    setError(null)
    if (!('geolocation' in navigator)) return setError('Este aparelho não oferece localização.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setAccuracy(Math.round(pos.coords.accuracy))
        setLinkUsed(null)
        place({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        setLocating(false)
        setError(GPS_ERRORS[err.code] ?? 'Não foi possível obter sua localização.')
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  }

  const readLink = () =>
    startResolve(async () => {
      setError(null)
      const r = await resolveMapsLink(propertyId, link)
      if (!r.ok) return setError(r.error)
      setAccuracy(null)
      setLinkUsed(/^https?:\/\//i.test(link.trim()) ? link.trim() : null)
      place(r.point)
      toast({ title: 'Ponto encontrado no link', variant: 'success' })
    })

  const save = (p: LatLng | null) =>
    startSave(async () => {
      setError(null)
      const r = await updateGuiaLocation(propertyId, p, p ? linkUsed ?? undefined : undefined)
      if (!r.ok) return setError(r.error)
      if (!p) setPoint(null)
      toast({ title: p ? 'Localização salva' : 'Localização removida', variant: 'success' })
    })

  return (
    <div className="space-y-4">
      {/* a) GPS do celular */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={useGps}
          disabled={locating}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A56DB] text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {locating ? <CircleNotch size={18} className="animate-spin" /> : <Crosshair size={18} weight="bold" />}
          {locating ? 'Buscando sua localização…' : 'Usar minha localização atual'}
        </button>
        <p className="text-center text-[11px] text-[#94A3B8]">Faça isso estando na casa.</p>
        {accuracy != null &&
          (accuracy > 50 ? (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
              <Warning size={16} weight="fill" className="mt-px shrink-0" />
              <span>Precisão de ~{accuracy} m. Vá para a frente da casa e tente de novo.</span>
            </p>
          ) : (
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle size={15} weight="fill" /> Precisão de ~{accuracy} m
            </p>
          ))}
      </div>

      {/* b) Mapa com pino arrastável */}
      <div className="space-y-1.5">
        <LeafletMap
          center={focus}
          marker={point}
          zoom={point ? 17 : 13}
          draggable
          onMove={(p) => {
            setAccuracy(null)
            setPoint(p)
          }}
          className="h-[240px] rounded-xl ring-1 ring-[#E2E8F0]"
        />
        <p className="text-[11px] text-[#94A3B8]">
          {point ? 'Arraste o pino até a porta da casa para ajustar.' : 'Toque no mapa para marcar a casa.'}
        </p>
      </div>

      {/* c) Link do Google Maps */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-[#475569]">Ou cole um link do Google Maps</p>
        <div className="flex gap-2">
          <input
            aria-label="Link do Google Maps"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              if (link.trim()) readLink()
            }}
            inputMode="url"
            placeholder="https://maps.app.goo.gl/…"
            className={field}
          />
          <button
            type="button"
            onClick={readLink}
            disabled={resolving || !link.trim()}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#F1F5FF] px-3 text-xs font-semibold text-[#1A56DB] disabled:opacity-40"
          >
            {resolving ? <CircleNotch size={16} className="animate-spin" /> : <LinkSimple size={16} weight="bold" />}
            Usar link
          </button>
        </div>
        {!saved && locationUrl && (
          <p className="text-[11px] text-[#94A3B8]">
            Hoje o guia usa o link salvo antes.{' '}
            <button type="button" onClick={() => setLink(locationUrl)} className="font-medium text-[#1A56DB]">
              Usar esse link
            </button>
          </p>
        )}
      </div>

      {/* Prévia */}
      {point && (
        <div className="space-y-2 rounded-xl bg-[#F8FAFC] p-3 ring-1 ring-black/5">
          <p className="text-center font-mono text-xs text-[#475569]">
            {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
          </p>
          <div className="flex gap-2">
            <a href={googleMapsPointUrl(point)} target="_blank" rel="noopener noreferrer" className={softBtn}>
              <NavigationArrow size={15} weight="bold" /> Testar no Google Maps
            </a>
            <a href={wazeUrl(point)} target="_blank" rel="noopener noreferrer" className={softBtn}>
              <NavigationArrow size={15} weight="bold" /> Testar no Waze
            </a>
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}

      <div className="flex gap-2">
        {saved && (
          <button
            type="button"
            onClick={() => save(null)}
            disabled={saving}
            aria-label="Remover localização"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-200 disabled:opacity-40"
          >
            <Trash size={18} weight="bold" />
          </button>
        )}
        <button
          type="button"
          onClick={() => point && save(point)}
          disabled={saving || !point || !changed}
          className="h-11 flex-1 rounded-xl bg-[#1A56DB] text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? 'Salvando…' : 'Salvar localização'}
        </button>
      </div>
    </div>
  )
}
