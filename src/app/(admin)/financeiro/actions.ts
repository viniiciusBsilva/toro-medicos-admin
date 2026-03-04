"use server";

import { createServiceClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 5).toUpperCase();
}

function formatarDataHora(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${ano} - ${h}h${min}`;
  } catch {
    return "—";
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
    .or("vigencia_fim.is.null,vigencia_fim.gte." + now)
    .order("vigencia_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

// --- Taxas administrativas (modal) ---

export type TaxasAdministrativas = {
  taxa_medico_percent: number;
  taxa_paciente_percent: number;
};

export async function getTaxasAdministrativas(): Promise<TaxasAdministrativas | null> {
  const service = createServiceClient();
  const id = await getFinanceiroConfigAtivoId(service);
  if (!id) return null;
  const { data, error } = await service
    .from("financeiro_config")
    .select("taxa_medico_percent, taxa_paciente_percent")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as { taxa_medico_percent: number; taxa_paciente_percent: number };
  return {
    taxa_medico_percent: Number(r.taxa_medico_percent),
    taxa_paciente_percent: Number(r.taxa_paciente_percent),
  };
}

export async function updateTaxasAdministrativas(
  taxa_medico_percent: number,
  taxa_paciente_percent: number
): Promise<{ ok: boolean; error?: string }> {
  const service = createServiceClient();
  const id = await getFinanceiroConfigAtivoId(service);
  if (!id) return { ok: false, error: "Nenhuma configuração financeira ativa" };
  const med = Math.min(100, Math.max(0, Number(taxa_medico_percent)));
  const pac = Math.min(100, Math.max(0, Number(taxa_paciente_percent)));
  const { error } = await service
    .from("financeiro_config")
    .update({ taxa_medico_percent: med, taxa_paciente_percent: pac })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// --- Indicadores financeiros (cards) ---

export type IndicadoresFinanceiros = {
  taxa_medico_percent: number;
  taxa_paciente_percent: number;
  taxa_administrativa_recebida: number;
  total_recebido_consultas: number;
  total_plantao: number;
  total_agendamentos: number;
  total_reembolsado: number;
  valor_liquido_taxa: number;
};

/** anoMes: "YYYY-MM". Busca por cidade/estado filtra consultas por endereço do médico (não implementado aqui, só anoMes). */
export async function getIndicadoresFinanceiros(
  anoMes: string
): Promise<IndicadoresFinanceiros> {
  const service = createServiceClient();
  const [anoStr, mesStr] = anoMes.split("-");
  const ano = parseInt(anoStr!, 10);
  const mes = parseInt(mesStr!, 10);
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59);
  const inicioStr = inicio.toISOString().slice(0, 10);
  const fimStr = fim.toISOString().slice(0, 10);

  const taxas = await getTaxasAdministrativas();
  const taxa_medico_percent = taxas?.taxa_medico_percent ?? 0;
  const taxa_paciente_percent = taxas?.taxa_paciente_percent ?? 0;

  const fromStr = inicio.toISOString().slice(0, 19);
  const toStr = fim.toISOString().slice(0, 19);

  const [
    { data: lancamentos },
    { data: consultasPeriodo },
  ] = await Promise.all([
    service
      .from("financeiro_lancamento")
      .select("receita_plataforma_valor, total_pago_paciente, valor_consulta")
      .gte("competencia", inicioStr)
      .lte("competencia", fimStr),
    service
      .from("consulta")
      .select("valor_consulta")
      .gte("datahora", fromStr)
      .lte("datahora", toStr),
  ]);

  const rows = (lancamentos ?? []) as Array<{
    receita_plataforma_valor: number;
    total_pago_paciente: number;
    valor_consulta: number;
  }>;
  const taxa_administrativa_recebida = rows.reduce((s, r) => s + Number(r.receita_plataforma_valor ?? 0), 0);
  const total_recebido_consultas = rows.reduce((s, r) => s + Number(r.total_pago_paciente ?? 0), 0);
  const total_agendamentos = total_recebido_consultas;

  const consultasMes = (consultasPeriodo ?? []) as Array<{ valor_consulta: number | null }>;
  const totalConsultasMes = consultasMes.length;
  const somaValorConsultas = consultasMes.reduce((s, c) => s + Number(c.valor_consulta ?? 0), 0);
  const total_plantao = totalConsultasMes > 0 ? somaValorConsultas : 0;

  const { data: reembolsos } = await service
    .from("reembolso")
    .select("valor")
    .gte("created_at", inicio.toISOString())
    .lte("created_at", fim.toISOString());
  const total_reembolsado = (reembolsos ?? []).reduce(
    (s: number, r: { valor: number }) => s + Number(r.valor ?? 0),
    0
  );
  const valor_liquido_taxa = Math.max(0, taxa_administrativa_recebida);

  return {
    taxa_medico_percent,
    taxa_paciente_percent,
    taxa_administrativa_recebida,
    total_recebido_consultas,
    total_plantao,
    total_agendamentos,
    total_reembolsado,
    valor_liquido_taxa,
  };
}

// --- Média consultas por especialidade (gráfico) ---

export type MediaPorEspecialidade = {
  especialidade: string;
  media: number;
};

export async function getMediaConsultasPorEspecialidade(
  anoMes: string
): Promise<MediaPorEspecialidade[]> {
  const service = createServiceClient();
  const [anoStr, mesStr] = anoMes.split("-");
  const ano = parseInt(anoStr!, 10);
  const mes = parseInt(mesStr!, 10);
  const inicio = new Date(ano, mes - 1, 1).toISOString().slice(0, 10);
  const fim = new Date(ano, mes, 0).toISOString().slice(0, 10);

  const { data: lans } = await service
    .from("financeiro_lancamento")
    .select("id_consulta, valor_consulta")
    .gte("competencia", inicio)
    .lte("competencia", fim);
  if (!lans?.length) return [];
  const idsConsulta = (lans as Array<{ id_consulta: string; valor_consulta: number }>).map(
    (x) => x.id_consulta
  );
  const { data: consultas } = await service
    .from("consulta")
    .select("id, id_medico, valor_consulta")
    .in("id", idsConsulta);
  if (!consultas?.length) return [];
  const idMedicos = [...new Set((consultas as Array<{ id_medico: string }>).map((c) => c.id_medico))];
  const { data: medicos } = await service
    .from("user_medico")
    .select("id, area_atuacao")
    .in("id", idMedicos);
  const valorPorConsulta = new Map(
    (lans as Array<{ id_consulta: string; valor_consulta: number }>).map((l) => [
      l.id_consulta,
      Number(l.valor_consulta),
    ])
  );
  const consultaPorId = new Map(
    (consultas as Array<{ id: string; id_medico: string }>).map((c) => [c.id, c.id_medico])
  );
  const especialidadePorMedico = new Map(
    ((medicos ?? []) as Array<{ id: string; area_atuacao: string | null }>).map((m) => [
      m.id,
      (m.area_atuacao ?? "Outros").trim() || "Outros",
    ])
  );

  const somaPorEsp = new Map<string, { soma: number; count: number }>();
  for (const c of consultas as Array<{ id: string; id_medico: string }>) {
    const esp = especialidadePorMedico.get(c.id_medico) ?? "Outros";
    const valor = valorPorConsulta.get(c.id) ?? 0;
    const cur = somaPorEsp.get(esp) ?? { soma: 0, count: 0 };
    somaPorEsp.set(esp, { soma: cur.soma + valor, count: cur.count + 1 });
  }
  return Array.from(somaPorEsp.entries())
    .map(([especialidade, { soma, count }]) => ({
      especialidade,
      media: count > 0 ? soma / count : 0,
    }))
    .sort((a, b) => b.media - a.media)
    .slice(0, 12);
}

// --- Repasses (tabela) ---

export type RepasseItem = {
  id: string;
  id_short: string;
  medico_nome: string;
  crm: string;
  datahora: string;
  valor: number;
};

export async function listarRepasses(
  page: number,
  anoMes: string,
  busca: string
): Promise<{ repasses: RepasseItem[]; total: number; totalPages: number }> {
  const service = createServiceClient();
  const [anoStr, mesStr] = anoMes.split("-");
  const ano = parseInt(anoStr!, 10);
  const mes = parseInt(mesStr!, 10);
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59);

  const { data: transacoes, error: errT } = await service
    .from("repasse_transacao")
    .select("id, id_financeiro_lancamento, valor_repasse, scheduled_at, processed_at")
    .gte("created_at", inicio.toISOString())
    .lte("created_at", fim.toISOString())
    .order("created_at", { ascending: false });
  if (errT || !transacoes?.length) {
    return { repasses: [], total: 0, totalPages: 0 };
  }

  const idsLanc = (transacoes as Array<{ id_financeiro_lancamento: string }>).map(
    (t) => t.id_financeiro_lancamento
  );
  const { data: lans } = await service
    .from("financeiro_lancamento")
    .select("id, id_consulta")
    .in("id", idsLanc);
  if (!lans?.length) return { repasses: [], total: 0, totalPages: 0 };

  const idsConsulta = (lans as Array<{ id_consulta: string }>).map((l) => l.id_consulta);
  const { data: consultas } = await service
    .from("consulta")
    .select("id, id_medico")
    .in("id", idsConsulta);
  const idMedicos = [...new Set((consultas as Array<{ id_medico: string }>).map((c) => c.id_medico))];
  const { data: userMedicos } = await service
    .from("user_medico")
    .select("id, id_user, crm")
    .in("id", idMedicos);
  const idUsers = (userMedicos ?? []).map((m: { id_user: string }) => m.id_user);
  const { data: users } = await service.from("user").select("id, nome").in("id", idUsers);

  const consultaPorId = new Map(
    (consultas as Array<{ id: string; id_medico: string }>).map((c) => [c.id, c.id_medico])
  );
  const lancPorId = new Map(
    (lans as Array<{ id: string; id_consulta: string }>).map((l) => [l.id, l.id_consulta])
  );
  const medicoPorId = new Map(
    ((userMedicos ?? []) as Array<{ id: string; id_user: string; crm: string | null }>).map((m) => [
      m.id,
      { id_user: m.id_user, crm: m.crm ?? "—" },
    ])
  );
  const nomePorIdUser = new Map(
    (users ?? []).map((u: { id: string; nome: string | null }) => [u.id, u.nome ?? "—"])
  );

  let repasses: RepasseItem[] = (transacoes as Array<{
    id: string;
    id_financeiro_lancamento: string;
    valor_repasse: number;
    scheduled_at: string | null;
    processed_at: string | null;
  }>).map((t) => {
    const idCons = lancPorId.get(t.id_financeiro_lancamento);
    const idMedico = idCons ? consultaPorId.get(idCons) : undefined;
    const med = idMedico ? medicoPorId.get(idMedico) : null;
    const nome = med ? nomePorIdUser.get(med.id_user) ?? "—" : "—";
    const crm = med?.crm ?? "—";
    const datahora = t.processed_at ?? t.scheduled_at ?? "";
    return {
      id: t.id,
      id_short: `#${shortId(t.id)}`,
      medico_nome: nome,
      crm: crm + (idMedico ? "" : ""),
      datahora: formatarDataHora(datahora),
      valor: Number(t.valor_repasse),
    };
  });

  if (busca.trim()) {
    const b = busca.trim().toLowerCase();
    repasses = repasses.filter(
      (r) =>
        r.medico_nome.toLowerCase().includes(b) ||
        r.crm.toLowerCase().includes(b)
    );
  }

  const total = repasses.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE;
  repasses = repasses.slice(from, from + PAGE_SIZE);

  return { repasses, total, totalPages };
}

// --- Reembolsos (tabela) ---

export type ReembolsoItem = {
  id: string;
  id_short: string;
  paciente_nome: string;
  id_paciente_short: string;
  datahora: string;
  valor: number;
  id_consulta_short: string;
};

export async function listarReembolsos(
  page: number,
  anoMes: string,
  busca: string
): Promise<{ reembolsos: ReembolsoItem[]; total: number; totalPages: number }> {
  const service = createServiceClient();
  const [anoStr, mesStr] = anoMes.split("-");
  const ano = parseInt(anoStr!, 10);
  const mes = parseInt(mesStr!, 10);
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59);

  const { data: reembList, error: errR } = await service
    .from("reembolso")
    .select("id, id_consulta, valor, created_at")
    .gte("created_at", inicio.toISOString())
    .lte("created_at", fim.toISOString())
    .order("created_at", { ascending: false });
  if (errR || !reembList?.length) {
    return { reembolsos: [], total: 0, totalPages: 0 };
  }

  const idsConsulta = (reembList as Array<{ id_consulta: string }>).map((r) => r.id_consulta);
  const { data: consultas } = await service
    .from("consulta")
    .select("id, id_paciente")
    .in("id", idsConsulta);
  const idPacientes = [...new Set((consultas as Array<{ id_paciente: string }>).map((c) => c.id_paciente))];
  const { data: users } = await service.from("user").select("id, nome").in("id", idPacientes);

  const consultaPorId = new Map(
    (consultas as Array<{ id: string; id_paciente: string }>).map((c) => [c.id, c.id_paciente])
  );
  const nomePorId = new Map(
    (users ?? []).map((u: { id: string; nome: string | null }) => [u.id, u.nome ?? "—"])
  );

  let reembolsos: ReembolsoItem[] = (reembList as Array<{
    id: string;
    id_consulta: string;
    valor: number;
    created_at: string;
  }>).map((r) => {
    const idPac = consultaPorId.get(r.id_consulta);
    return {
      id: r.id,
      id_short: `#R${shortId(r.id)}`,
      paciente_nome: idPac ? nomePorId.get(idPac) ?? "—" : "—",
      id_paciente_short: idPac ? `#${shortId(idPac)}` : "—",
      datahora: formatarDataHora(r.created_at),
      valor: Number(r.valor),
      id_consulta_short: `#C${shortId(r.id_consulta)}`,
    };
  });

  if (busca.trim()) {
    const b = busca.trim().toLowerCase();
    reembolsos = reembolsos.filter(
      (r) =>
        r.paciente_nome.toLowerCase().includes(b) ||
        r.id_paciente_short.toLowerCase().includes(b)
    );
  }

  const total = reembolsos.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE;
  reembolsos = reembolsos.slice(from, from + PAGE_SIZE);

  return { reembolsos, total, totalPages };
}

// --- Modal: consultas incluídas no repasse (1 consulta por repasse_transacao) ---

export type ConsultaRepasseItem = {
  id_consulta_short: string;
  paciente_nome: string;
  datahora: string;
  valor: number;
  taxa: number;
  valor_liquido: number;
};

export async function getConsultasDoRepasse(
  idRepasseTransacao: string
): Promise<ConsultaRepasseItem[]> {
  const service = createServiceClient();
  const { data: rt } = await service
    .from("repasse_transacao")
    .select("id_financeiro_lancamento")
    .eq("id", idRepasseTransacao)
    .maybeSingle();
  if (!rt) return [];
  const idLanc = (rt as { id_financeiro_lancamento: string }).id_financeiro_lancamento;
  const { data: lanc } = await service
    .from("financeiro_lancamento")
    .select("id_consulta, valor_consulta, taxa_medico_valor, repasse_liquido_medico")
    .eq("id", idLanc)
    .maybeSingle();
  if (!lanc) return [];
  const l = lanc as {
    id_consulta: string;
    valor_consulta: number;
    taxa_medico_valor: number;
    repasse_liquido_medico: number;
  };
  const { data: cons } = await service
    .from("consulta")
    .select("id, id_paciente, datahora")
    .eq("id", l.id_consulta)
    .maybeSingle();
  if (!cons) return [];
  const { data: user } = await service
    .from("user")
    .select("nome")
    .eq("id", (cons as { id_paciente: string }).id_paciente)
    .maybeSingle();
  const nome = (user as { nome: string | null } | null)?.nome ?? "—";
  const datahora = (cons as { datahora: string }).datahora;
  const [datePart, timePart] = datahora.slice(0, 19).split("T");
  const [y, mo, d] = datePart.split("-");
  const hora = timePart ? timePart.slice(0, 5).replace(":", "h") : "";
  const dataExib = `${d}/${mo} - ${hora}`;

  return [
    {
      id_consulta_short: `#${shortId(l.id_consulta)}`,
      paciente_nome: nome,
      datahora: dataExib,
      valor: Number(l.valor_consulta),
      taxa: Number(l.taxa_medico_valor),
      valor_liquido: Number(l.repasse_liquido_medico),
    },
  ];
}

