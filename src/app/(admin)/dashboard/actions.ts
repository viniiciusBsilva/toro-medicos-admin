"use server";

import { createServiceClient } from "@/lib/supabase/server";

/** anoMes: "YYYY-MM". Busca por cidade/estado pode filtrar (não implementado: usa só anoMes). */
export type DashboardData = {
  anoMes: string;
  // Dados de cadastros
  totalUsuarios: number;
  totalPacientes: number;
  totalMedicos: number;
  // Médicos por especialidade (bar)
  medicosPorEspecialidade: { especialidade: string; total: number }[];
  // Pacientes por faixa etária (bar)
  pacientesPorFaixaEtaria: { faixa: string; total: number }[];
  // Dados de uso
  consultasPlantao: number;
  consultasAgendadas: number;
  consultasReembolsadas: number;
  mediaConsultasPorMedico: number;
  valorMinimoPago: number;
  valorMaximoPago: number;
  // Pie: total consultas vs reembolsadas
  totalConsultas: number;
  totalReembolsadas: number;
  // Tabela: consultas por dia da semana (horário x dia)
  consultasPorDiaSemana: { horario: string; seg: number; ter: number; qua: number; qui: number; sex: number; sab: number; dom: number }[];
};

function faixaEtaria(dataNasc: string | null): string {
  if (!dataNasc) return "N/I";
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  if (anos < 0) return "0-10";
  if (anos <= 10) return "0-10";
  if (anos <= 20) return "11-20";
  if (anos <= 30) return "21-30";
  if (anos <= 40) return "31-40";
  if (anos <= 50) return "41-50";
  if (anos <= 60) return "51-60";
  if (anos <= 70) return "61-70";
  return "71+";
}

export async function getDashboardData(anoMes: string): Promise<DashboardData> {
  const service = createServiceClient();
  const [anoStr, mesStr] = anoMes.split("-");
  const ano = parseInt(anoStr!, 10);
  const mes = parseInt(mesStr!, 10);
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59);
  const fromStr = inicio.toISOString().slice(0, 19);
  const toStr = fim.toISOString().slice(0, 19);

  const [
    countUser,
    countPacientes,
    countMedicos,
    consultasRes,
    reembolsosRes,
    medicosAreaRes,
    pacientesNascRes,
    lancamentosRes,
  ] = await Promise.all([
    service.from("user").select("id", { count: "exact", head: true }),
    service.from("user_paciente").select("id", { count: "exact", head: true }),
    service.from("user_medico").select("id", { count: "exact", head: true }),
    service
      .from("consulta")
      .select("id, datahora, tipo, status, id_medico")
      .gte("datahora", fromStr)
      .lte("datahora", toStr),
    service
      .from("reembolso")
      .select("id")
      .gte("created_at", inicio.toISOString())
      .lte("created_at", fim.toISOString()),
    service.from("user_medico").select("id, area_atuacao"),
    service.from("user_paciente").select("id, data_nascimento"),
    service
      .from("financeiro_lancamento")
      .select("repasse_liquido_medico")
      .gte("competencia", inicio.toISOString().slice(0, 10))
      .lte("competencia", fim.toISOString().slice(0, 10)),
  ]);

  const totalUsuarios = countUser.count ?? 0;
  const totalPacientes = countPacientes.count ?? 0;
  const totalMedicos = countMedicos.count ?? 0;

  const consultas = (consultasRes.data ?? []) as Array<{ id: string; datahora: string; tipo: string; status: string; id_medico: string }>;
  const reembolsos = (reembolsosRes.data ?? []) as Array<{ id: string }>;
  const totalConsultas = consultas.length;
  const totalReembolsadas = reembolsos.length;

  let consultasPlantao = 0;
  let consultasAgendadas = 0;
  consultas.forEach((c) => {
    const t = String(c.tipo || "").toLowerCase();
    if (t.includes("plant") || t === "plantao") consultasPlantao++;
    else consultasAgendadas++;
  });
  if (consultasPlantao === 0 && consultasAgendadas === 0 && totalConsultas > 0) consultasAgendadas = totalConsultas;

  const medicosArea = (medicosAreaRes.data ?? []) as Array<{ area_atuacao: string | null }>;
  const espCount = new Map<string, number>();
  medicosArea.forEach((m) => {
    const esp = (m.area_atuacao ?? "Outros").trim() || "Outros";
    espCount.set(esp, (espCount.get(esp) ?? 0) + 1);
  });
  const medicosPorEspecialidade = Array.from(espCount.entries())
    .map(([especialidade, total]) => ({ especialidade, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  const pacientesNasc = (pacientesNascRes.data ?? []) as Array<{ data_nascimento: string | null }>;
  const faixaCount = new Map<string, number>();
  pacientesNasc.forEach((p) => {
    const f = faixaEtaria(p.data_nascimento);
    if (f !== "N/I") faixaCount.set(f, (faixaCount.get(f) ?? 0) + 1);
  });
  const ordemFaixas = ["0-10", "11-20", "21-30", "31-40", "41-50", "51-60", "61-70", "71+"];
  const pacientesPorFaixaEtaria = ordemFaixas.map((faixa) => ({
    faixa,
    total: faixaCount.get(faixa) ?? 0,
  }));

  const medicosQueAtenderam = new Set(consultas.map((c) => c.id_medico).filter(Boolean)).size;
  const mediaConsultasPorMedico =
    medicosQueAtenderam > 0 ? Math.round((totalConsultas / medicosQueAtenderam) * 10) / 10 : 0;

  const lancamentos = (lancamentosRes.data ?? []) as Array<{ repasse_liquido_medico: number }>;
  const valores = lancamentos.map((l) => Number(l.repasse_liquido_medico ?? 0)).filter((v) => v > 0);
  const valorMinimoPago = valores.length ? Math.min(...valores) : 0;
  const valorMaximoPago = valores.length ? Math.max(...valores) : 0;

  const horas = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const dias = [0, 1, 2, 3, 4, 5, 6];
  const matrix = new Map<string, number>();
  consultas.forEach((c) => {
    const d = new Date(c.datahora);
    const dia = d.getDay();
    const h = d.getHours();
    matrix.set(`${h}-${dia}`, (matrix.get(`${h}-${dia}`) ?? 0) + 1);
  });
  const consultasPorDiaSemana = horas.map((h) => {
    const horario = `${h}h`;
    const row: { horario: string; seg: number; ter: number; qua: number; qui: number; sex: number; sab: number; dom: number } = {
      horario,
      seg: 0,
      ter: 0,
      qua: 0,
      qui: 0,
      sex: 0,
      sab: 0,
      dom: 0,
    };
    const keys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    dias.forEach((dia) => {
      const k = keys[dia];
      (row as Record<string, number>)[k] = matrix.get(`${h}-${dia}`) ?? 0;
    });
    return row;
  });

  return {
    anoMes,
    totalUsuarios,
    totalPacientes,
    totalMedicos,
    medicosPorEspecialidade,
    pacientesPorFaixaEtaria,
    consultasPlantao,
    consultasAgendadas,
    consultasReembolsadas: totalReembolsadas,
    mediaConsultasPorMedico,
    valorMinimoPago,
    valorMaximoPago,
    totalConsultas,
    totalReembolsadas,
    consultasPorDiaSemana,
  };
}
