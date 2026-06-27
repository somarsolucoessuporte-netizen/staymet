# Gestão de Usuários — Staymet

## Perfis de acesso

| Role | Descrição | Quem cria |
|------|-----------|-----------|
| ADMINISTRADOR | Acesso total ao sistema. Pode acessar qualquer dashboard. | Manual (Supabase + Prisma) |
| GESTOR | Gerencia imóveis, equipe, tarefas e financeiro. | ADMINISTRADOR |
| PROPRIETARIO | Visualiza extratos e reservas dos seus imóveis. | ADMINISTRADOR |
| ANFITRIAO | Executa check-in/check-out e tarefas de campo. | ADMINISTRADOR ou GESTOR |
| PRESTADOR | Recebe e executa ordens de serviço/manutenção. | ADMINISTRADOR ou GESTOR |
| HOSPEDE | Acesso ao app do hóspede autenticado. | ADMINISTRADOR |

## Criar usuário via convite (produção)

### Admin (`/admin/usuarios`)
1. Acesse `/pt-BR/admin/dashboard` com login `admin@staymet.app`
2. Menu: "Usuários"
3. Botão "Convidar usuário"
4. Preencha: nome, e-mail, perfil (qualquer role), imóveis opcionais
5. O sistema cria o usuário no Supabase Auth + registro no banco Prisma
6. Uma senha temporária é exibida na tela — repasse ao usuário
7. O usuário deve trocar a senha no primeiro acesso

### Gestor (`/gestor/equipe`)
- Gestor pode convidar apenas **ANFITRIAO** e **PRESTADOR**
- Mesma interface, apenas as funções permitidas aparecem

## API de convite

```
POST /api/users/invite
Authorization: cookie Supabase (usuário autenticado como ADMINISTRADOR ou GESTOR)

Body:
{
  "email": "usuario@email.com",
  "name": "Nome Completo",
  "role": "ANFITRIAO",
  "propertyIds": ["prop_abc", "prop_xyz"]  // opcional
}

Response 200:
{
  "success": true,
  "user": { "id": "...", "email": "...", "role": "..." },
  "tempPassword": "abc123A1!"
}
```

## Criar usuário de forma manual (desenvolvimento/seed)

Use o script de seed ou acesse diretamente o Supabase Dashboard:

```bash
# Via seed (se implementado)
npm run db:seed

# Via Prisma Studio
npx prisma studio
```

## Login padrão (ambientes de desenvolvimento)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@staymet.app | (definido no Supabase) |
| Gestor | gestor@staymet.app | (definido no Supabase) |
| Proprietário | proprietario@staymet.app | (definido no Supabase) |
| Anfitrião | anfitriao@staymet.app | (definido no Supabase) |
| Prestador | prestador@staymet.app | (definido no Supabase) |
| Hóspede | hospede@staymet.app | (definido no Supabase) |

## Rotas por perfil

| Perfil | Dashboard | URL base |
|--------|-----------|----------|
| Administrador | Admin Panel | `/pt-BR/admin/dashboard` |
| Gestor | Painel Gestor | `/pt-BR/gestor/dashboard` |
| Proprietário | Portal Proprietário | `/pt-BR/proprietario/dashboard` |
| Anfitrião | App Anfitrião | `/pt-BR/anfitriao/dashboard` |
| Prestador | App Prestador | `/pt-BR/prestador/dashboard` |
| Hóspede | App Hóspede | `/pt-BR/hospede/boas-vindas` |

### Acesso admin a outros dashboards
O ADMINISTRADOR pode acessar qualquer rota de qualquer perfil diretamente na URL. Todos os layouts incluem `ADMINISTRADOR` na lista de roles permitidos.

## App do Hóspede (link mágico)

Hóspedes sem conta podem acessar o app via link mágico:
```
/acesso/hospede/[token]
```
Essas rotas são completamente públicas (sem auth) e são bypassed pelo middleware.
