import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Manifest PWA por imóvel: o hóspede instala o guia com o nome da casa
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await prisma.property.findFirst({ where: { id, active: true }, select: { name: true } })
  const name = property?.name ?? 'Guia do hóspede'

  return NextResponse.json(
    {
      name,
      short_name: name.length > 14 ? name.slice(0, 14).trim() : name,
      description: 'Guia do hóspede — contatos, Wi-Fi e dicas',
      id: `/guia/${id}`,
      start_url: `/guia/${id}`,
      scope: `/guia/${id}`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#FEFCF8',
      theme_color: '#1A6B9E',
      lang: 'pt-BR',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300' } },
  )
}
