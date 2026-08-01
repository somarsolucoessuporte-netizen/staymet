'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PWAInstallGuide } from '@/components/ui/PWAInstallGuide'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Smartphone, CheckCircle } from 'lucide-react'

export default function InstalarPage() {
  const { deviceType, isStandalone } = usePWAInstall()
  const [showGuide, setShowGuide] = useState(false)

  if (isStandalone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
           style={{ background: 'linear-gradient(160deg, #1A56DB 0%, #0F172A 100%)' }}>
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={36} strokeWidth={1.5} className="text-white" />
        </div>
        <h2 className="text-white font-bold text-2xl mb-2"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          App já instalado!
        </h2>
        <p className="text-white/60 text-sm">
          O Anfitrião Management já está na sua tela inicial.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: 'linear-gradient(160deg, #1A56DB 0%, #0F172A 100%)' }}>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
        <Image
          src="/logo.png"
          alt="Anfitrião Management"
          width={1200}
          height={400}
          className="object-contain mb-8"
          style={{ width: 160, height: 'auto', filter: 'brightness(0) invert(1)' }}
          priority
        />

        <h1 className="text-white font-bold text-2xl mb-3 leading-tight"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Instale o app no seu celular
        </h1>
        <p className="text-white/60 text-sm leading-relaxed mb-8">
          Acesse o Anfitrião Management direto pela tela inicial,
          sem precisar abrir o navegador.
        </p>

        <div className="w-full max-w-sm space-y-3 mb-8">
          {[
            'Acesso rápido pela tela inicial',
            'Notificações em tempo real',
            'Funciona mesmo com internet lenta',
            'Zero espaço na memória do celular',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={12} strokeWidth={2} className="text-white" />
              </div>
              <span className="text-white text-sm">{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowGuide(true)}
          className="w-full max-w-sm bg-white text-[#1A56DB] font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
        >
          <Smartphone size={20} strokeWidth={1.5} />
          Como instalar no {deviceType === 'ios' ? 'iPhone' : 'Android'}
        </button>

        <p className="text-white/30 text-xs mt-6">
          Powered by Somar Soluções Digitais
        </p>
      </div>

      {showGuide && <PWAInstallGuide onDismiss={() => setShowGuide(false)} />}
    </div>
  )
}
