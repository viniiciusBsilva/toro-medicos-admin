"use server";

import { createServiceClient } from "@/lib/supabase/server";

export type FiltroNotificacao = "todas" | "lidas" | "nao_lidas";

export type NotificacaoItem = {
  id: string;
  created_at: string;
  id_user_medico: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  /** Link sugerido para a ação (ex: /medicos/pendentes ou /medicos/[id]/aprovacao) */
  acao_url: string;
  /** Texto do link de ação (ex: "Ir para médicos em análise") */
  acao_label: string;
};

/** Retorna acao_url e acao_label com base em tipo e id_user_medico */
function acaoPorTipo(tipo: string, idUserMedico: string): { acao_url: string; acao_label: string } {
  const t = String(tipo).toLowerCase();
  if (t.includes("medico") || t.includes("cadastro") || t.includes("analise")) {
    return {
      acao_url: `/medicos/${idUserMedico}/aprovacao`,
      acao_label: "Ir para médicos em análise →",
    };
  }
  return {
    acao_url: "/medicos/pendentes",
    acao_label: "Ir para médicos em análise →",
  };
}

export async function listarNotificacoes(
  filtro: FiltroNotificacao
): Promise<{ notificacoes: NotificacaoItem[] }> {
  const service = createServiceClient();
  let query = service
    .from("notificacao_admin")
    .select("id, created_at, id_user_medico, tipo, titulo, mensagem, lida")
    .order("created_at", { ascending: false });

  if (filtro === "lidas") query = query.eq("lida", true);
  if (filtro === "nao_lidas") query = query.eq("lida", false);

  const { data, error } = await query;
  if (error) return { notificacoes: [] };

  const rows = (data ?? []) as Array<{
    id: string;
    created_at: string;
    id_user_medico: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    lida: boolean;
  }>;

  const notificacoes: NotificacaoItem[] = rows.map((r) => {
    const { acao_url, acao_label } = acaoPorTipo(r.tipo, r.id_user_medico);
    return {
      id: r.id,
      created_at: r.created_at,
      id_user_medico: r.id_user_medico,
      tipo: r.tipo,
      titulo: r.titulo,
      mensagem: r.mensagem,
      lida: r.lida,
      acao_url,
      acao_label,
    };
  });

  return { notificacoes };
}

export async function marcarComoLida(id: string): Promise<{ ok: boolean; error?: string }> {
  const service = createServiceClient();
  const { error } = await service
    .from("notificacao_admin")
    .update({ lida: true })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
