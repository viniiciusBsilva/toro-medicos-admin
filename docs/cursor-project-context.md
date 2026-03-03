# Tôro Médicos — Admin Panel · Prompt de Contexto para o Cursor

> **Instruções de uso:** Coloque este arquivo como `.cursor/rules` ou `CONTEXT.md` na raiz do projeto. Ele define o contexto completo do sistema para que o Cursor entenda o projeto antes de qualquer desenvolvimento.

---

## O que é este projeto

Painel administrativo web do **Tôro Médicos**, plataforma de telemedicina brasileira. O painel é usado pela equipe interna para gerenciar médicos, pacientes, consultas, finanças e configurações da plataforma.

Existe um **app mobile** já em produção (Flutter + Supabase) atendendo médicos e pacientes. O admin é um projeto separado que consome o **mesmo banco Supabase** do app.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 14+ (App Router)** |
| Linguagem | **TypeScript** |
| Estilização | **Tailwind CSS** |
| Componentes UI | **shadcn/ui** |
| Backend / Banco | **Supabase** (PostgreSQL + Auth + Storage) |
| Gráficos | **Recharts** (via shadcn/ui charts) |
| Ícones | **Lucide React** |
| Formulários | **React Hook Form + Zod** |
| Estado global | **React Context** (para sessão e permissões) |

**Regras de stack:**
- Não instalar bibliotecas fora desta lista sem justificativa
- Sempre usar **TypeScript estrito** — sem `any`
- Componentes shadcn/ui são copiados via CLI (`npx shadcn@latest add`) — não criar do zero o que já existe neles
- Server Actions do Next.js para operações com Supabase (evitar criar rotas `/api` desnecessárias)

---

## Banco de Dados (Supabase)

**URL:** `https://ogytuggahlscsiuhuyun.supabase.co`

**Importante:** usar `SUPABASE_SERVICE_ROLE_KEY` apenas em Server Components e Server Actions (nunca no cliente). A `SUPABASE_ANON_KEY` é usada apenas para autenticação no lado do cliente.

### Todas as tabelas (schema `public`)

```
user                → dados gerais do usuário (nome, cpf, telefone, email)
user_medico         → perfil do médico (crm, especialidade, documentos, status, valor)
user_paciente       → perfil do paciente (dados pessoais)
endereco            → endereço por usuário
avaliacoes          → avaliações de pacientes sobre médicos
consulta            → agendamentos (status, pagamento, tipo)
configuracoes       → configurações globais da plataforma (chave/valor)
user_admin          → usuários com acesso ao painel admin
admin_permissoes    → permissões granulares por usuário admin
```

### Relações principais

```
auth.users (Supabase Auth)
  └── public.user (id = auth.uid())
        ├── user_medico    (id_user → user.id)
        │     └── avaliacoes (medico_id → user_medico.id)
        │     └── consulta   (id_medico → user_medico.id)
        ├── user_paciente  (id_user → user.id)
        │     └── consulta   (id_paciente → user_paciente.id)
        ├── endereco       (id_user → user.id)
        └── user_admin     (id_user → user.id)
              └── admin_permissoes (id_admin → user_admin.id)
```

### Tabela `user_admin`

```sql
id         uuid PK (gen_random_uuid)
id_user    uuid FK → user.id (ON DELETE CASCADE)
created_at timestamptz
```

### Tabela `admin_permissoes`

```sql
id                          bigint PK (identity)
id_admin                    uuid FK → user_admin.id (ON DELETE CASCADE)
gerenciar_equipe_adm        boolean  -- convidar/remover admins e editar permissões
editar_num_wpp_suporte      boolean  -- editar WhatsApp de suporte em Configurações
acessar_modulo_financeiro   boolean  -- módulo Gestão Financeira
acessar_modulo_paciente     boolean  -- módulo Pacientes
acessar_modulo_medico       boolean  -- módulo Médicos
validar_cadastro_medicos    boolean  -- aprovar/recusar cadastro de médico
acessar_modulo_dashboard    boolean  -- Dashboard com KPIs
created_at                  timestamptz
```

**Regra crítica de permissões:** `null` e `false` são equivalentes a acesso negado. Apenas `=== true` libera acesso. Sempre verificar `permissao === true`, nunca truthy.

### Tabela `configuracoes`

Armazena configurações globais no padrão chave/valor:

| chave | valor padrão | uso |
|---|---|---|
| `whatsapp_suporte` | `""` | Número exibido no app para suporte |
| `percentual_reembolso_cancelamento` | `"50"` | % de reembolso em cancelamentos < 24h |

---

## Autenticação

- **Supabase Auth** com e-mail + senha
- Após login: verificar se o usuário tem registro em `user_admin`. Se não → redirecionar para página de acesso negado
- Se sim → carregar `admin_permissoes` e armazenar no contexto global da sessão
- Usar **Supabase SSR** (`@supabase/ssr`) para gerenciar sessão em Server e Client Components

---

## Estrutura de pastas esperada (Next.js App Router)

```
/src
  /app
    /login                  → página de login
    /(admin)                → layout com sidebar (protegido por auth)
      /dashboard
      /pacientes
        /[id]
      /medicos
        /[id]
      /financeiro
      /consultas
        /[id]
      /notificacoes
      /configuracoes
        /equipe
    /acesso-negado          → página pública para acesso negado
  /components
    /ui                     → componentes shadcn/ui (gerados pelo CLI)
    /admin                  → componentes específicos do admin
      /sidebar.tsx
      /topbar.tsx
      /permissao-guard.tsx  → wrapper que verifica permissão antes de renderizar
  /lib
    /supabase
      /server.ts            → cliente Supabase para Server Components
      /client.ts            → cliente Supabase para Client Components
    /types
      /database.ts          → tipos gerados do schema Supabase
      /permissions.ts       → tipo AdminPermissoes
  /hooks
    /use-permissoes.ts      → hook para acessar permissões do contexto
  /context
    /admin-context.tsx      → contexto global: admin logado + permissões
```

---

## Design System

**Identidade visual:** Material Design adaptado à marca Tôro Médicos.

### Cores principais (usar como variáveis Tailwind)

```js
// tailwind.config.ts — extend colors
colors: {
  primary:     '#BA0001',
  'on-primary':'#FFFFFF',
  background:  '#F6F7F9',
  surface:     '#FFFFFF',
  outline:     '#E1EAEC',
  'text-primary':   '#0E1015',
  'text-secondary': '#6B7280',
  'sidebar-active-bg':   '#FDF0F0',
  'sidebar-active-text': '#BA0001',
}
```

### Tipografia
- Família: **Poppins** (Google Fonts)
- Título de página: 24px / 700
- Título de seção: 20px / 700
- Label de campo: 14px / 600
- Texto padrão: 14–16px / 400

### Layout shell

```
┌──────────────┬─────────────────────────────────────────────────┐
│              │  Topbar: título da página + botão de ação        │
│  Sidebar     ├─────────────────────────────────────────────────┤
│  240px fixo  │                                                  │
│  bg white    │   Área de conteúdo (padding 32px, scroll vert.)  │
│              │                                                  │
└──────────────┴─────────────────────────────────────────────────┘
```

- **Sidebar:** 240px, fundo `#FFFFFF`, borda direita `1px #E1EAEC`
- **Item ativo da sidebar:** bg `#FDF0F0`, texto/ícone `#BA0001`
- **Topbar:** título H1 à esquerda + botão vermelho à direita (quando houver ação primária)

### Componentes padrão

**Botão primário:**
- bg `#BA0001`, texto branco, border-radius 10px, padding `12px 24px`

**Input em modo leitura (read-only):**
- bg `#F6F7F9`, sem borda visível, ícone lápis `#6B7280` à direita

**Input em modo edição:**
- bg `#FFFFFF`, borda `1.5px #BA0001`, border-radius 10px

**Card/seção de conteúdo:**
- bg `#FFFFFF`, borda `1px #E1EAEC`, border-radius 14px, padding 24px

**Chips de status:**
| Estado | bg | texto |
|---|---|---|
| Ativo / Início imediato | `#E8F5E9` | `#388E3C` |
| Em consulta | `#FFF3E0` | `#E65100` |
| Pendente / Inativo | `#FFCDD2` | `#B71C1C` |
| Pago | `#CCF0EA` | verde escuro |
| Em aberto | `#FFECB3` | marrom |
| Atrasado | `#FFCDD2` | vermelho |

---

## Módulos e permissões

| Módulo | Rota | Permissão necessária |
|---|---|---|
| Dashboard | `/dashboard` | `acessar_modulo_dashboard` |
| Pacientes | `/pacientes` | `acessar_modulo_paciente` |
| Médicos | `/medicos` | `acessar_modulo_medico` |
| Aprovar médico | `/medicos/:id/aprovar` | `validar_cadastro_medicos` |
| Financeiro | `/financeiro` | `acessar_modulo_financeiro` |
| Consultas | `/consultas` | livre |
| Notificações | `/notificacoes` | livre |
| Configurações | `/configuracoes` | livre (seções internas restritas) |
| Gerenciar equipe | `/configuracoes/equipe` | `gerenciar_equipe_adm` |
| Editar WhatsApp | campo em `/configuracoes` | `editar_num_wpp_suporte` |

---

## Regras de negócio resumidas

### Médicos
- Recém-cadastrados chegam com `status_plantao = 'pendente'`
- Aprovação → `status_plantao = 'inicio_imediato'`
- Recusa → `status_plantao = 'inativo'`

### Cancelamento de consultas
- Cancelamento com **≥ 24h** → reembolso de **100%**
- Cancelamento com **< 24h** → reembolso de `percentual_reembolso_cancelamento`% (lido de `configuracoes`)
- Cancelamento pelo admin → reembolso definido manualmente

### Configurações
- `whatsapp_suporte` e `percentual_reembolso_cancelamento` são editados inline
- Validação do percentual: inteiro entre 0 e 100

---

## Padrões de código

### Nomenclatura
- Arquivos e pastas: `kebab-case`
- Componentes React: `PascalCase`
- Funções e variáveis: `camelCase`
- Colunas e tabelas do banco: `snake_case` (seguir convenção do Supabase)

### Supabase no Next.js
- **Server Components / Server Actions:** usar `createClient()` de `/lib/supabase/server.ts`
- **Client Components:** usar `createClient()` de `/lib/supabase/client.ts`
- Nunca usar `SERVICE_ROLE_KEY` em arquivos client-side
- Nunca expor variáveis de ambiente sem prefixo `NEXT_PUBLIC_` para o cliente

### Verificação de permissão (padrão obrigatório)
```typescript
// CORRETO — verificar === true explícito
if (permissoes.acessar_modulo_financeiro === true) { ... }

// ERRADO — truthy não funciona (null seria permissão indevida)
if (permissoes.acessar_modulo_financeiro) { ... }
```

### Estrutura de resposta de Server Actions
```typescript
type ActionResult<T> = {
  data: T | null
  error: string | null
}
```

### Tratamento de erros
- Sempre mostrar toast de feedback (sucesso verde / erro vermelho)
- Nunca expor mensagens técnicas do banco para o usuário
- Logar erro completo no servidor

---

## O que NÃO fazer

- Não criar tabelas, views ou funções no Supabase pelo código — apenas via SQL Editor do Dashboard
- Não usar `any` em TypeScript
- Não criar APIs REST (`/api/...`) quando Server Actions resolvem
- Não duplicar lógica de permissão — usar sempre o hook `usePermissoes()` ou o `PermissaoGuard`
- Não modificar as tabelas `user`, `user_medico`, `user_paciente` — são do app mobile
- Não instalar bibliotecas de UI além do shadcn/ui sem aprovação

---

## Documentação de referência

Todos os detalhes completos estão nos arquivos `.md` do projeto:

| Arquivo | Conteúdo |
|---|---|
| `admin-design-system.md` | Tokens, componentes, layout, estados visuais |
| `admin-ux-flows.md` | Fluxos de navegação, interações, empty states, responsividade |
| `admin-business-rules.md` | Regras de negócio, DDL das tabelas, RLS, queries padrão |
| `design_system_toro_medicos.md` | Design system original do app mobile (referência de identidade visual) |
| `supabase-schema-esperado.md` | Schema completo do banco com todas as colunas |
| `supabase-banco-toro.md` | Detalhes de conexão e acesso ao Supabase |
| `principios-desenvolvimento.md` | Princípios gerais de arquitetura e boas práticas |
