"use client";

import { jsPDF } from "jspdf";

const MARGEM = 20;
const LINHA_ALTURA = 6;
const FONTE_NORMAL = 11;
const FONTE_TITULO = 14;

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function dataAtual(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type DadosCabecalho = {
  medico_nome: string | null;
  paciente_nome: string;
  data_emissao: string;
};

function desenharCabecalho(
  doc: jsPDF,
  titulo: string,
  dados: DadosCabecalho
): number {
  let y = MARGEM;
  const maxWidth = doc.getPageWidth() - MARGEM * 2;

  doc.setFontSize(FONTE_TITULO);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, MARGEM, y);
  y += LINHA_ALTURA * 1.5;

  doc.setFontSize(FONTE_NORMAL);
  doc.setFont("helvetica", "normal");
  doc.text(`Médico: ${dados.medico_nome ?? "—"}`, MARGEM, y);
  y += LINHA_ALTURA;
  doc.text(`Paciente: ${dados.paciente_nome}`, MARGEM, y);
  y += LINHA_ALTURA;
  doc.text(`Data: ${formatarData(dados.data_emissao)}`, MARGEM, y);
  y += LINHA_ALTURA * 1.5;

  return y;
}

function desenharRodape(doc: jsPDF, y: number): void {
  const pageHeight = doc.getPageHeight();
  if (y > pageHeight - MARGEM - LINHA_ALTURA * 2) {
    doc.addPage();
    y = MARGEM;
  }
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Documento gerado pelo app - ${dataAtual()}`, MARGEM, y);
  doc.setTextColor(0, 0, 0);
}

function quebraPaginaSeNecessario(doc: jsPDF, y: number, margemMinima = 30): number {
  const pageHeight = doc.getPageHeight();
  if (y > pageHeight - MARGEM - margemMinima) {
    doc.addPage();
    return MARGEM;
  }
  return y;
}

// --- Receita (tabela de medicamentos) ---

type MedicamentoItem = {
  medicamento?: string;
  dosagem?: string;
  via?: string;
  posologia?: string;
  duracao?: string;
  qtd_obs?: string;
};

type ReceitaJson = {
  medicamentos?: MedicamentoItem[];
};

const COLUNAS_RECEITA = ["Medicamento", "Dosagem", "Via", "Posologia", "Duração", "Qtd/Obs"] as const;
const LARGURAS_RECEITA = [40, 28, 22, 28, 22, 35];

export function gerarPdfReceita(
  conteudo: string | null,
  conteudoJson: unknown | null,
  cabecalho: DadosCabecalho
): Blob | null {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = desenharCabecalho(doc, "RECEITA MÉDICA", cabecalho);

  const json = conteudoJson as ReceitaJson | null;
  const medicamentos = json?.medicamentos;

  if (medicamentos?.length) {
    doc.setFontSize(FONTE_NORMAL);
    doc.setFont("helvetica", "bold");
    const colW = LARGURAS_RECEITA;
    const startX = MARGEM;
    let x = startX;
    COLUNAS_RECEITA.forEach((col, i) => {
      doc.text(col, x, y);
      x += colW[i];
    });
    y += LINHA_ALTURA;
    doc.setFont("helvetica", "normal");

    for (const m of medicamentos) {
      y = quebraPaginaSeNecessario(doc, y, 20);
      x = startX;
      const valores = [
        m.medicamento ?? "",
        m.dosagem ?? "",
        m.via ?? "",
        m.posologia ?? "",
        m.duracao ?? "",
        m.qtd_obs ?? "",
      ];
      valores.forEach((v, i) => {
        const trechos = doc.splitTextToSize(v || " ", colW[i] - 2);
        doc.text(trechos[0] ?? " ", x, y);
        x += colW[i];
      });
      y += LINHA_ALTURA;
    }
    y += LINHA_ALTURA;
  } else if (conteudo?.trim()) {
    const linhas = conteudo.trim().split(/\r?\n/);
    for (const linha of linhas) {
      y = quebraPaginaSeNecessario(doc, y);
      const trechos = doc.splitTextToSize(linha, doc.getPageWidth() - MARGEM * 2);
      for (const t of trechos) {
        doc.text(t, MARGEM, y);
        y += LINHA_ALTURA;
      }
    }
  } else {
    return null;
  }

  y = quebraPaginaSeNecessario(doc, y);
  desenharRodape(doc, y);
  return doc.output("blob");
}

// --- Atestado ---

type AtestadoJson = {
  afastamento_dias?: number | string;
  observacoes?: string;
};

export function gerarPdfAtestado(
  conteudo: string | null,
  conteudoJson: unknown | null,
  cabecalho: DadosCabecalho
): Blob | null {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const maxWidth = doc.getPageWidth() - MARGEM * 2;
  let y = desenharCabecalho(doc, "ATESTADO MÉDICO", cabecalho);

  const json = conteudoJson as AtestadoJson | null;
  const dias = json?.afastamento_dias != null ? String(json.afastamento_dias) : "";
  const observacoes = json?.observacoes?.trim() ?? "";

  const textoAtesto =
    "Atesto, para os devidos fins, que o(a) paciente acima esteve sob meus cuidados nesta data, sendo necessário " +
    "o afastamento de suas atividades por [X] dias, a contar de [data].";
  const trechosAtesto = doc.splitTextToSize(textoAtesto, maxWidth);
  for (const t of trechosAtesto) {
    y = quebraPaginaSeNecessario(doc, y);
    doc.text(t, MARGEM, y);
    y += LINHA_ALTURA;
  }
  y += LINHA_ALTURA * 0.5;

  if (dias) {
    y = quebraPaginaSeNecessario(doc, y);
    doc.text(`Afasto: ${dias} dia(s).`, MARGEM, y);
    y += LINHA_ALTURA * 1.5;
  }

  if (observacoes) {
    y = quebraPaginaSeNecessario(doc, y);
    doc.text("Observações:", MARGEM, y);
    y += LINHA_ALTURA;
    const trechosObs = doc.splitTextToSize(observacoes, maxWidth);
    for (const t of trechosObs) {
      y = quebraPaginaSeNecessario(doc, y);
      doc.text(t, MARGEM, y);
      y += LINHA_ALTURA;
    }
  } else if (conteudo?.trim()) {
    y += LINHA_ALTURA * 0.5;
    const linhas = conteudo.trim().split(/\r?\n/);
    for (const linha of linhas) {
      y = quebraPaginaSeNecessario(doc, y);
      const trechos = doc.splitTextToSize(linha, maxWidth);
      for (const t of trechos) {
        doc.text(t, MARGEM, y);
        y += LINHA_ALTURA;
      }
    }
  }

  y = quebraPaginaSeNecessario(doc, y);
  desenharRodape(doc, y);
  return doc.output("blob");
}

// --- Pedido de exame ---

type PedidoExameJson = {
  exames?: string[] | string;
  hipotese_diagnostica?: string;
};

export function gerarPdfPedidoExame(
  conteudo: string | null,
  conteudoJson: unknown | null,
  cabecalho: DadosCabecalho
): Blob | null {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const maxWidth = doc.getPageWidth() - MARGEM * 2;
  let y = desenharCabecalho(doc, "PEDIDO DE EXAME", cabecalho);

  const json = conteudoJson as PedidoExameJson | null;
  const examesArr = json?.exames
    ? Array.isArray(json.exames)
      ? (json.exames as string[])
      : [String(json.exames)]
    : [];
  const hipotese = json?.hipotese_diagnostica?.trim() ?? "";

  if (examesArr.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Exames solicitados:", MARGEM, y);
    y += LINHA_ALTURA;
    doc.setFont("helvetica", "normal");
    for (const ex of examesArr) {
      if (ex?.trim()) {
        y = quebraPaginaSeNecessario(doc, y);
        doc.text(ex.trim(), MARGEM + 5, y);
        y += LINHA_ALTURA;
      }
    }
    y += LINHA_ALTURA * 0.5;
  }

  if (hipotese) {
    y = quebraPaginaSeNecessario(doc, y);
    doc.setFont("helvetica", "bold");
    doc.text("Hipótese diagnóstica:", MARGEM, y);
    y += LINHA_ALTURA;
    doc.setFont("helvetica", "normal");
    const trechos = doc.splitTextToSize(hipotese, maxWidth);
    for (const t of trechos) {
      y = quebraPaginaSeNecessario(doc, y);
      doc.text(t, MARGEM, y);
      y += LINHA_ALTURA;
    }
    y += LINHA_ALTURA;
  }

  if (examesArr.length === 0 && !hipotese && conteudo?.trim()) {
    const linhas = conteudo.trim().split(/\r?\n/);
    for (const linha of linhas) {
      y = quebraPaginaSeNecessario(doc, y);
      const trechos = doc.splitTextToSize(linha, maxWidth);
      for (const t of trechos) {
        doc.text(t, MARGEM, y);
        y += LINHA_ALTURA;
      }
    }
  } else if (examesArr.length === 0 && !hipotese) {
    return null;
  }

  y = quebraPaginaSeNecessario(doc, y);
  desenharRodape(doc, y);
  return doc.output("blob");
}

// --- API unificada (fallback para formato antigo) ---

/**
 * Gera PDF do documento. Usa layout específico para receita, atestado e pedido_exame quando há cabecalho e conteudo_json compatível.
 */
export function gerarPdfDocumento(
  tipo: "receita" | "atestado" | "pedido_exame",
  conteudo: string | null,
  conteudoJson: unknown | null,
  cabecalho: DadosCabecalho
): Blob | null {
  if (tipo === "receita") {
    const blob = gerarPdfReceita(conteudo, conteudoJson, cabecalho);
    if (blob) return blob;
  } else if (tipo === "atestado") {
    const blob = gerarPdfAtestado(conteudo, conteudoJson, cabecalho);
    if (blob) return blob;
  } else if (tipo === "pedido_exame") {
    const blob = gerarPdfPedidoExame(conteudo, conteudoJson, cabecalho);
    if (blob) return blob;
  }

  // Fallback: conteúdo bruto
  const texto = obterTextoParaPdf(conteudo, conteudoJson);
  if (!texto?.trim()) return null;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageHeight = doc.getPageHeight();
  const maxWidth = doc.getPageWidth() - MARGEM * 2;
  let y = desenharCabecalho(doc, tipo === "receita" ? "RECEITA MÉDICA" : tipo === "atestado" ? "ATESTADO MÉDICO" : "PEDIDO DE EXAME", cabecalho);
  const linhas = texto.split(/\r?\n/);
  for (const linha of linhas) {
    const trechos = doc.splitTextToSize(linha || " ", maxWidth);
    for (const t of trechos) {
      if (y > pageHeight - MARGEM - LINHA_ALTURA) {
        doc.addPage();
        y = MARGEM;
      }
      doc.text(t, MARGEM, y);
      y += LINHA_ALTURA;
    }
  }
  desenharRodape(doc, y);
  return doc.output("blob");
}

function obterTextoParaPdf(conteudo: string | null, conteudoJson: unknown | null): string | null {
  if (conteudo?.trim()) return conteudo.trim();
  if (conteudoJson == null) return null;
  if (typeof conteudoJson === "string") return conteudoJson.trim();
  if (typeof conteudoJson === "object") {
    return formatarJsonParaTexto(conteudoJson as Record<string, unknown>);
  }
  return String(conteudoJson);
}

function formatarJsonParaTexto(obj: Record<string, unknown>, indent = ""): string {
  const linhas: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      linhas.push(`${indent}${label}:`);
      for (const item of value) {
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          linhas.push(formatarJsonParaTexto(item as Record<string, unknown>, indent + "  "));
        } else {
          linhas.push(`${indent}  - ${String(item)}`);
        }
      }
    } else if (typeof value === "object" && value !== null) {
      linhas.push(`${indent}${label}:`);
      linhas.push(formatarJsonParaTexto(value as Record<string, unknown>, indent + "  "));
    } else {
      linhas.push(`${indent}${label}: ${String(value)}`);
    }
  }
  return linhas.join("\n");
}

/** Retorna true se o documento tem dados para exibir (arquivo ou conteúdo para PDF). */
export function documentoTemDados(doc: {
  arquivo_url: string | null;
  conteudo?: string | null;
  conteudo_json?: unknown | null;
}): boolean {
  if (doc.arquivo_url) return true;
  const temConteudo = (doc.conteudo ?? "").trim().length > 0;
  const j = doc.conteudo_json;
  const temJson =
    j != null &&
    (typeof j !== "object" ||
      (Array.isArray(j) && j.length > 0) ||
      (!Array.isArray(j) && Object.keys(j).length > 0));
  return temConteudo || temJson;
}
