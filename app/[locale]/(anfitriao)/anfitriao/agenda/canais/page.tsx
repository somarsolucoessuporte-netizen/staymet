import Link from 'next/link'
import { ArrowLeft, PlugsConnected, CheckCircle, WarningCircle, Clock, Copy, Info, CaretRight } from '@phosphor-icons/react/ssr'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/guia-access'
import { ensureIcalToken, listAgendaProperties } from '@/lib/agenda-server'
import { getRequestOrigin } from '@/lib/request-origin'
import { PLATFORM_META } from '@/lib/agenda'
import { GuiaCopyButton } from '@/components/guia/GuiaCopyButton'
import { ChannelForm } from '@/components/agenda/ChannelForm'
import { RemoveChannelButton } from '@/components/agenda/RemoveChannelButton'
import { SyncNowButton } from '@/components/agenda/SyncNowButton'
import { PropertyChips } from '@/components/agenda/PropertyChips'

function timeAgo(date: Date) {
  const min = Math.round((Date.now() - date.getTime()) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}

const STEPS: { platform: string; exportSteps: string; importSteps: string }[] = [
  {
    platform: 'Airbnb',
    exportSteps: 'No app ou site: Anúncios → escolha o anúncio → Disponibilidade → "Conectar calendários" (ou "Sincronizar calendários") → "Exportar calendário" → copie o link e cole aqui em "Adicionar canal".',
    importSteps: 'Na mesma tela, toque em "Importar calendário" (ou "Conectar a outro site"), cole o "Link do Staymet para colar nesta plataforma" do canal Airbnb e dê o nome "Staymet".',
  },
  {
    platform: 'Booking.com',
    exportSteps: 'Na Extranet: Tarifas e disponibilidade → Sincronizar calendários → escolha o tipo de quarto → "Exportar calendário" e copie o link.',
    importSteps: 'Na mesma tela, "Adicionar conexão de calendário" → cole o link do Staymet do canal Booking → nomeie como "Staymet".',
  },
  {
    platform: 'Vrbo',
    exportSteps: 'No painel do anúncio: Calendário → "Importar e exportar" → "Exportar calendário" e copie o link.',
    importSteps: 'Na mesma tela, "Importar calendário" → cole o link do Staymet do canal Vrbo → nomeie como "Staymet".',
  },
]

export default async function CanaisPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ propertyId?: string }>
}) {
  const { locale } = await params
  const { propertyId } = await searchParams
  const dbUser = await getCurrentDbUser()
  if (!dbUser) return null

  const properties = await listAgendaProperties(dbUser)
  if (properties.length === 0) {
    return (
      <div className="font-display space-y-2 p-4 pt-6">
        <h1 className="text-xl font-extrabold">Canais</h1>
        <p className="text-sm text-[#64748B]">Você ainda não está vinculado a nenhum imóvel.</p>
      </div>
    )
  }

  const selected = properties.find((p) => p.id === propertyId) ?? properties[0]
  const [token, origin, channels] = await Promise.all([
    ensureIcalToken(selected.id),
    getRequestOrigin(),
    prisma.calendarChannel.findMany({ where: { propertyId: selected.id }, orderBy: { createdAt: 'asc' } }),
  ])
  const feedBase = `${origin}/api/ical/${token}`
  const agendaHref = `/${locale}/anfitriao/agenda?propertyId=${selected.id}`

  return (
    <div className="font-display space-y-5 p-4 pt-6 text-[#0F172A]">
      <Link href={agendaHref} className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1A56DB]">
        <ArrowLeft size={16} /> Agenda
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold">
          <PlugsConnected size={22} className="text-[#1A56DB]" /> Canais
        </h1>
        <p className="text-sm text-[#64748B]">
          {selected.name} · sincroniza sozinho a cada 10 minutos
        </p>
      </div>

      <PropertyChips properties={properties} selectedId={selected.id} hrefFor={(id) => `/${locale}/anfitriao/agenda/canais?propertyId=${id}`} />

      {channels.length > 0 && <SyncNowButton propertyId={selected.id} className="w-full" />}

      {/* CANAIS CONECTADOS */}
      <section className="space-y-3">
        {channels.length === 0 && (
          <p className="rounded-3xl bg-white p-5 text-sm text-[#64748B] ring-1 ring-black/5">
            Nenhum canal conectado. Adicione o Airbnb, Booking ou Vrbo colando o link de exportação do calendário deles.
          </p>
        )}
        {channels.map((c) => {
          const meta = PLATFORM_META[c.platform]
          const link = `${feedBase}/${c.id}.ics`
          return (
            <div key={c.id} className="space-y-3 rounded-3xl bg-white p-4 ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: meta.color }}>
                  {meta.label.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{c.label}</p>
                  {c.lastStatus === 'OK' && c.lastSyncAt ? (
                    <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle size={14} weight="fill" /> OK · {timeAgo(c.lastSyncAt)}
                    </p>
                  ) : c.lastStatus === 'ERRO' ? (
                    <p className="flex items-center gap-1 text-xs font-medium text-red-600">
                      <WarningCircle size={14} weight="fill" /> Erro{c.lastSyncAt ? ` · ${timeAgo(c.lastSyncAt)}` : ''}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-[#64748B]">
                      <Clock size={14} /> Aguardando primeira sincronização
                    </p>
                  )}
                </div>
                <RemoveChannelButton propertyId={selected.id} channelId={c.id} label={c.label} />
              </div>
              {c.lastStatus === 'ERRO' && c.lastError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{c.lastError}</p>
              )}
              <div className="rounded-2xl bg-[#F8FAFC] p-3">
                <p className="text-xs font-semibold text-[#475569]">Link do Staymet para colar no {meta.label}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-[#64748B]">{link}</p>
                <GuiaCopyButton
                  text={link}
                  toast="Link copiado"
                  className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#1A56DB] px-3 text-xs font-semibold text-white active:scale-[0.98]"
                >
                  <Copy size={14} weight="bold" /> Copiar
                </GuiaCopyButton>
              </div>
            </div>
          )
        })}

        <ChannelForm propertyId={selected.id} />
      </section>

      {/* LINK GERAL */}
      <section className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
        <p className="text-sm font-bold">Link geral do Staymet</p>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Para OLX ou outra plataforma que não está conectada aqui. Mostra todas as datas ocupadas, sem dados dos hóspedes.
        </p>
        <p className="mt-2 break-all font-mono text-[11px] text-[#64748B]">{feedBase}.ics</p>
        <GuiaCopyButton
          text={`${feedBase}.ics`}
          toast="Link copiado"
          className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#F1F5FF] px-3 text-xs font-semibold text-[#1A56DB] active:scale-[0.98]"
        >
          <Copy size={14} weight="bold" /> Copiar
        </GuiaCopyButton>
      </section>

      {/* PASSO A PASSO */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 pl-1 text-base font-extrabold">
          <Info size={18} className="text-[#1A56DB]" /> Passo a passo
        </h2>
        <p className="pl-1 text-xs text-[#64748B]">
          Em cada plataforma são dois passos: trazer o calendário dela para cá (exportar) e levar o do Staymet para lá (importar).
        </p>
        {STEPS.map((s) => (
          <details key={s.platform} className="group rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold [&::-webkit-details-marker]:hidden">
              {s.platform}
              <CaretRight size={16} weight="bold" className="text-[#94A3B8] transition group-open:rotate-90" />
            </summary>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-[#475569]">
              <li><strong className="text-[#0F172A]">1. Trazer para o Staymet:</strong> {s.exportSteps}</li>
              <li><strong className="text-[#0F172A]">2. Levar o Staymet para lá:</strong> {s.importSteps}</li>
            </ol>
          </details>
        ))}
        <p className="pl-1 text-[11px] text-[#94A3B8]">
          Use sempre o link específico de cada canal (não o geral) para a plataforma não ler de volta as próprias reservas.
          As plataformas atualizam o calendário importado em intervalos próprios (Airbnb e Booking: algumas horas).
        </p>
      </section>
    </div>
  )
}
