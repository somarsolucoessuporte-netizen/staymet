import Link from 'next/link'
import { ArrowLeft, Plus, Search, Pencil, Eye, SlidersHorizontal, MapPin, User } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { propertyTypeLabel } from '@/lib/property-types'
import { PropertyStatusButton } from '@/components/admin/PropertyStatusButton'
import { SomarFooter } from '@/components/shared/SomarFooter'

// Acesso restrito a ADMINISTRADOR pelo layout (admin)

export default async function ImoveisPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; inativos?: string }>
}) {
  const { locale } = await params
  const { q = '', inativos } = await searchParams
  const showInactive = inativos === '1'
  const term = q.trim()

  const where: Prisma.PropertyWhereInput = {
    ...(showInactive ? {} : { active: true }),
    ...(term
      ? { OR: [{ name: { contains: term, mode: 'insensitive' } }, { city: { contains: term, mode: 'insensitive' } }] }
      : {}),
  }

  const properties = await prisma.property.findMany({
    where,
    select: {
      id: true, name: true, type: true, city: true, state: true, active: true, coverImageUrl: true,
      owner: { select: { name: true } },
    },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  })

  const base = `/${locale}/admin/imoveis`
  const toggleHref = `${base}?${new URLSearchParams({ ...(term ? { q: term } : {}), ...(showInactive ? {} : { inativos: '1' }) })}`

  const btn = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition active:scale-[0.98]'

  return (
    <div className="font-display min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        <Link href={`/${locale}/admin/dashboard`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#1A56DB]">
          <ArrowLeft size={16} /> Painel
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Gestão de Imóveis</h1>
            <p className="text-sm text-[#64748B]">{properties.length} {properties.length === 1 ? 'imóvel' : 'imóveis'}</p>
          </div>
          <Link href={`${base}/novo`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1A56DB] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1648C0] active:scale-[0.98]">
            <Plus size={18} /> Novo imóvel
          </Link>
        </div>

        {/* Busca + filtro */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action={base} className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-black/5">
            <Search size={18} className="text-gray-400" />
            {showInactive && <input type="hidden" name="inativos" value="1" />}
            <input
              name="q"
              defaultValue={term}
              placeholder="Buscar por nome ou cidade…"
              className="h-11 flex-1 bg-transparent text-sm outline-none"
            />
          </form>
          <Link href={toggleHref} className="inline-flex items-center gap-2 text-sm font-medium text-[#475569]">
            <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${showInactive ? 'bg-[#1A56DB]' : 'bg-gray-300'}`}>
              <span className={`h-4 w-4 rounded-full bg-white transition ${showInactive ? 'translate-x-4' : ''}`} />
            </span>
            Mostrar inativos
          </Link>
        </div>

        {/* Lista: cards no mobile, linhas no desktop */}
        <div className="mt-5 space-y-3">
          {properties.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-[#64748B] ring-1 ring-black/5">Nenhum imóvel encontrado.</p>
          )}

          {properties.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 lg:flex-row lg:items-center ${p.active ? '' : 'opacity-70'}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#0F172A]">
                  {p.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold">{p.name}</p>
                    {!p.active && <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">Inativo</span>}
                  </div>
                  <p className="text-xs font-medium text-[#1A56DB]">{propertyTypeLabel(p.type)}</p>
                  <p className="flex flex-wrap gap-x-3 text-xs text-[#64748B]">
                    <span className="inline-flex items-center gap-1"><MapPin size={11} /> {p.city}, {p.state}</span>
                    <span className="inline-flex items-center gap-1"><User size={11} /> {p.owner.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`${base}/${p.id}/editar`} className={`${btn} bg-[#1A56DB] text-white`}>
                  <Pencil size={14} /> Editar
                </Link>
                {p.active && (
                  <>
                    <a href={`/guia/${p.id}`} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#F1F5FF] text-[#1A56DB]`}>
                      <Eye size={14} /> Guia do hóspede
                    </a>
                    <Link href={`/${locale}/anfitriao/guia?propertyId=${p.id}`} className={`${btn} bg-[#F1F5FF] text-[#1A56DB]`}>
                      <SlidersHorizontal size={14} /> Configurar botões
                    </Link>
                  </>
                )}
                <PropertyStatusButton id={p.id} active={p.active} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <SomarFooter />
    </div>
  )
}
