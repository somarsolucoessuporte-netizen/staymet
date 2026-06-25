import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

async function createSupabaseUser(email: string, password: string, name: string, role: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (error) throw new Error(`Supabase user creation failed for ${email}: ${error.message}`)
  return data.user!
}

async function clearAll() {
  await prisma.notification.deleteMany()
  await prisma.guestRequest.deleteMany()
  await prisma.inspection.deleteMany()
  await prisma.occurrence.deleteMany()
  await prisma.task.deleteMany()
  await prisma.propertyPartner.deleteMany()
  await prisma.partner.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.propertyUser.deleteMany()
  await prisma.property.deleteMany()
  await prisma.user.deleteMany()

  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (data?.users?.length) {
    await Promise.all(data.users.map((u) => supabase.auth.admin.deleteUser(u.id)))
  }
}

async function main() {
  console.log('🌱 Iniciando seed...')
  await clearAll()

  // Create Supabase users
  const [gestorSb, proprietarioSb, anfitriaoSb, hospedeSb, prestadorSb] = await Promise.all([
    createSupabaseUser('gestor@staymet.app', '123456', 'Carlos Gestor', 'GESTOR'),
    createSupabaseUser('proprietario@staymet.app', '123456', 'Maria Proprietária', 'PROPRIETARIO'),
    createSupabaseUser('anfitriao@staymet.app', '123456', 'João Anfitrião', 'ANFITRIAO'),
    createSupabaseUser('hospede@staymet.app', '123456', 'Ana Hóspede', 'HOSPEDE'),
    createSupabaseUser('prestador@staymet.app', '123456', 'Pedro Limpeza', 'PRESTADOR'),
  ])

  // Create DB users
  const [gestor, proprietario, anfitriao, hospede, prestador] = await Promise.all([
    prisma.user.create({
      data: {
        supabaseId: gestorSb.id,
        name: 'Carlos Gestor',
        email: 'gestor@staymet.app',
        role: 'GESTOR',
        phone: '(85) 99999-0001',
      },
    }),
    prisma.user.create({
      data: {
        supabaseId: proprietarioSb.id,
        name: 'Maria Proprietária',
        email: 'proprietario@staymet.app',
        role: 'PROPRIETARIO',
        phone: '(85) 99999-0002',
      },
    }),
    prisma.user.create({
      data: {
        supabaseId: anfitriaoSb.id,
        name: 'João Anfitrião',
        email: 'anfitriao@staymet.app',
        role: 'ANFITRIAO',
        phone: '(85) 99999-0003',
      },
    }),
    prisma.user.create({
      data: {
        supabaseId: hospedeSb.id,
        name: 'Ana Hóspede',
        email: 'hospede@staymet.app',
        role: 'HOSPEDE',
      },
    }),
    prisma.user.create({
      data: {
        supabaseId: prestadorSb.id,
        name: 'Pedro Limpeza',
        email: 'prestador@staymet.app',
        role: 'PRESTADOR',
        phone: '(85) 99999-0005',
      },
    }),
  ])

  console.log('✅ Usuários criados')

  // Properties
  const [prop1, prop2, prop3] = await Promise.all([
    prisma.property.create({
      data: {
        name: 'Casa de Praia Fortaleza',
        type: 'CASA_PRAIA',
        description: 'Linda casa com vista para o mar, perfeita para famílias.',
        address: 'Rua das Falésias, 123',
        city: 'Fortaleza',
        state: 'CE',
        zipCode: '60000-000',
        maxGuests: 8,
        wifiName: 'StayPraia_5G',
        wifiPassword: 'praia2024',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        rules: '🌊 Proibido festas.\n🚬 Proibido fumar dentro do imóvel.\n🐾 Animais de estimação permitidos.\n🔞 Proibido menores desacompanhados.\n🔇 Silêncio após 22h.',
        ownerId: proprietario.id,
        active: true,
      },
    }),
    prisma.property.create({
      data: {
        name: 'Apartamento Jericoacoara',
        type: 'APARTAMENTO',
        description: 'Apartamento moderno a 200m da praia.',
        address: 'Rua do Vilarejo, 45 - Apto 302',
        city: 'Jericoacoara',
        state: 'CE',
        zipCode: '62598-000',
        maxGuests: 4,
        wifiName: 'JeriApart',
        wifiPassword: 'jeri@2024',
        checkInTime: '15:00',
        checkOutTime: '10:00',
        rules: '🏖️ Não trazer areia para dentro.\n🤫 Respeitar vizinhos.\n🚫 Proibido festas.',
        ownerId: proprietario.id,
        active: true,
      },
    }),
    prisma.property.create({
      data: {
        name: 'Chalé Serra Guaramiranga',
        type: 'CASA_SERRA',
        description: 'Chalé aconchegante na serra com lareira e vista deslumbrante.',
        address: 'Estrada da Serra, Km 5',
        city: 'Guaramiranga',
        state: 'CE',
        zipCode: '62774-000',
        maxGuests: 6,
        wifiName: 'SerraChale',
        wifiPassword: 'chale@serra',
        checkInTime: '16:00',
        checkOutTime: '12:00',
        rules: '🔥 Lareira: use com responsabilidade.\n🌲 Não cortar árvores.\n🐄 Área rural: cuidado com animais.',
        ownerId: proprietario.id,
        active: true,
      },
    }),
  ])

  console.log('✅ Imóveis criados')

  // Vincular usuários às propriedades
  await Promise.all([
    prisma.propertyUser.create({ data: { propertyId: prop1.id, userId: gestor.id, role: 'GESTOR' } }),
    prisma.propertyUser.create({ data: { propertyId: prop1.id, userId: anfitriao.id, role: 'ANFITRIAO' } }),
    prisma.propertyUser.create({ data: { propertyId: prop1.id, userId: prestador.id, role: 'PRESTADOR' } }),
    prisma.propertyUser.create({ data: { propertyId: prop2.id, userId: gestor.id, role: 'GESTOR' } }),
    prisma.propertyUser.create({ data: { propertyId: prop3.id, userId: gestor.id, role: 'GESTOR' } }),
  ])

  // Reservas
  const checkInDate1 = new Date()
  checkInDate1.setDate(checkInDate1.getDate() - 2)
  const checkOutDate1 = new Date()
  checkOutDate1.setDate(checkOutDate1.getDate() + 5)

  const checkInDate2 = new Date()
  checkInDate2.setDate(checkInDate2.getDate() + 7)
  const checkOutDate2 = new Date()
  checkOutDate2.setDate(checkOutDate2.getDate() + 12)

  const [res1, res2] = await Promise.all([
    prisma.reservation.create({
      data: {
        propertyId: prop1.id,
        guestName: 'Família Silva',
        guestEmail: 'silva@email.com',
        guestPhone: '(11) 98765-4321',
        guestCount: 5,
        checkIn: checkInDate1,
        checkOut: checkOutDate1,
        status: 'EM_ANDAMENTO',
        totalAmount: 2800,
        platform: 'Airbnb',
        platformCode: 'HM-2024-001',
        accessCode: 'demo-silva-2024',
        notes: 'Hóspedes VIP — família com crianças',
      },
    }),
    prisma.reservation.create({
      data: {
        propertyId: prop2.id,
        guestName: 'Casal Oliveira',
        guestEmail: 'oliveira@email.com',
        guestPhone: '(21) 98765-0000',
        guestCount: 2,
        checkIn: checkInDate2,
        checkOut: checkOutDate2,
        status: 'CONFIRMADA',
        totalAmount: 1500,
        platform: 'Booking',
        platformCode: 'BK-2024-042',
        notes: 'Lua de mel',
      },
    }),
  ])

  console.log('✅ Reservas criadas')

  // Tarefas
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Limpeza pós check-in Família Silva',
        type: 'LIMPEZA',
        status: 'CONCLUIDA',
        propertyId: prop1.id,
        reservationId: res1.id,
        assigneeId: prestador.id,
        creatorId: gestor.id,
        scheduledFor: checkInDate1,
        completedAt: checkInDate1,
        notes: 'Limpeza completa realizada antes do check-in.',
      },
    }),
    prisma.task.create({
      data: {
        title: 'Reposição de amenities — Praia',
        type: 'OUTRO',
        status: 'PENDENTE',
        propertyId: prop1.id,
        assigneeId: prestador.id,
        creatorId: gestor.id,
        scheduledFor: tomorrow,
        notes: 'Repor shampoo, sabonete e papel higiênico.',
      },
    }),
    prisma.task.create({
      data: {
        title: 'Manutenção ar-condicionado — Apto Jeri',
        type: 'MANUTENCAO',
        status: 'EM_ANDAMENTO',
        propertyId: prop2.id,
        assigneeId: prestador.id,
        creatorId: gestor.id,
        scheduledFor: now,
        notes: 'Verificar filtro e gás.',
      },
    }),
    prisma.task.create({
      data: {
        title: 'Limpeza pré check-in Casal Oliveira',
        type: 'LIMPEZA',
        status: 'PENDENTE',
        propertyId: prop2.id,
        reservationId: res2.id,
        assigneeId: prestador.id,
        creatorId: gestor.id,
        scheduledFor: checkInDate2,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Vistoria geral — Chalé Serra',
        type: 'VISTORIA_ENTRADA',
        status: 'PENDENTE',
        propertyId: prop3.id,
        creatorId: gestor.id,
        scheduledFor: tomorrow,
      },
    }),
  ])

  console.log('✅ Tarefas criadas')

  // Inventário
  await Promise.all([
    // Prop1
    prisma.inventoryItem.create({ data: { propertyId: prop1.id, name: 'TV 50"', quantity: 2, condition: 'OTIMO' } }),
    prisma.inventoryItem.create({ data: { propertyId: prop1.id, name: 'Ar-condicionado', quantity: 3, condition: 'BOM' } }),
    prisma.inventoryItem.create({ data: { propertyId: prop1.id, name: 'Cadeiras de praia', quantity: 8, condition: 'BOM' } }),
    // Prop2
    prisma.inventoryItem.create({ data: { propertyId: prop2.id, name: 'Cama King', quantity: 1, condition: 'OTIMO' } }),
    prisma.inventoryItem.create({ data: { propertyId: prop2.id, name: 'Smart TV', quantity: 1, condition: 'OTIMO' } }),
    prisma.inventoryItem.create({ data: { propertyId: prop2.id, name: 'Ar-condicionado', quantity: 1, condition: 'REGULAR' } }),
    // Prop3
    prisma.inventoryItem.create({ data: { propertyId: prop3.id, name: 'Lareira', quantity: 1, condition: 'BOM' } }),
    prisma.inventoryItem.create({ data: { propertyId: prop3.id, name: 'Churrasqueira', quantity: 1, condition: 'BOM' } }),
    prisma.inventoryItem.create({ data: { propertyId: prop3.id, name: 'Fogão lenha', quantity: 1, condition: 'BOM' } }),
  ])

  // Parceiros
  const [partner1, partner2] = await Promise.all([
    prisma.partner.create({
      data: {
        name: 'Limpeza Cristal',
        category: 'LIMPEZA',
        phone: '(85) 98888-1234',
        description: 'Equipe especializada em imóveis de temporada.',
        active: true,
      },
    }),
    prisma.partner.create({
      data: {
        name: 'Delivery Sabor do Mar',
        category: 'DELIVERY',
        phone: '(85) 98888-5678',
        description: 'Frutos do mar frescos com entrega em domicílio.',
        active: true,
      },
    }),
  ])

  await Promise.all([
    prisma.propertyPartner.create({ data: { propertyId: prop1.id, partnerId: partner1.id } }),
    prisma.propertyPartner.create({ data: { propertyId: prop1.id, partnerId: partner2.id } }),
    prisma.propertyPartner.create({ data: { propertyId: prop2.id, partnerId: partner1.id } }),
  ])

  // Ocorrências
  await Promise.all([
    prisma.occurrence.create({
      data: {
        title: 'Torneira do banheiro pingando',
        description: 'A torneira da pia do banheiro principal está com vazamento leve.',
        priority: 'MEDIA',
        status: 'ABERTA',
        propertyId: prop1.id,
        reportedById: anfitriao.id,
      },
    }),
    prisma.occurrence.create({
      data: {
        title: 'Lâmpada queimada — quarto 2',
        description: 'A lâmpada do quarto 2 queimou. Necessário substituir por LED.',
        priority: 'BAIXA',
        status: 'EM_ANDAMENTO',
        propertyId: prop2.id,
        reportedById: gestor.id,
      },
    }),
  ])

  // Notificações
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: gestor.id,
        title: 'Nova reserva confirmada',
        body: 'Casal Oliveira confirmou reserva para Jericoacoara.',
        type: 'RESERVA',
        read: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: gestor.id,
        title: 'Ocorrência aberta',
        body: 'Torneira pingando na Casa de Praia Fortaleza.',
        type: 'OCORRENCIA',
        read: false,
      },
    }),
  ])

  console.log('✅ Seed concluído com sucesso!')
  console.log('')
  console.log('👤 Usuários criados:')
  console.log('   gestor@staymet.app / 123456')
  console.log('   proprietario@staymet.app / 123456')
  console.log('   anfitriao@staymet.app / 123456')
  console.log('   hospede@staymet.app / 123456')
  console.log('   prestador@staymet.app / 123456')
  console.log('')
  console.log('🏠 Imóveis: 3 | 📅 Reservas: 2 | ✅ Tarefas: 5 | ⚠️ Ocorrências: 2')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
