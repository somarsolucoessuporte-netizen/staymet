'use client'

import { linkAction, trackGuideEvent, type GuideCardKey } from '@/lib/guide-events'

/** Link externo do guia que entra no contador de uso (ex.: sites de avaliação na tela "Avaliar estadia") */
export function GuiaTrackedLink({
  propertyId,
  cardKey,
  partnerId,
  href,
  className,
  children,
}: {
  propertyId: string
  cardKey: GuideCardKey
  partnerId?: string
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackGuideEvent(propertyId, { cardKey, action: linkAction(href), partnerId })}
    >
      {children}
    </a>
  )
}
