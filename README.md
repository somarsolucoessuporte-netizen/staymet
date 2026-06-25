# Staymet — Gestão Gourmet do Seu Imóvel

> *"O mordomo 5 estrelas do proprietário de imóvel de temporada."*

**Staymet** é uma plataforma PWA de gestão completa de imóveis de temporada (praia, serra, lazer). Não faz aluguel — faz a **gestão profissional** do imóvel depois que a reserva chegou.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Estilo | Tailwind CSS 4 |
| Banco de dados | Supabase (PostgreSQL) |
| ORM | Prisma 5 |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Deploy | Vercel |
| i18n | next-intl 4 (PT-BR + EN) |

---

## Personas

| Role | Acesso | Descrição |
|---|---|---|
| `GESTOR` | Total | Gerencia tudo: imóveis, equipe, financeiro |
| `PROPRIETARIO` | Leitura | Vê receita, reservas e relatórios dos seus imóveis |
| `ANFITRIAO` | Operacional | Check-in, check-out, vistoria, ocorrências |
| `HOSPEDE` | App dedicado | Wi-Fi, regras, solicitações, suporte |
| `PRESTADOR` | Tarefas | Recebe e conclui tarefas de limpeza/manutenção |

---

## Rodando Localmente

### 1. Clone e instale

```bash
git clone https://github.com/somarsolucoessuporte-netizen/staymet.git
cd staymet
npm install
```

### 2. Configure o Supabase

Crie um projeto em [supabase.com](https://supabase.com) e copie as credenciais para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha:
```env
DATABASE_URL=postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJETO].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUA_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SUA_SERVICE_ROLE_KEY]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configure o banco de dados

```bash
npm run db:push        # Aplica o schema no Supabase
npm run db:seed        # Popula com dados de demo
```

### 4. Inicie o servidor

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Dados de Demo (após seed)

| Usuário | Email | Senha |
|---|---|---|
| Gestor | gestor@staymet.app | 123456 |
| Proprietário | proprietario@staymet.app | 123456 |
| Anfitrião | anfitriao@staymet.app | 123456 |
| Hóspede | hospede@staymet.app | 123456 |
| Prestador | prestador@staymet.app | 123456 |

**3 imóveis** | **2 reservas** | **5 tarefas** | **3 parceiros** | **2 ocorrências**

---

## Acesso do Hóspede

O hóspede acessa via link único sem necessidade de senha:

```
http://localhost:3000/pt-BR/hospede/boas-vindas?code=demo-silva-2024
```

---

## Deploy na Vercel

1. Conecte o repositório no [vercel.com](https://vercel.com)
2. Adicione as variáveis de ambiente
3. Deploy automático a cada push em `main`

---

## Estrutura de Rotas

```
/pt-BR/login                          → Login
/pt-BR/gestor/dashboard               → Dashboard do Gestor
/pt-BR/gestor/properties              → Imóveis
/pt-BR/gestor/tarefas                 → Tarefas (Kanban)
/pt-BR/gestor/financeiro              → Financeiro
/pt-BR/gestor/equipe                  → Equipe
/pt-BR/gestor/ocorrencias             → Ocorrências
/pt-BR/proprietario/dashboard         → Dashboard do Proprietário
/pt-BR/anfitriao/dashboard            → Dashboard do Anfitrião
/pt-BR/anfitriao/checkin/[id]         → Vistoria de entrada
/pt-BR/anfitriao/checkout/[id]        → Vistoria de saída
/pt-BR/hospede/boas-vindas?code=...   → App do Hóspede
/pt-BR/prestador/tarefas              → Tarefas do Prestador
```

---

## Comandos Úteis

```bash
npm run dev           # Servidor de desenvolvimento
npm run build         # Build de produção
npm run db:push       # Sincronizar schema com o banco
npm run db:seed       # Popular banco com dados demo
npm run db:studio     # Abrir Prisma Studio
```

---

*Powered by **Somar Soluções Digitais***
