import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getCategoryMeta } from '@/lib/guia'
import { getPartnerForProperty, getPartnerReport, resolvePeriod, verifyPartnerReportToken, type Periodo } from '@/lib/guide-report'
import { PartnerReportView, PeriodChips } from '@/components/anfitriao/GuiaRelatorio'
import { PrintButton } from '@/components/anfitriao/PrintButton'
import { SomarFooter } from '@/components/shared/SomarFooter'

// Link público somente leitura que o anfitrião manda ao parceiro (?t=token). Só números, sem dados de hóspedes.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Relatório do parceiro — Staymet',
  robots: { index: false, follow: false },
}

const PERIOD_OPTIONS: Periodo[] = ['30d', 'mes', '90d', '12m']

export default async function ParceiroPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; partnerId: string }>
  searchParams: Promise<{ t?: string; periodo?: string }>
}) {
  const { id, partnerId } = await params
  const { t, periodo } = await searchParams
  if (!verifyPartnerReportToken(id, partnerId, t)) notFound()

  const link = await getPartnerForProperty(id, partnerId)
  if (!link) notFound()

  const range = resolvePeriod(periodo ?? '12m', PERIOD_OPTIONS)
  const report = await getPartnerReport(id, partnerId, range)
  const base = `/guia/${id}/parceiro/${partnerId}?t=${encodeURIComponent(t!)}`

  return (
    <div className="font-display flex min-h-[100dvh] flex-col bg-[#F8FAFC] text-[#0F172A] print:bg-white">
      <div className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 pb-6">
        <header className="-mx-4 flex h-[60px] items-center gap-2.5 bg-gradient-to-r from-[#0F3A7A] to-[#1A56DB] px-4 text-white print:bg-none print:px-0 print:text-[#0F172A]">
          <Image src="/icone.png" alt="" width={28} height={28} className="rounded-md" />
          <p className="text-sm font-semibold">Relatório de contatos · Staymet</p>
        </header>

        <PeriodChips current={range.periodo} options={PERIOD_OPTIONS} href={(p) => `${base}&periodo=${p}`} />

        <PartnerReportView
          partnerName={link.partner.name}
          categoryLabel={getCategoryMeta(link.partner.category)?.label ?? link.partner.category}
          propertyName={link.property.name}
          range={range}
          report={report}
        />

        <PrintButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#F1F5FF] text-sm font-semibold text-[#1A56DB] transition active:scale-[0.98] print:hidden" />
      </div>
      <SomarFooter className="mt-auto pb-[calc(12px+env(safe-area-inset-bottom,0px))]" />
    </div>
  )
}
