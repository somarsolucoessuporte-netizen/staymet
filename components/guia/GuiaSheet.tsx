'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const CLOSE_DRAG_PX = 100

/**
 * Bottom sheet acessível: fundo escurecido, fecha ao tocar fora, no X, no Esc
 * ou arrastando a alça para baixo. Um único sheet controlado pela página.
 */
export function GuiaSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)
  const [dragY, setDragY] = useState(0)

  // Esc fecha; trava a rolagem da página e foca o painel enquanto aberto
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return
    setDragY(Math.max(0, e.clientY - dragStart.current))
  }
  const onPointerUp = () => {
    if (dragStart.current === null) return
    dragStart.current = null
    if (dragY > CLOSE_DRAG_PX) onClose()
    setDragY(0)
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#0F172A]/45 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ transform: open ? `translateY(${dragY}px)` : 'translateY(100%)' }}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] max-w-md flex-col rounded-t-3xl bg-white shadow-2xl outline-none ${
          dragY ? '' : 'transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]'
        }`}
      >
        {/* Alça + título: área de arrastar */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="shrink-0 touch-none cursor-grab px-5 pt-3 active:cursor-grabbing"
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between gap-3 pb-1">
            <h2 className="text-lg font-bold text-[#0F172A]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Fechar"
              className="-mr-1.5 rounded-full p-1.5 text-gray-400 active:bg-gray-100"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-2">{children}</div>
      </div>
    </div>
  )
}
