# Tôro Médicos — Admin UX Flows

## 1) Visão Geral das Telas

O painel admin possui as seguintes páginas principais, acessadas pela sidebar:

| Página | Rota sugerida | Descrição |
|---|---|---|
| Dashboard | `/dashboard` | Visão geral com KPIs e atividades recentes |
| Pacientes | `/pacientes` | Listagem, busca e gestão de pacientes |
| Médicos | `/medicos` | Listagem, aprovação e gestão de médicos |
| Gestão Financeira | `/financeiro` | Receitas, repasses, status de pagamento |
| Consultas | `/consultas` | Histórico e status de todas as consultas |
| Notificações | `/notificacoes` | Central de notificações do sistema |
| Configurações | `/configuracoes` | Perfil admin, senha, WhatsApp suporte, regras de cancelamento |

---

## 2) Fluxo — Dashboard

**Objetivo:** visão executiva rápida do estado da plataforma.

**Elementos esperados:**
- Cards de KPI: total de médicos ativos, total de pacientes, consultas hoje, receita do mês
- Gráfico de consultas por período (linha ou barra)
- Lista das consultas mais recentes (status + médico + paciente)
- Médicos com status "em plantão" agora
- Atalhos rápidos para ações comuns

**Comportamento:**
- Dados carregados ao entrar na página (loading skeleton em cada card)
- Filtro de período (hoje, 7d, 30d, personalizado) no canto superior direito

---

## 3) Fluxo — Médicos

### 3.1 Lista de médicos
- Tabela com: foto, nome, especialidade, CRM, status, data de cadastro, ações
- Filtros: por especialidade, por status (ativo/inativo/pendente)
- Busca: por nome ou CRM
- Ação principal: **"Adicionar médico"** (botão vermelho, topbar)

### 3.2 Detalhe / Edição de médico
- Acessado ao clicar em uma linha ou no ícone de edição
- Seções: Dados pessoais, Dados profissionais (CRM, RQE, especialidade), Documentos (CNH, foto, CRM digital), Configurações (valor consulta, status plantão)
- Botão "Salvar alterações" primário no final
- Botão "Desativar médico" secundário (ação destrutiva com modal de confirmação)

### 3.3 Aprovação de médico
- Médicos cadastrados pelo app chegam com status `pendente`
- Admin revisa documentos e ativa ou recusa
- Modal de confirmação ao ativar/recusar com campo opcional de justificativa (em recusa)

---

## 4) Fluxo — Pacientes

### 4.1 Lista de pacientes
- Tabela: nome, CPF (mascarado), telefone, data de cadastro, total de consultas, status
- Busca por nome ou CPF
- Filtro por status

### 4.2 Detalhe de paciente
- Dados pessoais (nome, CPF, e-mail, telefone, data nascimento, sexo, nome da mãe, endereço)
- Histórico de consultas (tabela compacta com link para detalhes)
- Representante legal (se houver)
- Sem edição direta pelo admin por padrão (apenas visualização, exceto em casos especiais)

---

## 5) Fluxo — Gestão Financeira

### 5.1 Visão geral financeira
- KPIs: receita bruta do período, repasses pendentes, valor em disputa (cancelamentos)
- Tabela de transações: consulta, médico, paciente, valor, status pagamento, data
- Filtros: período, status pagamento (Pago / Em aberto / Atrasado)
- Exportar relatório (CSV ou PDF)

### 5.2 Gerenciar repasse
- Marcar pagamento como pago / enviado ao médico
- Ver comprovante (se houver upload)

---

## 6) Fluxo — Consultas

### 6.1 Lista de consultas
- Tabela: data/hora, paciente, médico, tipo (Consulta/Retorno), status, valor, status pagamento
- Filtros: período, status da consulta, tipo
- Busca por nome de médico ou paciente

### 6.2 Detalhe de consulta
- Todos os dados da consulta
- Linha do tempo: agendado → realizado / cancelado
- Opções admin: cancelar consulta, marcar como realizada, processar reembolso

---

## 7) Fluxo — Configurações

### 7.1 Perfil do administrador
**Campos:**
- Foto de perfil (upload circular, botão "Adicionar imagem", link "Remover foto")
- E-mail (somente leitura, com ícone de edição → abre modal para alteração)

**Comportamento:**
- Foto: ao clicar em "Adicionar imagem" → abre file picker, preview imediato, salvo no Supabase Storage
- E-mail: protegido, alteração requer confirmação por e-mail atual

### 7.2 Alterar senha
**Campos:**
- Senha atual (mascarada, com ícone lápis para ativar edição)
- Link "Recuperar senha" → dispara fluxo de reset por e-mail

**Comportamento:**
- Ao clicar no lápis: abre campos de nova senha + confirmar senha
- Botão "Salvar" aparece ao editar
- Feedback de sucesso: snackbar verde

### 7.3 WhatsApp do suporte
**Campo:**
- Número do WhatsApp (formato mascarado, ex.: (99) 99999-9999)
- Ícone lápis para editar inline

**Uso do negócio:**
- Número exibido no app do paciente/médico quando aciona suporte
- Salvo em tabela `configuracoes` no Supabase

### 7.4 Reembolso em cancelamentos
**Campo:**
- Percentual de reembolso (%) quando cancelado em menos de 24h
- Hint: "Exemplo: Se 50%, o paciente recebe metade do valor caso cancele com menos de 24h de antecedência."
- Ícone lápis para editar inline

**Uso do negócio:**
- Regra aplicada automaticamente na lógica de cancelamento no app
- Salvo em tabela `configuracoes` no Supabase

### 7.5 Gerenciar equipe
- Acessado pelo botão "Gerenciar equipe →" no topbar da página de Configurações
- Lista de usuários admin com nome, e-mail, papel (admin/suporte) e status
- Ação: convidar novo membro (por e-mail), remover acesso

---

## 8) Padrões de Interação

### Edição inline
Campos em modo "visualização" têm ícone de lápis que ativa edição direta.
- Estado: read-only (fundo `#F6F7F9`) → edição (fundo `#FFFFFF`, borda `#BA0001`)
- Confirmar com Enter ou botão "Salvar"
- Cancelar com Escape ou "Cancelar"

### Modais de confirmação
Para ações irreversíveis (desativar médico, cancelar consulta, remover foto):
- Overlay escuro (scrim)
- Card modal centralizado, max-width 480px
- Título: ação a ser confirmada
- Texto: consequência da ação
- Botões: "Cancelar" (secundário) + "Confirmar" (primário, vermelho)

### Toasts / Snackbars
- **Sucesso:** fundo `#12B76A`, texto branco, ícone check
- **Erro:** fundo `#D92D20`, texto branco, ícone X
- **Info:** fundo `#0E1015`, texto branco
- Posição: canto inferior direito
- Auto-dismiss: 3 segundos

### Loading states
- **Página inicial / dados:** skeleton loaders nos cards e tabelas
- **Botão de ação:** substitui label por spinner no botão, desabilita clique duplo
- **Upload de imagem:** barra de progresso circular na foto de perfil

### Estados vazios (empty state)
- Ilustração + título + subtítulo
- Ex.: "Nenhum médico encontrado" com botão "Adicionar médico"
- Ex.: "Sem consultas no período" com sugestão de ampliar filtro

---

## 9) Navegação e Hierarquia

```
Admin Shell
├── Dashboard (home)
├── Pacientes
│   ├── Lista
│   └── Detalhe/:id
├── Médicos
│   ├── Lista
│   ├── Detalhe/:id
│   └── Aprovação/:id
├── Gestão Financeira
│   ├── Visão geral
│   └── Detalhe de transação/:id
├── Consultas
│   ├── Lista
│   └── Detalhe/:id
├── Notificações
└── Configurações
    ├── Perfil
    ├── Segurança
    ├── Suporte
    ├── Regras de cancelamento
    └── Equipe
```

---

## 10) Responsividade

O admin é **primariamente desktop** (1280px+). Comportamento em telas menores:
- **< 1024px:** sidebar colapsada por padrão (apenas ícones), expansível com hambúrguer
- **< 768px:** não recomendado (redirecionar para versão desktop ou bloquear acesso)
