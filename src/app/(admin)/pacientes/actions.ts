"use server";

import { createServiceClient } from "@/lib/supabase/server";

const PAGE_SIZE = 8;

type IdadeFilter = "0-12" | "13-55" | "56+";

function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function passaFiltroIdade(idade: number | null, filtro: IdadeFilter[]): boolean {
  if (!filtro.length) return true;
  if (idade === null) return false;
  if (filtro.includes("0-12") && idade >= 0 && idade <= 12) return true;
  if (filtro.includes("13-55") && idade >= 13 && idade <= 55) return true;
  if (filtro.includes("56+") && idade >= 56) return true;
  return false;
}

export type PacienteListItem = {
  id: string;
  id_user: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string | null;
  idade: number | null;
  cidade: string | null;
  uf: string | null;
  total_consultas: number;
};

export type ListaPacientesResult = {
  pacientes: PacienteListItem[];
  total: number;
  page: number;
  totalPages: number;
};

export async function listarPacientes(
  page: number = 1,
  busca?: string,
  idade?: IdadeFilter[],
  cidadeOuUf?: string
): Promise<ListaPacientesResult> {
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
      return { pacientes: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  const temFiltroExtra = (idade?.length ?? 0) > 0 || (cidadeOuUf?.trim()?.length ?? 0) > 0;
  const limit = temFiltroExtra ? 2000 : PAGE_SIZE;
  const from = temFiltroExtra ? 0 : (page - 1) * PAGE_SIZE;

  let query = service
    .from("user_paciente")
    .select("id, id_user, data_nascimento, user!inner(nome, email, telefone)", { count: temFiltroExtra ? undefined : "exact" });

  if (idUsersFiltro?.length) {
    query = query.in("id_user", idUsersFiltro);
  }

  const { data: rows, count: totalCount, error } = await query
    .order("id", { ascending: true })
    .range(from, from + limit - 1);

  if (error) {
    console.error("[listarPacientes]", error);
    return { pacientes: [], total: 0, page: 1, totalPages: 0 };
  }

  const list = (rows ?? []) as Array<{
    id: string;
    id_user: string;
    data_nascimento: string | null;
    user: { nome: string | null; email: string | null; telefone: string | null } | null;
  }>;

  const idUsers = list.map((r) => r.id_user).filter(Boolean);

  const enderecoPorUser = new Map<string | null, { cidade: string | null; uf: string | null }>();
  const consultasPorUser = new Map<string, number>();

  if (idUsers.length > 0) {
    // Endereços (cidade, uf)
    const { data: enderecos } = await service
      .from("endereco")
      .select("id_user, cidade, uf")
      .in("id_user", idUsers);

    for (const e of enderecos ?? []) {
      const row = e as { id_user: string; cidade: string | null; uf: string | null };
      enderecoPorUser.set(row.id_user, { cidade: row.cidade ?? null, uf: row.uf ?? null });
    }

    // Contagem de consultas por paciente (consulta.id_paciente = user.id)
    const { data: consultas } = await service
      .from("consulta")
      .select("id_paciente")
      .in("id_paciente", idUsers);

    for (const c of consultas ?? []) {
      const row = c as { id_paciente: string };
      consultasPorUser.set(row.id_paciente, (consultasPorUser.get(row.id_paciente) ?? 0) + 1);
    }
  }

  const cidadeLower = cidadeOuUf?.trim().toLowerCase();

  const allItems: PacienteListItem[] = list.map((r) => {
    const user = r.user ?? {};
    const dataNascimento = r.data_nascimento ?? null;
    const idadeCalc = calcularIdade(dataNascimento);
    const end = enderecoPorUser.get(r.id_user) ?? { cidade: null, uf: null };

    return {
      id: r.id,
      id_user: r.id_user,
      nome: (user.nome ?? "") || "—",
      email: (user.email ?? "") || "—",
      telefone: (user.telefone ?? "") || "—",
      data_nascimento: dataNascimento,
      idade: idadeCalc,
      cidade: end.cidade,
      uf: end.uf,
      total_consultas: consultasPorUser.get(r.id_user) ?? 0,
    };
  });

  const filtered = allItems
    .filter((p) => passaFiltroIdade(p.idade, idade ?? []))
    .filter((p) => {
      if (!cidadeLower) return true;
      const cidade = (p.cidade ?? "").toLowerCase();
      const uf = (p.uf ?? "").toLowerCase();
      return cidade.includes(cidadeLower) || uf.includes(cidadeLower);
    });

  const total = temFiltroExtra ? filtered.length : (totalCount ?? 0);
  const pacientes = temFiltroExtra
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    pacientes,
    total,
    page,
    totalPages,
  };
  } catch (err) {
    console.error("[listarPacientes] Erro:", err);
    return { pacientes: [], total: 0, page: 1, totalPages: 0 };
  }
}

// --- Detalhes do paciente (id = user_paciente.id) ---

export type DetalhesPaciente = {
  id: string;
  id_user: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string | null;
  idade: number | null;
  cidade: string | null;
  uf: string | null;
  total_consultas: number;
  data_cadastro: string | null;
  profile_image: string | null;
};

export async function getDetalhesPaciente(
  idPaciente: string
): Promise<DetalhesPaciente | null> {
  const service = createServiceClient();
  const { data: up, error: errUp } = await service
    .from("user_paciente")
    .select("id, id_user, data_nascimento, created_at")
    .eq("id", idPaciente)
    .maybeSingle();
  if (errUp || !up) return null;
  const row = up as {
    id: string;
    id_user: string;
    data_nascimento: string | null;
    created_at: string | null;
  };
  const { data: u, error: errU } = await service
    .from("user")
    .select("nome, email, telefone, profile_image, created_at")
    .eq("id", row.id_user)
    .maybeSingle();
  if (errU || !u) return null;
  const user = u as {
    nome: string | null;
    email: string | null;
    telefone: string | null;
    profile_image: string | null;
    created_at: string | null;
  };
  const { data: end } = await service
    .from("endereco")
    .select("cidade, uf")
    .eq("id_user", row.id_user)
    .maybeSingle();
  const endereco = end as { cidade: string | null; uf: string | null } | null;
  const { count } = await service
    .from("consulta")
    .select("id", { count: "exact", head: true })
    .eq("id_paciente", row.id_user);
  const idade = calcularIdade(row.data_nascimento);
  return {
    id: row.id,
    id_user: row.id_user,
    nome: (user.nome ?? "") || "—",
    email: (user.email ?? "") || "—",
    telefone: (user.telefone ?? "") || "—",
    data_nascimento: row.data_nascimento,
    idade,
    cidade: endereco?.cidade ?? null,
    uf: endereco?.uf ?? null,
    total_consultas: count ?? 0,
    data_cadastro: user.created_at ?? row.created_at,
    profile_image: user.profile_image ?? null,
  };
}

// --- Histórico de consultas (id_user = user.id, consulta.id_paciente) ---

export type ConsultaHistoricoItem = {
  id: string;
  datahora: string;
  tipo: string;
  status: string;
  status_pagamento: string;
  valor_consulta: number;
  medico_nome: string;
  medico_especialidade: string | null;
};

export async function getConsultasPaciente(
  idUser: string
): Promise<ConsultaHistoricoItem[]> {
  const service = createServiceClient();
  const { data: list, error } = await service
    .from("consulta")
    .select("id, datahora, tipo, status, status_pagamento, valor_consulta, id_medico")
    .eq("id_paciente", idUser)
    .order("datahora", { ascending: false });
  if (error || !list?.length) return [];
  const idsMedico = [...new Set((list as { id_medico: string }[]).map((c) => c.id_medico))];
  const { data: medicos } = await service
    .from("user_medico")
    .select("id, id_user, especialidade")
    .in("id", idsMedico);
  const idUsers = (medicos ?? []).map((m: { id_user: string }) => m.id_user);
  const { data: users } = await service
    .from("user")
    .select("id, nome")
    .in("id", idUsers);
  const userPorId = new Map(
    (users ?? []).map((u: { id: string; nome: string | null }) => [u.id, u.nome ?? "—"])
  );
  const medicoPorId = new Map(
    (medicos ?? []).map((m: { id: string; id_user: string; especialidade: string | null }) => [
      m.id,
      { nome: userPorId.get(m.id_user) ?? "—", especialidade: m.especialidade ?? null },
    ])
  );
  return (list as Array<{
    id: string;
    datahora: string;
    tipo: string;
    status: string;
    status_pagamento: string;
    valor_consulta: number;
    id_medico: string;
  }>).map((c) => {
    const med = medicoPorId.get(c.id_medico) ?? { nome: "—", especialidade: null };
    return {
      id: c.id,
      datahora: c.datahora,
      tipo: c.tipo,
      status: c.status,
      status_pagamento: c.status_pagamento,
      valor_consulta: Number(c.valor_consulta),
      medico_nome: med.nome,
      medico_especialidade: med.especialidade,
    };
  });
}

// --- Prontuário (informações de saúde): user_paciente + user ---

export type ProntuarioData = {
  id: string;
  id_user: string;
  nome: string;
  idade: number | null;
  profile_image: string | null;
  condicao_cronica: boolean | null;
  detalhes_condicao: string | null;
  medicamento_prolongado: boolean | null;
  detalhes_medicamento: string | null;
};

export async function getProntuarioPaciente(
  idPaciente: string
): Promise<ProntuarioData | null> {
  const service = createServiceClient();
  const { data: up, error: errUp } = await service
    .from("user_paciente")
    .select("id, id_user, condicao_cronica, detalhes_condicao, medicamento_prolongado, detalhes_medicamento, data_nascimento")
    .eq("id", idPaciente)
    .maybeSingle();
  if (errUp || !up) return null;
  const row = up as {
    id: string;
    id_user: string;
    condicao_cronica: boolean | null;
    detalhes_condicao: string | null;
    medicamento_prolongado: boolean | null;
    detalhes_medicamento: string | null;
    data_nascimento: string | null;
  };
  const { data: u, error: errU } = await service
    .from("user")
    .select("nome, profile_image")
    .eq("id", row.id_user)
    .maybeSingle();
  if (errU || !u) return null;
  const user = u as { nome: string | null; profile_image: string | null };
  const idade = calcularIdade(row.data_nascimento);
  return {
    id: row.id,
    id_user: row.id_user,
    nome: (user.nome ?? "") || "—",
    idade,
    profile_image: user.profile_image ?? null,
    condicao_cronica: row.condicao_cronica,
    detalhes_condicao: row.detalhes_condicao,
    medicamento_prolongado: row.medicamento_prolongado,
    detalhes_medicamento: row.detalhes_medicamento,
  };
}

// --- Exames: paciente_exames (por user_paciente.id) + consulta_documento tipo pedido_exame (por id_user) ---

export type ExameItem = {
  id: string;
  titulo: string;
  solicitado_em: string | null;
  medico_nome: string | null;
  data_consulta: string | null;
  arquivo_url: string | null;
  created_at: string;
  /** Conteúdo texto do documento (consulta_documento). Usado para gerar PDF quando não há arquivo_url. */
  conteudo: string | null;
  /** Conteúdo estruturado (consulta_documento). Usado para gerar PDF quando não há arquivo_url. */
  conteudo_json: unknown | null;
};

export async function getExamesPaciente(
  idPaciente: string,
  idUser: string
): Promise<ExameItem[]> {
  const service = createServiceClient();
  const items: ExameItem[] = [];
  const { data: consultasPaciente } = await service
    .from("consulta")
    .select("id, datahora, id_medico")
    .eq("id_paciente", idUser);
  const idsConsulta = (consultasPaciente ?? []).map((c: { id: string }) => c.id);
  if (idsConsulta.length > 0) {
    const { data: pedidos, error: errPedidos } = await service
      .from("consulta_documento")
      .select("id, created_at, arquivo_url, conteudo, conteudo_json, id_consulta")
      .eq("tipo", "pedido_exame")
      .in("id_consulta", idsConsulta);
  if (!errPedidos && pedidos?.length) {
    const consultas = consultasPaciente as Array<{ id: string; datahora: string; id_medico: string }>;
    const consultaIds = new Set(consultas.map((c) => c.id));
    const consultaPorId = new Map(
      consultas.map((c) => [c.id, { datahora: c.datahora, id_medico: c.id_medico }])
    );
    const idsMedico = [...new Set(consultas.map((c) => c.id_medico))];
    const { data: medicos } = await service.from("user_medico").select("id, id_user, especialidade").in("id", idsMedico);
    const idUsersMed = (medicos ?? []).map((m: { id_user: string }) => m.id_user);
    const { data: usersMed } = await service.from("user").select("id, nome").in("id", idUsersMed);
    const nomePorIdUser = new Map(
      (usersMed ?? []).map((u: { id: string; nome: string | null }) => [u.id, u.nome])
    );
    const medicoPorId = new Map(
      (medicos ?? []).map((m: { id: string; id_user: string; especialidade: string | null }) => [
        m.id,
        nomePorIdUser.get(m.id_user) ?? "—",
      ])
    );
    for (const p of pedidos as Array<{ id: string; created_at: string; arquivo_url: string | null; conteudo: string | null; conteudo_json: unknown; id_consulta: string }>) {
      const cons = consultaPorId.get(p.id_consulta);
      const titulo = (p.conteudo?.trim() || "Pedido de exame").split("\n")[0];
      items.push({
        id: p.id,
        titulo,
        solicitado_em: p.created_at,
        medico_nome: cons ? (medicoPorId.get(cons.id_medico) ?? null) : null,
        data_consulta: cons?.datahora ?? null,
        arquivo_url: p.arquivo_url ?? null,
        created_at: p.created_at,
        conteudo: p.conteudo ?? null,
        conteudo_json: p.conteudo_json ?? null,
      });
    }
  }
  }
  const { data: exames, error: errExames } = await service
    .from("paciente_exames")
    .select("id, nome_exames, url_exame, created_at")
    .eq("id_paciente", idPaciente)
    .order("created_at", { ascending: false });
  if (!errExames && exames?.length) {
    for (const e of exames as Array<{ id: number; nome_exames: string | null; url_exame: string | null; created_at: string }>) {
      items.push({
        id: `ex-${e.id}`,
        titulo: e.nome_exames ?? "Exame",
        solicitado_em: null,
        medico_nome: null,
        data_consulta: null,
        arquivo_url: e.url_exame,
        created_at: e.created_at,
        conteudo: null,
        conteudo_json: null,
      });
    }
  }
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return items;
}

// --- Atestados e Receitas: consulta_documento por id_user (via consulta) ---

export type DocumentoItem = {
  id: string;
  data_emissao: string;
  arquivo_url: string | null;
  nome_arquivo: string | null;
  medico_nome: string | null;
  /** Conteúdo texto (consulta_documento). Usado para gerar PDF quando não há arquivo_url. */
  conteudo: string | null;
  /** Conteúdo estruturado (consulta_documento). Usado para gerar PDF quando não há arquivo_url. */
  conteudo_json: unknown | null;
};

async function getDocumentosPacienteComMedico(
  service: ReturnType<typeof createServiceClient>,
  idUser: string,
  tipo: "atestado" | "receita"
): Promise<DocumentoItem[]> {
  const { data: consultas } = await service
    .from("consulta")
    .select("id, id_medico, datahora")
    .eq("id_paciente", idUser);
  const idsConsulta = (consultas ?? []).map((c: { id: string }) => c.id);
  if (idsConsulta.length === 0) return [];
  const { data: docs } = await service
    .from("consulta_documento")
    .select("id, created_at, arquivo_url, conteudo, conteudo_json, id_consulta")
    .eq("tipo", tipo)
    .in("id_consulta", idsConsulta)
    .order("created_at", { ascending: false });
  if (!docs?.length) return [];
  const consultasMap = new Map(
    (consultas as Array<{ id: string; id_medico: string; datahora: string }>).map((c) => [c.id, { id_medico: c.id_medico, datahora: c.datahora }])
  );
  const idsMedico = [...new Set(
    (docs as Array<{ id_consulta: string }>)
      .map((d) => consultasMap.get(d.id_consulta)?.id_medico)
      .filter(Boolean)
  )] as string[];
  let medicoPorId = new Map<string, string>();
  if (idsMedico.length > 0) {
    const { data: medicos } = await service.from("user_medico").select("id, id_user").in("id", idsMedico);
    const idUsers = (medicos ?? []).map((m: { id_user: string }) => m.id_user);
    const { data: users } = await service.from("user").select("id, nome").in("id", idUsers);
    const nomePorUser = new Map((users ?? []).map((u: { id: string; nome: string | null }) => [u.id, u.nome ?? "—"]));
    medicoPorId = new Map(
      (medicos ?? []).map((m: { id: string; id_user: string }) => [m.id, nomePorUser.get(m.id_user) ?? "—"])
    );
  }
  return (docs as Array<{ id: string; created_at: string; arquivo_url: string | null; conteudo: string | null; conteudo_json: unknown; id_consulta: string }>).map((d) => {
    const cons = consultasMap.get(d.id_consulta);
    return {
      id: d.id,
      data_emissao: d.created_at,
      arquivo_url: d.arquivo_url,
      nome_arquivo: d.arquivo_url ? d.arquivo_url.split("/").pop() ?? null : null,
      medico_nome: cons ? (medicoPorId.get(cons.id_medico) ?? null) : null,
      conteudo: d.conteudo ?? null,
      conteudo_json: d.conteudo_json ?? null,
    };
  });
}

export async function getAtestadosPaciente(idUser: string): Promise<DocumentoItem[]> {
  const service = createServiceClient();
  return getDocumentosPacienteComMedico(service, idUser, "atestado");
}

export async function getReceitasPaciente(idUser: string): Promise<DocumentoItem[]> {
  const service = createServiceClient();
  return getDocumentosPacienteComMedico(service, idUser, "receita");
}
