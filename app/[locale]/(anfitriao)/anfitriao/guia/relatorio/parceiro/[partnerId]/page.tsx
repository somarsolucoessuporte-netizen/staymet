import { notFound } from 'next/navigation'
import { LinkSimple } from '@phosphor-icons/react/ssr'
import { prisma } from '@/lib/prisma'
import { canEditGuia, getCurrentDbUser } from '@/lib/guia-access'
import { getCategoryMeta } from '@/lib/guia'
import { getRequestOrigin } from '@/lib/request-origin'
import { getPartnerForProperty, getPartnerReport, partnerReportToken, resolvePeriod, type Periodo } from '@/lib/guide-report'
import { PartnerReportView, PeriodChips } from '@/components/anfitriao/GuiaRelatorio'
import { GuiaCopyButton } from '@/components/guia/GuiaCopyButton'
import { PrintButton } from '@/components/anfitriao/PrintButton'

// Relatório de um parceiro (restaurante, passeio, transfer...) para o anfitrião imprimir ou mandar o link público

const PERIOD_OPTIONS: Periodo[] = ['30d', 'mes', '90d', '12m']

const actionBtn =
  'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition active:scale-[0.98]'

export default async function ParceiroRelatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; partnerId: string }>
  searchParams: Promise<{ propertyId?: string; periodo?: string }>
}) {
  const { locale, partnerId } = await params
  const { propertyId: rawPropertyId, periodo } = await searchParams

  const dbUser = await getCurrentDbUser()
  if (!dbUser) return null

  // Sem propertyId: primeiro imóvel ativo em que o parceiro aparece
  const propertyId =
    rawPropertyId ??
    (await prisma.propertyPartner.findFirst({
      where: { partnerId, property: { active: true } },
      select: { propertyId: true },
    }))?.propertyId
  if (!propertyId || !(await canEditGuia(dbUser, propertyId))) notFound()

  const link = await getPartnerForProperty(propertyId, partnerId)
  if (!link) notFound()

  const range = resolvePeriod(periodo, PERIOD_OPTIONS)
  const report = await getPartnerReport(propertyId, partnerId, range)
  const token = partnerReportToken(propertyId, partnerId)
  const origin = await getRequestOrigin()
  const publicUrl = token ? `${origin}/guia/${propertyId}/parceiro/${partnerId}?t=${token}&periodo=${range.periodo}` : null
  const base = `/${locale}/anfitriao/guia/relatorio/parceiro/${partnerId}?propertyId=${propertyId}`

  return (
    <div className="space-y-4 p-4 pt-6 text-[#0F172A]">
      <div className="print:hidden">
        <h1 className="text-xl font-bold">Relatório do parceiro</h1>
        <p className="text-sm text-muted-foreground">Imprima ou mande o link para mostrar quantos hóspedes chegaram até ele.</p>
      </div>

      <PeriodChips current={range.periodo} options={PERIOD_OPTIONS} href={(p) => `${base}&periodo=${p}`} />

      <PartnerReportView
        partnerName={link.partner.name}
        categoryLabel={getCategoryMeta(link.partner.category)?.label ?? link.partner.category}
        propertyName={link.property.name}
        range={range}
        report={report}
      />

      <div className="flex gap-2 print:hidden">
        {publicUrl && (
          <GuiaCopyButton text={publicUrl} toast="Link do relatório copiado" className={`${actionBtn} bg-[#1A56DB] text-white`}>
            <LinkSimple size={18} weight="duotone" /> Copiar link para o parceiro
          </GuiaCopyButton>
        )}
        <PrintButton className={`${actionBtn} bg-[#F1F5FF] text-[#1A56DB]`} />
      </div>
      {publicUrl && (
        <p className="px-1 text-[11px] text-[#94A3B8] print:hidden">
          O link é somente leitura e mostra apenas estes números, sem dados de hóspedes.
        </p>
      )}
    </div>
  )
}
