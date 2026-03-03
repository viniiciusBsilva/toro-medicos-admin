# Erro 401 no login (token?grant_type=password)

Quando aparece **401** em `.../auth/v1/token?grant_type=password`, o Supabase está **rejeitando** a requisição de login. Confira os itens abaixo.

---

## 1. Chave anon no `.env.local`

A **anon key** deve ser a chave real do projeto, não o placeholder.

- Abra no Supabase: **Project Settings** → **API**.
- Copie a chave **anon** (public) e cole no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ogytuggahlscsiuhuyun.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....  # ← a chave completa
```

- Se no `.env.local` ainda estiver `sua_anon_key_aqui`, o 401 é praticamente certo.
- Depois de alterar o `.env.local`, **reinicie o servidor** (`npm run dev`).

---

## 2. E-mail e senha do usuário

- 401 pode ser **credenciais inválidas** em alguns casos.
- Confirme no Supabase: **Authentication** → **Users** que o usuário existe e que o e-mail está confirmado (se o projeto exige confirmação).
- Teste com um usuário que você criou pelo próprio Supabase (Authentication → Users → Add user).

---

## 3. Auth habilitado no projeto

- Em **Authentication** → **Providers**, verifique se **Email** está habilitado.
- Se “Confirm email” estiver ativo, o usuário precisa ter clicado no link de confirmação antes de conseguir login.

---

## 4. URL do projeto

- A URL deve ser exatamente: `https://ogytuggahlscsiuhuyun.supabase.co` (sem barra no final).
- No `.env.local` use: `NEXT_PUBLIC_SUPABASE_URL=https://ogytuggahlscsiuhuyun.supabase.co`.

---

## Resumo rápido

| Causa comum              | O que fazer |
|--------------------------|-------------|
| Anon key errada/placeholder | Colar a anon key do Dashboard em `NEXT_PUBLIC_SUPABASE_ANON_KEY` e reiniciar o dev server. |
| Usuário não existe       | Criar usuário em Authentication → Users. |
| E-mail não confirmado    | Confirmar e-mail ou desativar “Confirm email” em Providers. |
| URL errada               | Ajustar `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`. |

Depois de qualquer alteração no `.env.local`, **sempre reinicie o `npm run dev`**.
