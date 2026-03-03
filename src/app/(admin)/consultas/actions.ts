"use server";

import { createServiceClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

export type ConsultaListItem = {
  id: string;
  id_short: string;
  status: string;
  paciente_nome: string;
  paciente_cpf: string | null;
  data: string;
  horario: string;
  profissional_crm: string;
  valor: number;
};

export type ListaConsultasResult = {
  consultas: ConsultaListItem[];
  total: number;
  page: number;
  totalPages: number;
};

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 5).toUpperCase();
}

/** Lista consultas com paginação, filtro por mês e busca por nome/email do paciente. */
export async function listarConsultas(
  page: number,
  anoMes: string,
  busca: string
): Promise<ListaConsultasResult> {
  const service = createServiceClient();
  const [anoStr, mesStr] = anoMes.split("-");
  const ano = parseInt(anoStr!, 10);
  const mes = parseInt(mesStr!, 10);
  const from = `${anoMes}-01T00:00:00`;
  const toExclusive = new Date(ano, mes, 1).toISOString().slice(0, 19);

  let idsPaciente: string[] | null = null;
  if (busca.trim()) {
    const { data: users } = await service
      .from("user")
      .select("id")
      .or(`nome.ilike.%${busca.trim()}%,email.ilike.%${busca.trim()}%`);
    idsPaciente = (users ?? []).map((u: { id: string }) => u.id);
    if (idsPaciente.length === 0) {
      return { consultas: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  let query = service
    .from("consulta")
    .select("id, datahora, status, valor_consulta, id_paciente, id_medico", { count: "exact" })
    .gte("datahora", from)
    .lt("datahora", toExclusive)
    .order("datahora", { ascending: false });
  if (idsPaciente) query = query.in("id_paciente", idsPaciente);

  const fromRow = (page - 1) * PAGE_SIZE;
  const { data: list, error, count } = await query.range(fromRow, fromRow + PAGE_SIZE - 1);
  if (error) return { consultas: [], total: 0, page: 1, totalPages: 0 };
  const total = count ?? 0;
  const rows = (list ?? []) as Array<{
    id: string;
    datahora: string;
    status: string;
    valor_consulta: number;
    id_paciente: string;
    id_medico: string;
  }>;

  const idPacientes = [...new Set(rows.map((r) => r.id_paciente))];
  const idMedicos = [...new Set(rows.map((r) => r.id_medico))];
  const { data: users } = await service.from("user").select("id, nome, cpf").in("id", idPacientes);
  const { data: medicos } = await service.from("user_medico").select("id, id_user, crm").in("id", idMedicos);
  const idUsersMed = (medicos ?? []).map((m: { id_user: string }) => m.id_user);
  const [usersMedRes, enderecosRes] = await Promise.all([
    service.from("user").select("id, nome").in("id", idUsersMed),
    idUsersMed.length > 0 ? service.from("endereco").select("id_user, uf").in("id_user", idUsersMed) : { data: [] },
  ]);
  const { data: usersMed } = usersMedRes;
  const ufPorIdUser = new Map(
    ((enderecosRes as { data: Array<{ id_user: string; uf: string | null }> }).data ?? []).map((e) => [e.id_user, e.uf ?? ""])
  );

  const userPorId = new Map(
    (users ?? []).map((u: { id: string; nome: string | null; cpf: string | null }) => [u.id, { nome: u.nome ?? "—", cpf: u.cpf ?? null }])
  );
  const medicoPorId = new Map(
    (medicos ?? []).map((m: { id: string; id_user: string; crm: string | null }) => [
      m.id,
      { id_user: m.id_user, crm: m.crm ?? "", uf: ufPorIdUser.get(m.id_user) ?? "" },
    ])
  );
  const nomeMedicoPorIdUser = new Map(
    (usersMed ?? []).map((u: { id: string; nome: string | null }) => [u.id, u.nome ?? "—"])
  );

  const consultas: ConsultaListItem[] = rows.map((r) => {
    const pac = userPorId.get(r.id_paciente) ?? { nome: "—", cpf: null };
    const med = medicoPorId.get(r.id_medico);
    const medicoNome = med ? nomeMedicoPorIdUser.get(med.id_user) ?? "—" : "—";
    const crmUf = med ? `${med.crm}/${med.uf}` : "—";
    const [dataPart, timePart] = r.datahora.slice(0, 19).split("T");
    const [y, mo, d] = dataPart.split("-");
    const data = `${d}/${mo}/${y}`;
    const hora = timePart ? timePart.slice(0, 5).replace(":", "h") : "—";
    return {
      id: r.id,
      id_short: `#C${shortId(r.id)}`,
      status: r.status ?? "agendada",
      paciente_nome: pac.nome,
      paciente_cpf: pac.cpf,
      data: data,
      horario: hora,
      profissional_crm: `${medicoNome} ${crmUf}`.trim(),
      valor: Number(r.valor_consulta),
    };
  });

  return {
    consultas,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export type DetalhesConsulta = {
  id: string;
  id_short: string;
  datahora: string;
  data: string;
  horario: string;
  tipo: string;
  status: string;
  valor_consulta: number;
  paciente: {
    id_user: string;
    id_paciente: string;
    nome: string;
    profile_image: string | null;
  };
  medico: {
    id_medico: string;
    nome: string;
    profile_image: string | null;
    crm: string;
    uf: string;
  };
  principal_queixa: string | null;
  hipoteses: string | null;
  observacoes: string | null;
  documentos: {
    receita: DocItem[];
    atestado: DocItem[];
    pedidos_exame: DocItem[];
  };
};

/** Espelha a tabela consulta_documento (id, id_consulta, tipo, arquivo_url, assinado, created_at). */
export type DocItem = {
  id: string;
  id_consulta: string;
  tipo: "receita" | "atestado" | "pedido_exame";
  arquivo_url: string | null;
  nome_arquivo: string | null;
  assinado: boolean;
  created_at: string;
};

/** Detalhes de uma consulta para a tela de detalhes. */
export async function getDetalhesConsulta(id: string): Promise<DetalhesConsulta | null> {
  const service = createServiceClient();
  const { data: c, error } = await service
    .from("consulta")
    .select("id, datahora, tipo, status, valor_consulta, id_paciente, id_medico")
    .eq("id", id)
    .maybeSingle();
  if (error || !c) return null;
  const row = c as {
    id: string;
    datahora: string;
    tipo: string;
    status: string;
    valor_consulta: number;
    id_paciente: string;
    id_medico: string;
  };

  const { data: up } = await service
    .from("user_paciente")
    .select("id")
    .eq("id_user", row.id_paciente)
    .maybeSingle();
  const idPaciente = (up as { id: string } | null)?.id ?? null;

  const [{ data: userPac }, medicoResult, docsResult] = await Promise.all([
    service.from("user").select("nome, profile_image").eq("id", row.id_paciente).maybeSingle(),
    service.from("user_medico").select("id, id_user, crm").eq("id", row.id_medico).maybeSingle(),
    service.from("consulta_documento").select("id, id_consulta, tipo, arquivo_url, assinado, created_at").eq("id_consulta", row.id),
  ]);

  // consulta.id_medico → user_medico(id); user_medico.id_user → user(id). user_medico não tem coluna uf; uf vem de endereco.
  const medRow = medicoResult.data as { id: string; id_user: string; crm: string | null } | null;
  let medicoNome = "—";
  let medicoProfileImage: string | null = null;
  let medicoUf: string | null = null;
  const medicoIdParaLink = medRow?.id ?? row.id_medico;

  if (medRow?.id_user) {
    const [userMedicoRes, enderecoRes] = await Promise.all([
      service.from("user").select("nome, profile_image, email").eq("id", medRow.id_user).maybeSingle(),
      service.from("endereco").select("uf").eq("id_user", medRow.id_user).maybeSingle(),
    ]);
    const u = userMedicoRes.data as { nome: string | null; profile_image: string | null; email: string | null } | null;
    if (u) {
      medicoNome = (u.nome?.trim() || u.email?.trim() || null) ?? "Médico";
      medicoProfileImage = u.profile_image ?? null;
    }
    const end = enderecoRes.data as { uf: string | null } | null;
    medicoUf = end?.uf ?? null;
  }

  const docsList = (docsResult.data ?? []) as Array<{
    id: string;
    id_consulta: string;
    tipo: string;
    arquivo_url: string | null;
    assinado: boolean;
    created_at: string;
  }>;

  const tipoNorm = (t: string) => String(t ?? "").toLowerCase().trim().replace(/\s+/g, "_") as string;
  const isReceita = (t: string) => tipoNorm(t) === "receita";
  const isAtestado = (t: string) => tipoNorm(t) === "atestado";
  const isPedidoExame = (t: string) => tipoNorm(t) === "pedido_exame";

  const receitas = docsList.filter((d) => isReceita(d.tipo));
  const atestados = docsList.filter((d) => isAtestado(d.tipo));
  const pedidos_exame = docsList.filter((d) => isPedidoExame(d.tipo));

  const nomeArq = (url: string | null) => (url ? url.split("/").pop() ?? null : null);
  const toDocItem = (x: (typeof docsList)[0], tipo: DocItem["tipo"]): DocItem => ({
    id: x.id,
    id_consulta: x.id_consulta,
    tipo,
    arquivo_url: x.arquivo_url,
    nome_arquivo: nomeArq(x.arquivo_url),
    assinado: x.assinado === true,
    created_at: x.created_at,
  });

  const [dataPart, timePart] = row.datahora.slice(0, 19).split("T");
  const [y, mo, d] = dataPart.split("-");
  const data = `${d}/${mo}/${y}`;
  const hora = timePart ? timePart.slice(0, 5).replace(":", "h") : "—";

  return {
    id: row.id,
    id_short: `#${shortId(row.id)}`,
    datahora: row.datahora,
    data,
    horario: hora,
    tipo: row.tipo ?? "normal",
    status: row.status ?? "agendada",
    valor_consulta: Number(row.valor_consulta),
    paciente: {
      id_user: row.id_paciente,
      id_paciente: idPaciente ?? row.id_paciente,
      nome: (userPac as { nome: string | null } | null)?.nome ?? "—",
      profile_image: (userPac as { profile_image: string | null } | null)?.profile_image ?? null,
    },
    medico: {
      id_medico: medicoIdParaLink,
      nome: medicoNome,
      profile_image: medicoProfileImage,
      crm: medRow?.crm ?? "—",
      uf: medicoUf ?? "—",
    },
    principal_queixa: null,
    hipoteses: null,
    observacoes: null,
    documentos: {
      receita: receitas.map((x) => toDocItem(x, "receita")),
      atestado: atestados.map((x) => toDocItem(x, "atestado")),
      pedidos_exame: pedidos_exame.map((x) => toDocItem(x, "pedido_exame")),
    },
  };
}
