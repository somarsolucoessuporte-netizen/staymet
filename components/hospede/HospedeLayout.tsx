'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wifi, Wrench, MessageCircle, Map } from 'lucide-react'

interface HospedeLayoutProps {
  children: ReactNode
  token: string
  propertyName: string
  showBottomNav?: boolean
}

export function HospedeLayout({ children, token, showBottomNav = true }: HospedeLayoutProps) {
  const pathname = usePathname()
  const base = `/acesso/hospede/${token}`

  const navItems = [
    { href: base,                  icon: Home,          label: 'Início' },
    { href: `${base}/wifi`,        icon: Wifi,          label: 'Wi-Fi' },
    { href: `${base}/servicos`,    icon: Wrench,        label: 'Serviços' },
    { href: `${base}/suporte`,     icon: MessageCircle, label: 'Suporte' },
    { href: `${base}/parceiros`,   icon: Map,           label: 'Local' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {children}

      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100">
          <div className="flex items-center max-w-lg mx-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                    isActive ? 'text-[#1A56DB]' : 'text-gray-400'
                  }`}
                >
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="transition-all"
                  />
                  <span className={`text-[10px] font-medium tracking-wide ${
                    isActive ? 'text-[#1A56DB]' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1A56DB] rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
