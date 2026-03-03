"use server";

/**
 * Verifica se as variáveis do Supabase estão definidas (sem expor os valores).
 * Use apenas em desenvolvimento para diagnosticar 401 no login.
 */
export async function verificarConfigSupabase(): Promise<{
  urlDefinida: boolean;
  urlCorreta: boolean;
  anonKeyDefinida: boolean;
  anonKeyPareceValida: boolean;
  mensagem: string;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const urlDefinida = !!url?.trim();
  const urlCorreta = url?.trim() === "https://ogytuggahlscsiuhuyun.supabase.co";
  const anonKeyDefinida = !!anonKey?.trim();
  const anonKeyPareceValida =
    !!anonKey?.trim() &&
    anonKey.startsWith("eyJ") &&
    anonKey.length > 100 &&
    anonKey !== "sua_anon_key_aqui";

  let mensagem = "";
  if (!urlDefinida) mensagem = "NEXT_PUBLIC_SUPABASE_URL não está definida no .env.local.";
  else if (!urlCorreta) mensagem = "NEXT_PUBLIC_SUPABASE_URL não está igual a https://ogytuggahlscsiuhuyun.supabase.co";
  else if (!anonKeyDefinida) mensagem = "NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida no .env.local.";
  else if (!anonKeyPareceValida) mensagem = "NEXT_PUBLIC_SUPABASE_ANON_KEY está vazia, é placeholder (sua_anon_key_aqui) ou não parece um JWT válido. Copie a chave 'anon' (public) em Supabase → Project Settings → API.";
  else mensagem = "Variáveis carregadas. Se o login ainda falhar, confira no Supabase: Authentication → Providers (Email ativo) e se o usuário existe em Authentication → Users.";

  return {
    urlDefinida,
    urlCorreta,
    anonKeyDefinida,
    anonKeyPareceValida,
    mensagem,
  };
}
