"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET_ARQUIVOS = "arquivos";
const PREFIX_DOCUMENTOS = "documentos";

export type PerfilAdmin = {
  id: string;
  email: string;
  nome: string | null;
  profile_image: string | null;
};

export type ConfiguracoesValores = {
  whatsapp_suporte: string | null;
  percentual_reembolso_24h: number | null;
};

/** Perfil do admin logado (user + public.user). */
export async function getPerfilAdmin(): Promise<PerfilAdmin | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.id) return null;
    const service = createServiceClient();
    const { data: u, error } = await service
      .from("user")
      .select("id, email, nome, profile_image")
      .eq("id", authUser.id)
      .maybeSingle();
    if (error || !u) return null;
    const row = u as { id: string; email: string | null; nome: string | null; profile_image: string | null };
    return {
      id: row.id,
      email: row.email ?? authUser.email ?? "",
      nome: row.nome ?? null,
      profile_image: row.profile_image ?? null,
    };
  } catch {
    return null;
  }
}

/** Retorna o id da configuração financeira ativa (vigência atual). */
async function getFinanceiroConfigAtivoId(
  service: ReturnType<typeof createServiceClient>
): Promise<string | null> {
  const now = new Date().toISOString();
  const { data, error } = await service
    .from("financeiro_config")
    .select("id")
    .eq("ativa", true)
    .lte("vigencia_inicio", now)
    .or(`vigencia_fim.is.null,vigencia_fim.gte.${now}`)
    .order("vigencia_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

/** Configurações gerais: whatsapp da tabela configuracoes; taxa_reembolso de financeiro_config. */
export async function getConfiguracoes(): Promise<ConfiguracoesValores> {
  try {
    const service = createServiceClient();
    const configId = await getFinanceiroConfigAtivoId(service);
    const [configRow, financeiroRow] = await Promise.all([
      service.from("configuracoes").select("whatsapp_suporte").limit(1).maybeSingle(),
      configId
        ? service.from("financeiro_config").select("taxa_reembolso").eq("id", configId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    const whatsapp =
      configRow.data && !configRow.error
        ? (configRow.data as { whatsapp_suporte: string | null }).whatsapp_suporte ?? null
        : null;
    let percentual_reembolso_24h: number | null = 50;
    if (financeiroRow.data && !financeiroRow.error) {
      const val = (financeiroRow.data as { taxa_reembolso: number }).taxa_reembolso;
      percentual_reembolso_24h = typeof val === "number" ? val : Number(val) ?? 50;
    }
    return { whatsapp_suporte: whatsapp, percentual_reembolso_24h };
  } catch {
    return { whatsapp_suporte: null, percentual_reembolso_24h: 50 };
  }
}

export async function updateWhatsappSuporte(
  numero: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const service = createServiceClient();
    const { data: existing } = await service
      .from("configuracoes")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (existing) {
      const { error } = await service
        .from("configuracoes")
        .update({ whatsapp_suporte: numero.trim() || null })
        .eq("id", (existing as { id: string }).id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await service.from("configuracoes").insert({
        whatsapp_suporte: numero.trim() || null,
        percentual_reembolso_24h: 50,
      });
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updatePercentualReembolso(
  percentual: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const service = createServiceClient();
    const id = await getFinanceiroConfigAtivoId(service);
    if (!id) return { ok: false, error: "Nenhuma configuração financeira ativa" };
    const valor = Math.min(100, Math.max(0, percentual));
    const { error } = await service
      .from("financeiro_config")
      .update({ taxa_reembolso: valor })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateFotoPerfil(url: string | null): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return { ok: false, error: "Não autenticado" };
    const service = createServiceClient();
    const { error } = await service
      .from("user")
      .update({ profile_image: url })
      .eq("id", user.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Faz upload da imagem para arquivos/documentos e salva a URL em user.profile_image. */
export async function uploadFotoPerfil(
  formData: FormData
): Promise<{ ok: boolean; error?: string; url?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return { ok: false, error: "Não autenticado" };

    const file = formData.get("file") as File | null;
    if (!file || !file.size || !file.type.startsWith("image/")) {
      return { ok: false, error: "Selecione uma imagem válida." };
    }

    const ext = file.name.replace(/^.*\./, "") || "jpg";
    const path = `${PREFIX_DOCUMENTOS}/${user.id}-${Date.now()}.${ext}`;
    const body = await file.arrayBuffer();

    const service = createServiceClient();
    const { error: uploadError } = await service.storage
      .from(BUCKET_ARQUIVOS)
      .upload(path, body, { contentType: file.type, upsert: true });

    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = service.storage.from(BUCKET_ARQUIVOS).getPublicUrl(path);

    const result = await updateFotoPerfil(publicUrl);
    if (!result.ok) return result;
    return { ok: true, url: publicUrl };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
