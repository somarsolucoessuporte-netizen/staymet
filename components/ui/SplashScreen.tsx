'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface SplashScreenProps {
  onComplete: () => void
  duration?: number
}

export function SplashScreen({ onComplete, duration = 1200 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 300)
    const t2 = setTimeout(() => setPhase('exit'), 850)
    const t3 = setTimeout(() => onComplete(), duration)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete, duration])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #1A56DB 0%, #0F172A 100%)',
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.03)' : 'scale(1)',
        transition: phase === 'exit'
          ? 'opacity 0.6s ease-in, transform 0.6s ease-in'
          : 'none',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      <div
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(16px)' : 'translateY(0)',
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        }}
        className="flex flex-col items-center gap-6"
      >
        <Image
          src="/logo.png"
          alt="Anfitrião Management"
          width={1200}
          height={400}
          priority
          style={{ width: 180, height: 'auto', filter: 'brightness(0) invert(1)' }}
        />

        <p
          className="text-white/50 text-sm font-medium tracking-widest uppercase"
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            opacity: phase === 'hold' || phase === 'exit' ? 1 : 0,
            transition: 'opacity 0.4s ease-out 0.2s',
          }}
        >
          Gestão completa. Estadia perfeita.
        </p>
      </div>

      <div
        className="absolute bottom-16 flex items-center gap-2"
        style={{
          opacity: phase === 'hold' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/40"
            style={{
              animation: 'splash-pulse 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes splash-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
