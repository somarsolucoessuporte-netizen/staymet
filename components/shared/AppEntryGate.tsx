'use client'

import { useEffect, useState } from 'react'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { PWABanner } from '@/components/ui/PWABanner'

export function AppEntryGate({ children }: { children: React.ReactNode }) {
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
