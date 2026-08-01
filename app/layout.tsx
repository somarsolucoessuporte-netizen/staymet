import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { AppEntryGate } from '@/components/shared/AppEntryGate'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Anfitrião Management — Gestão completa. Estadia perfeita.',
  description: 'Gestão completa. Estadia perfeita.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icone.png',
    apple: '/icone.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Anfitrião Management',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#1A56DB',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <AppEntryGate>{children}</AppEntryGate>
      </body>
    </html>
  )
}
