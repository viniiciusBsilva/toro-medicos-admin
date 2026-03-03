# Tôro Médicos — Admin Panel Design System

## 1) Visão Geral

Painel administrativo web do **Tôro Médicos**. Utilizado pela equipe interna para gerenciar médicos, pacientes, consultas e configurações da plataforma. Diferente do app mobile, o admin é uma interface desktop-first com sidebar fixa e layout de conteúdo expansivo.

---

## 2) Identidade Visual (Admin)

### 2.1 Cores base
| Token | Valor | Uso |
|---|---|---|
| `color.background` | `#F6F7F9` | Fundo geral da área de conteúdo |
| `color.surface` | `#FFFFFF` | Cards, modais, painéis |
| `color.sidebar.bg` | `#FFFFFF` | Fundo da sidebar |
| `color.primary` | `#BA0001` | Ações primárias, links ativos, botões |
| `color.onPrimary` | `#FFFFFF` | Texto sobre cor primária |
| `color.text.primary` | `#0E1015` | Títulos e texto principal |
| `color.text.secondary` | `#6B7280` | Subtítulos, labels, metadados |
| `color.outline` | `#E1EAEC` | Bordas de inputs e divisores |
| `color.sidebar.active.bg` | `#FDF0F0` | Background do item ativo na sidebar |
| `color.sidebar.active.text`| `#BA0001` | Texto/ícone do item ativo na sidebar |
| `color.sidebar.text` | `#0E1015` | Texto/ícone do item inativo |

### 2.2 Tipografia
- **Família:** Poppins
- **Título de página (h1):** 24px / 700 / `#0E1015`
- **Título de seção (h2):** 20px / 700 / `#0E1015`
- **Label de campo:** 14px / 600 / `#0E1015`
- **Valor de input / texto padrão:** 14–16px / 400 / `#0E1015`
- **Texto auxiliar / hint:** 12–13px / 400 / `#6B7280`
- **Texto de sidebar (ativo):** 14px / 600 / `#BA0001`
- **Texto de sidebar (inativo):** 14px / 500 / `#0E1015`

---

## 3) Layout Geral (Shell)

```
┌─────────────┬────────────────────────────────────────────────┐
│             │  TOPBAR (título da página + ação principal)     │
│   SIDEBAR   ├────────────────────────────────────────────────┤
│   (fixo,    │                                                │
│   240px)    │          ÁREA DE CONTEÚDO                      │
│             │          (scroll vertical)                      │
│             │                                                │
└─────────────┴────────────────────────────────────────────────┘
```

### 3.1 Sidebar
- **Largura:** 240px, fixo à esquerda
- **Background:** `#FFFFFF`
- **Borda direita:** 1px `#E1EAEC`
- **Logo Tôro Médicos:** topo, com ícone de menu hambúrguer para colapsar
- **Nav items:** ícone outline + label, padding 12px 20px, border-radius 8px
- **Item ativo:** background `#FDF0F0`, cor `#BA0001`, ícone preenchido
- **Grupos de nav:**
  - Principal: Dashboard, Pacientes, Médicos, Gestão financeira, Consultas
  - Secundário (bottom): Notificações, Configurações
  - Rodapé: botão logout (ícone quadrado com seta), "Powered by Fraktal Softwares"

### 3.2 Topbar (por página)
- **Título:** Headline Medium (24px / 700) à esquerda
- **Ação primária:** botão vermelho, canto superior direito
  - Ex.: "Gerenciar equipe →", "Adicionar médico", etc.
- **Height:** ~72px, sem background destacado (integrado ao conteúdo)

### 3.3 Área de conteúdo
- **Padding:** 32px
- **Max width do conteúdo:** ~900px centralizando em telas grandes
- **Scroll:** apenas vertical no conteúdo

---

## 4) Componentes

### 4.1 Botão Primário (Admin)
- **Background:** `#BA0001`
- **Texto:** `#FFFFFF`, 14px / 600
- **Border radius:** 10px
- **Padding:** 12px 24px
- **Com ícone/seta:** label + `→` à direita
- **Hover:** leve escurecimento (`#9A0001`)

### 4.2 Input de visualização (somente leitura)
Usado em campos como E-mail e campos configuráveis ainda não em edição.
- **Background:** `#F6F7F9`
- **Borda:** nenhuma visível (ou `1px #E1EAEC` muito sutil)
- **Border radius:** 10px
- **Padding:** 14px 16px
- **Texto:** 14–16px / 400 / `#0E1015`
- **Ícone de edição (lápis):** `#6B7280`, alinhado à direita, clicável

### 4.3 Input editável (em foco/edição)
- **Background:** `#FFFFFF`
- **Borda:** `1.5px #BA0001`
- **Border radius:** 10px

### 4.4 Seção / Card de grupo
Agrupa campos relacionados com título de seção acima.
- **Background:** `#FFFFFF`
- **Border:** `1px #E1EAEC`
- **Border radius:** 14px
- **Padding:** 24px
- **Título da seção:** 18–20px / 700, margem inferior 16px

### 4.5 Avatar / Foto de perfil
- **Tamanho:** 96–110px, circular
- **Borda:** 2px `#E1EAEC` ou sutil escura
- **Botão "Adicionar imagem":** botão primário vermelho, menor (28px altura), ícone upload + label, border-radius 20px
- **Link "Remover foto":** texto simples, `#6B7280`, 13px, centralizado abaixo do botão

### 4.6 Link de ação em vermelho
- **Uso:** "Recuperar senha", links secundários de ação destrutiva ou de fluxo
- **Cor:** `#BA0001`
- **Tamanho:** 14px / 500
- **Sem underline padrão; underline no hover**

### 4.7 Texto auxiliar / hint
- **Uso:** explicações abaixo de campos (ex.: "Exemplo: Se 50%, o paciente recebe...")
- **Ícone:** ⓘ à esquerda, `#6B7280`
- **Texto:** 12px / 400 / `#6B7280`

### 4.8 Tabela de dados
Usada em Pacientes, Médicos, Consultas, Gestão Financeira.
- **Header:** background `#F6F7F9`, texto 13px / 600 / `#6B7280`, uppercase opcional
- **Linha:** 52px altura mínima, borda inferior `#E1EAEC`
- **Hover de linha:** background `#F9FAFB`
- **Ações na linha:** ícones (editar, ver, excluir), visíveis no hover ou sempre
- **Paginação:** abaixo da tabela, alinhada à direita

### 4.9 Badge / Status chip (tabelas e listas)
Reutiliza os chips do app com adaptações:
- **Ativo/Disponível:** background `#E8F5E9`, texto `#388E3C`
- **Em consulta:** background `#FFF3E0`, texto `#E65100`
- **Inativo/Cancelado:** background `#FFCDD2`, texto `#B71C1C`
- **Pago:** background `#CCF0EA`, texto verde escuro
- **Em aberto:** background `#FFECB3`, texto marrom
- **Atrasado:** background `#FFCDD2`, texto vermelho

### 4.10 Sidebar item de navegação
```
[ícone outline] Label da Página
```
- **Padding:** 10px 20px
- **Border radius:** 8px
- **Gap ícone-texto:** 12px
- **Ícone tamanho:** 20px
- **Estado ativo:** bg `#FDF0F0`, cor `#BA0001`, fonte 600
- **Estado inativo:** cor `#0E1015`, fonte 500
- **Hover:** bg `#F6F7F9`

---

## 5) Padrão de Página (Template)

Toda página do admin segue esta estrutura:

```
[Título da página]                    [Botão de ação principal]
──────────────────────────────────────────────────────────────

[Seção 1]
┌─────────────────────────────────────────────────────────┐
│ Título da seção                                         │
│                                                         │
│ Label do campo                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ valor ou placeholder                         [✏️]  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

[Seção 2]
...
```

---

## 6) Espaçamento

| Contexto | Valor |
|---|---|
| Padding geral da página | 32px |
| Padding interno de card/seção | 24px |
| Gap entre seções | 24px |
| Gap entre label e input | 8px |
| Gap entre itens de sidebar | 4px |

---

## 7) Ícones

- **Biblioteca:** Lucide Icons (outline style)
- **Tamanho padrão:** 20px na sidebar, 18px em inputs, 16px em chips
- **Cor padrão:** `#6B7280` (inativo), `#BA0001` (ativo/primário), `#0E1015` (ênfase)
- **Ícones por seção de nav:**
  - Dashboard → `LayoutDashboard`
  - Pacientes → `UserPlus`
  - Médicos → `UserCircle`
  - Gestão financeira → `CircleDollarSign`
  - Consultas → `FileText`
  - Notificações → `Bell`
  - Configurações → `Settings`
  - Logout → `LogOut`

---

## 8) Estados de formulário

| Estado | Comportamento visual |
|---|---|
| Padrão (read-only) | Fundo `#F6F7F9`, sem borda, ícone lápis cinza |
| Editável | Fundo `#FFFFFF`, borda `#BA0001` |
| Salvo com sucesso | Toast/snackbar verde, campo volta ao estado padrão |
| Erro | Borda vermelha no input, texto auxiliar em `#D92D20` |
| Loading | Spinner sobre o botão de salvar |
