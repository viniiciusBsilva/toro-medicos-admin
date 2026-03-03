"use server";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Médico = quem está na tabela user_medico.
 * is_ativo = true → pode logar (lista principal); is_ativo = false → pendentes.
 * status (enum status_medico): aprovado, reprovado, em_analise, banido.
 * area_atuacao é exibida como "Especialidade" na UI.
 */
const PAGE_SIZE = 8;

export type StatusMedico = "aprovado" | "reprovado" | "em_analise" | "banido";

export type MedicoListItem = {
  id: string;
  id_user: string;
  crm: string;
  nome: string;
  email: string;
  cidade: string | null;
  uf: string | null;
  total_consultas: number;
  especialidade: string | null;
  ultimo_acesso: string | null;
  status: string;
};

export type ListaMedicosResult = {
  medicos: MedicoListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export async function listarMedicos(
  page: number = 1,
  busca?: string,
  status?: StatusMedico[],
  filtroCidadeEstadoEspecialidade?: string,
  apenasPendentes?: boolean
): Promise<ListaMedicosResult> {
  try {
    const service = createServiceClient();

    let idUsersFiltro: string[] | null = null;
    if (busca?.trim()) {
      const q = busca.trim();
      const { data: users } = await service
        .from("user")
        .select("id")
        .or(`nome.ilike.%${q}%,email.ilike.%${q}%`);
      idUsersFiltro = (users ?? []).map((u: { id: string }) => u.id);
      if (idUsersFiltro.length === 0) {
        return { medicos: [], total: 0, page: 1, totalPages: 0 };
      }
    }

    const temFiltroExtra = (filtroCidadeEstadoEspecialidade?.trim()?.length ?? 0) > 0;
    const limit = temFiltroExtra ? 2000 : PAGE_SIZE;
    const from = temFiltroExtra ? 0 : (page - 1) * PAGE_SIZE;

    let query = service
      .from("user_medico")
      .select("id, id_user, crm, area_atuacao, status, created_at, ultimo_acesso, is_ativo", {
        count: temFiltroExtra ? undefined : "exact",
      });

    if (idUsersFiltro?.length) {
      query = query.in("id_user", idUsersFiltro);
    }
    if (apenasPendentes === true) {
      query = query.eq("is_ativo", false);
    } else {
      query = query.eq("is_ativo", true);
      if (status?.length) {
        query = query.in("status", status);
      }
    }

    const { data: rows, count: totalCount, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      return { medicos: [], total: 0, page: 1, totalPages: 0 };
    }

    const list = (rows ?? []) as Array<{
      id: string;
      id_user: string;
      crm?: string | null;
      area_atuacao?: string | null;
      status?: string | null;
      created_at?: string | null;
      ultimo_acesso?: string | null;
    }>;

    if (list.length === 0) {
      return {
        medicos: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }

    const idUsers = list.map((r) => r.id_user).filter(Boolean);

    const { data: users } = await service
      .from("user")
      .select("id, nome, email")
      .in("id", idUsers);
    const userPorId = new Map(
      (users ?? []).map((u: { id: string; nome: string | null; email: string | null }) => [
        u.id,
        { nome: u.nome ?? "—", email: u.email ?? "—" },
      ])
    );

    const { data: enderecos } = await service
      .from("endereco")
      .select("id_user, cidade, uf")
      .in("id_user", idUsers);
    const enderecoPorUser = new Map(
      (enderecos ?? []).map((e: { id_user: string; cidade: string | null; uf: string | null }) => [
        e.id_user,
        { cidade: e.cidade ?? null, uf: e.uf ?? null },
      ])
    );

    const { data: consultas } = await service
      .from("consulta")
      .select("id_medico")
      .in("id_medico", list.map((r) => r.id));
    const consultasPorMedico = new Map<string, number>();
    for (const c of consultas ?? []) {
      const row = c as { id_medico: string };
      consultasPorMedico.set(
        row.id_medico,
        (consultasPorMedico.get(row.id_medico) ?? 0) + 1
      );
    }

    const filtroLower = filtroCidadeEstadoEspecialidade?.trim().toLowerCase();

    const medicos: MedicoListItem[] = list
      .map((r) => {
        const user = userPorId.get(r.id_user) ?? { nome: "—", email: "—" };
        const end = enderecoPorUser.get(r.id_user) ?? { cidade: null, uf: null };
        return {
          id: r.id,
          id_user: r.id_user,
          crm: r.crm ?? "—",
          nome: user.nome,
          email: user.email,
          cidade: end.cidade,
          uf: end.uf,
          total_consultas: consultasPorMedico.get(r.id) ?? 0,
          especialidade: r.area_atuacao ?? null,
          ultimo_acesso: r.ultimo_acesso ?? r.created_at ?? null,
          status: r.status ?? "em_analise",
        };
      })
      .filter((m) => {
        if (!filtroLower) return true;
        const cidade = (m.cidade ?? "").toLowerCase();
        const uf = (m.uf ?? "").toLowerCase();
        const esp = (m.especialidade ?? "").toLowerCase();
        return (
          cidade.includes(filtroLower) ||
          uf.includes(filtroLower) ||
          esp.includes(filtroLower)
        );
      });

    const total = temFiltroExtra ? medicos.length : (totalCount ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const medicosPaginated = temFiltroExtra
      ? medicos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      : medicos;

    return {
      medicos: medicosPaginated,
      total,
      page,
      totalPages,
    };
  } catch {
    return { medicos: [], total: 0, page: 1, totalPages: 0 };
  }
}

export async function contarMedicosPendentes(): Promise<number> {
  try {
    const service = createServiceClient();
    const { count, error } = await service
      .from("user_medico")
      .select("id", { count: "exact", head: true })
      .eq("is_ativo", false);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// --- Detalhes do médico ---

export type DetalhesMedico = {
  id: string;
  id_user: string;
  crm: string;
  nome: string;
  email: string;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  status: string;
  total_consultas: number;
  area_atuacao: string;
  exp_profissional: string | null;
  data_cadastro: string | null;
  ultimo_acesso: string | null;
  media_avaliacao: number | null;
  total_avaliacoes: number | null;
};

export async function getDetalhesMedico(idMedico: string): Promise<DetalhesMedico | null> {
  try {
    const service = createServiceClient();
    const { data: m, error: errM } = await service
      .from("user_medico")
      .select("id, id_user, crm, area_atuacao, status, created_at, ultimo_acesso, exp_profissional, media_avaliacao, total_avaliacoes")
      .eq("id", idMedico)
      .maybeSingle();
    if (errM || !m) return null;
    const row = m as {
      id: string;
      id_user: string;
      crm: string | null;
      area_atuacao: string | null;
      status: string | null;
      created_at: string | null;
      ultimo_acesso: string | null;
      exp_profissional: string | null;
      media_avaliacao: number | null;
      total_avaliacoes: number | null;
    };
    const { data: u, error: errU } = await service
      .from("user")
      .select("nome, email, telefone")
      .eq("id", row.id_user)
      .maybeSingle();
    if (errU || !u) return null;
    const user = u as { nome: string | null; email: string | null; telefone: string | null };
    const { data: end } = await service
      .from("endereco")
      .select("cidade, uf")
      .eq("id_user", row.id_user)
      .maybeSingle();
    const endereco = end as { cidade: string | null; uf: string | null } | null;
    const { count } = await service
      .from("consulta")
      .select("id", { count: "exact", head: true })
      .eq("id_medico", row.id);
    return {
      id: row.id,
      id_user: row.id_user,
      crm: row.crm ?? "—",
      nome: (user.nome ?? "") || "—",
      email: (user.email ?? "") || "—",
      telefone: user.telefone ?? null,
      cidade: endereco?.cidade ?? null,
      uf: endereco?.uf ?? null,
      status: row.status ?? "em_analise",
      total_consultas: count ?? 0,
      area_atuacao: row.area_atuacao ?? "—",
      exp_profissional: row.exp_profissional ?? null,
      data_cadastro: row.created_at ?? null,
      ultimo_acesso: row.ultimo_acesso ?? null,
      media_avaliacao: row.media_avaliacao ?? null,
      total_avaliacoes: row.total_avaliacoes ?? null,
    };
  } catch {
    return null;
  }
}

export type ConsultaMedicoItem = {
  id: string;
  datahora: string;
  tipo: string;
  valor_consulta: number;
  paciente_nome: string;
};

export async function getConsultasMedico(idMedico: string): Promise<ConsultaMedicoItem[]> {
  try {
    const service = createServiceClient();
    const { data: list, error } = await service
      .from("consulta")
      .select("id, datahora, tipo, valor_consulta, id_paciente")
      .eq("id_medico", idMedico)
      .order("datahora", { ascending: false });
    if (error || !list?.length) return [];
    const idPacientes = [...new Set((list as { id_paciente: string }[]).map((c) => c.id_paciente))];
    const { data: users } = await service
      .from("user")
      .select("id, nome")
      .in("id", idPacientes);
    const nomePorId = new Map(
      (users ?? []).map((u: { id: string; nome: string | null }) => [u.id, u.nome ?? "—"])
    );
    return (list as Array<{
      id: string;
      datahora: string;
      tipo: string;
      valor_consulta: number;
      id_paciente: string;
    }>).map((c) => ({
      id: c.id,
      datahora: c.datahora,
      tipo: c.tipo,
      valor_consulta: Number(c.valor_consulta),
      paciente_nome: nomePorId.get(c.id_paciente) ?? "—",
    }));
  } catch {
    return [];
  }
}

export async function banirMedico(idMedico: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const service = createServiceClient();
    const { error } = await service
      .from("user_medico")
      .update({ status: "banido", is_ativo: false })
      .eq("id", idMedico);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// --- Aprovação de documentos ---

export type DocumentoAprovacao = {
  label: string;
  url: string | null;
  nomeArquivo: string;
};

export type MedicoParaAprovacao = {
  id: string;
  documentosPessoais: DocumentoAprovacao[];
  documentosProfissional: DocumentoAprovacao[];
};

export async function getMedicoParaAprovacao(
  idMedico: string
): Promise<MedicoParaAprovacao | null> {
  try {
    const service = createServiceClient();
    const { data: m, error } = await service
      .from("user_medico")
      .select("id, cnh_url, foto_fundo_branco_url, crm_url, rqe")
      .eq("id", idMedico)
      .maybeSingle();
    if (error || !m) return null;
    const row = m as {
      id: string;
      cnh_url: string | null;
      foto_fundo_branco_url: string | null;
      crm_url: string | null;
      rqe: string[] | null;
    };
    const nomeArquivo = (url: string | null) =>
      url ? (url.split("/").pop() ?? "documento.pdf") : "—";
    const doc = (label: string, url: string | null): DocumentoAprovacao => ({
      label,
      url,
      nomeArquivo: url ? nomeArquivo(url) : "—",
    });
    const rqeArr = Array.isArray(row.rqe) ? row.rqe : [];
    const rqeUrl = rqeArr.find((x): x is string => typeof x === "string" && (x.startsWith("http") || x.startsWith("/"))) ?? null;
    const rqeNome = rqeUrl ? nomeArquivo(rqeUrl) : (rqeArr.length > 0 ? "rqe.pdf" : "—");
    return {
      id: row.id,
      documentosPessoais: [
        doc("RG ou CNH", row.cnh_url ?? null),
        doc("Foto com fundo branco", row.foto_fundo_branco_url ?? null),
      ],
      documentosProfissional: [
        doc("CRM", row.crm_url ?? null),
        { label: "RQE", url: rqeUrl, nomeArquivo: rqeNome },
      ],
    };
  } catch {
    return null;
  }
}

async function chamarApproveDoctor(idUserMedico: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/functions/v1/approve-doctor`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_user_medico: idUserMedico }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function chamarRejectDoctor(
  idUserMedico: string,
  motivo: string
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/functions/v1/reject-doctor`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_user_medico: idUserMedico,
        motivo: motivo.trim() || "Documentação reprovada.",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function aprovarDocumentacaoMedico(
  idMedico: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const service = createServiceClient();
    const { error } = await service
      .from("user_medico")
      .update({ status: "aprovado", is_ativo: true })
      .eq("id", idMedico);
    if (error) return { ok: false, error: error.message };
    await chamarApproveDoctor(idMedico);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function recusarDocumentacaoMedico(
  idMedico: string,
  motivo?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const service = createServiceClient();
    const { error } = await service
      .from("user_medico")
      .update({ status: "reprovado", is_ativo: false })
      .eq("id", idMedico);
    if (error) return { ok: false, error: error.message };
    await chamarRejectDoctor(idMedico, motivo ?? "Documentação reprovada.");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
