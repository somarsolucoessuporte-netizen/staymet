'use client'

import { useState, useEffect } from 'react'

export type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown'
export type InstallState = 'not_installed' | 'can_install' | 'installed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [deviceType, setDeviceType] = useState<DeviceType>('unknown')
  const [installState, setInstallState] = useState<InstallState>('not_installed')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
    const isAndroid = /Android/.test(ua)

    if (isIOS) setDeviceType('ios')
    else if (isAndroid) setDeviceType('android')
    else setDeviceType('desktop')

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsStandalone(standalone)
    if (standalone) setInstallState('installed')

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setInstallState('can_install')
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installAndroid = async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallState('installed')
      setDeferredPrompt(null)
      return true
    }
    return false
  }

  return { deviceType, installState, isStandalone, installAndroid }
}
