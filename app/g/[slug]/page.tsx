import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

// Link amigável do guia: /g/{slug} → /guia/{id}
export const dynamic = 'force-dynamic'

export default async function GuiaSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const property = await prisma.property.findFirst({
    where: { slug: slug.toLowerCase(), active: true },
    select: { id: true },
  })
  if (!property) notFound()
  redirect(`/guia/${property.id}`)
}
