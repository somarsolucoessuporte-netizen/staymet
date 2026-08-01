'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { PWAInstallGuide } from './PWAInstallGuide'

export function PWABanner() {
  const { deviceType, isStandalone } = usePWAInstall()
  const [visible, setBannerVisible] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (isStandalone) return

    const dismissed = localStorage.getItem('pwa_banner_dismissed')
    if (dismissed) return

    if (deviceType === 'desktop') return

    const timer = setTimeout(() => setBannerVisible(true), 30000)
    return () => clearTimeout(timer)
  }, [deviceType, isStandalone])

  const handleDismiss = () => {
    setBannerVisible(false)
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString())
  }

  if (!visible || showGuide) {
    if (showGuide) {
      return <PWAInstallGuide onDismiss={() => { setShowGuide(false); handleDismiss() }} />
    }
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40" style={{ animation: 'pwa-banner-in 0.3s ease-out' }}>
      <div className="bg-[#0F172A] rounded-2xl p-4 flex items-center gap-3 shadow-2xl border border-white/5">
        <Image
          src="/icone.png"
          alt="Anfitrião Management"
          width={40}
          height={40}
          className="object-contain flex-shrink-0 rounded-xl"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm"
             style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Instalar o app
          </p>
          <p className="text-white/40 text-xs mt-0.5">
            Acesse mais rápido pela tela inicial
          </p>
        </div>
        <button
          onClick={() => setShowGuide(true)}
          className="bg-[#1A56DB] text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
        >
          <Download size={13} strokeWidth={1.5} />
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X size={14} strokeWidth={1.5} className="text-white/40" />
        </button>
      </div>

      <style jsx>{`
        @keyframes pwa-banner-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
