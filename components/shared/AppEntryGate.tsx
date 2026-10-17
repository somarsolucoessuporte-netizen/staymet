'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { PWABanner } from '@/components/ui/PWABanner'

export function AppEntryGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('splash_shown')) {
      setShowSplash(false)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('splash_shown', '1')
  }

  // Guia público do hóspede: sem splash e sem banner de instalação do app
  if (pathname?.startsWith('/guia/')) return <>{children}</>

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        {children}
      </div>
      {!showSplash && <PWABanner />}
    </>
  )
}
