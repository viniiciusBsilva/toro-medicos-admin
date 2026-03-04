"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  IndicadoresFinanceiros,
  MediaPorEspecialidade,
  RepasseItem,
  ReembolsoItem,
  ConsultaRepasseItem,
} from "./actions";
import {
  getIndicadoresFinanceiros,
  updateTaxasAdministrativas,
  getMediaConsultasPorEspecialidade,
  listarRepasses,
  listarReembolsos,
  getConsultasDoRepasse,
} from "./actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function formatarMoeda(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

type Props = {
  initialAnoMes: string;
  initialIndicadores: IndicadoresFinanceiros;
  initialMedias: MediaPorEspecialidade[];
  initialRepasses: RepasseItem[];
  initialRepassesTotal: number;
  initialRepassesTotalPages: number;
  initialReembolsos: ReembolsoItem[];
  initialReembolsosTotal: number;
  initialReembolsosTotalPages: number;
};

export function FinanceiroClient({
  initialAnoMes,
  initialIndicadores,
  initialMedias,
  initialRepasses,
  initialRepassesTotal,
  initialRepassesTotalPages,
  initialReembolsos,
  initialReembolsosTotal,
  initialReembolsosTotalPages,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [anoMes, setAnoMes] = useState(initialAnoMes);
  const [indicadores, setIndicadores] = useState(initialIndicadores);
  const [medias, setMedias] = useState(initialMedias);
  const [aba, setAba] = useState<"repasses" | "reembolsos">("repasses");
  const [repasses, setRepasses] = useState(initialRepasses);
  const [repassesTotal, setRepassesTotal] = useState(initialRepassesTotal);
  const [repassesPage, setRepassesPage] = useState(1);
  const [repassesTotalPages, setRepassesTotalPages] = useState(initialRepassesTotalPages);
  const [reembolsos, setReembolsos] = useState(initialReembolsos);
  const [reembolsosTotal, setReembolsosTotal] = useState(initialReembolsosTotal);
  const [reembolsosPage, setReembolsosPage] = useState(1);
  const [reembolsosTotalPages, setReembolsosTotalPages] = useState(
    initialReembolsosTotalPages
  );
  const [isPending, startTransition] = useTransition();

  const [modalTaxasOpen, setModalTaxasOpen] = useState(false);
  const [editTaxaMedico, setEditTaxaMedico] = useState("");
  const [editTaxaPaciente, setEditTaxaPaciente] = useState("");
  const [salvandoTaxas, setSalvandoTaxas] = useState(false);

  const [modalConsultasOpen, setModalConsultasOpen] = useState(false);
  const [consultasRepasse, setConsultasRepasse] = useState<ConsultaRepasseItem[]>([]);

  const [ano, mes] = anoMes.split("-").map(Number);
  const mesLabel = MESES[mes - 1] ?? "—";

  function atualizarUrl(anoMesNext?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (anoMesNext) p.set("anoMes", anoMesNext);
    router.push(`/financeiro?${p.toString()}`, { scroll: false });
  }

  function handleMesAnterior() {
    const [a, m] = anoMes.split("-").map(Number);
    const novoMes = m === 1 ? 12 : m - 1;
    const novoAno = m === 1 ? a - 1 : a;
    const next = `${novoAno}-${String(novoMes).padStart(2, "0")}`;
    setAnoMes(next);
    atualizarUrl(next);
    recarregarTudo(next);
  }

  function handleProximoMes() {
    const [a, m] = anoMes.split("-").map(Number);
    const novoMes = m === 12 ? 1 : m + 1;
    const novoAno = m === 12 ? a + 1 : a;
    const next = `${novoAno}-${String(novoMes).padStart(2, "0")}`;
    setAnoMes(next);
    atualizarUrl(next);
    recarregarTudo(next);
  }

  function recarregarTudo(am: string) {
    startTransition(async () => {
      const [ind, mediasRes, rep, reemb] = await Promise.all([
        getIndicadoresFinanceiros(am),
        getMediaConsultasPorEspecialidade(am),
        listarRepasses(1, am, ""),
        listarReembolsos(1, am, ""),
      ]);
      setIndicadores(ind);
      setMedias(mediasRes);
      setRepasses(rep.repasses);
      setRepassesTotal(rep.total);
      setRepassesTotalPages(rep.totalPages);
      setRepassesPage(1);
      setReembolsos(reemb.reembolsos);
      setReembolsosTotal(reemb.total);
      setReembolsosTotalPages(reemb.totalPages);
      setReembolsosPage(1);
    });
  }

  function openModalTaxas() {
    setEditTaxaMedico(String(indicadores.taxa_medico_percent));
    setEditTaxaPaciente(String(indicadores.taxa_paciente_percent));
    setModalTaxasOpen(true);
  }

  async function salvarTaxas() {
    const med = parseFloat(editTaxaMedico.replace(",", "."));
    const pac = parseFloat(editTaxaPaciente.replace(",", "."));
    if (Number.isNaN(med) || Number.isNaN(pac) || med < 0 || med > 100 || pac < 0 || pac > 100) {
      toast.error("Informe percentuais entre 0 e 100.");
      return;
    }
    setSalvandoTaxas(true);
    const result = await updateTaxasAdministrativas(med, pac);
    setSalvandoTaxas(false);
    if (result.ok) {
      toast.success("Taxas atualizadas.");
      setIndicadores((prev) => ({ ...prev, taxa_medico_percent: med, taxa_paciente_percent: pac }));
      setModalTaxasOpen(false);
    } else {
      toast.error(result.error ?? "Erro ao salvar.");
    }
  }

  async function abrirModalConsultasRepasse(repasse: RepasseItem) {
    const list = await getConsultasDoRepasse(repasse.id);
    setConsultasRepasse(list);
    setModalConsultasOpen(true);
  }

  function trocarPaginaRepasses(pagina: number) {
    setRepassesPage(pagina);
    startTransition(async () => {
      const r = await listarRepasses(pagina, anoMes, "");
      setRepasses(r.repasses);
    });
  }

  function trocarPaginaReembolsos(pagina: number) {
    setReembolsosPage(pagina);
    startTransition(async () => {
      const r = await listarReembolsos(pagina, anoMes, "");
      setReembolsos(r.reembolsos);
    });
  }

  const chartData = useMemo(
    () => medias.slice(0, 12).map((m) => ({ especialidade: m.especialidade, media: Number(m.media.toFixed(2)) })),
    [medias]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#0E1015]">Gestão financeira</h1>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMesAnterior}
              className="flex items-center justify-center rounded-xl border border-outline bg-white p-2.5 text-[var(--text-lessImportantText)] hover:bg-muted/30 hover:text-[var(--text-bodyText)]"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="flex min-w-[7rem] items-center justify-center rounded-xl border border-outline bg-white px-4 py-2.5 text-sm font-medium text-[var(--text-bodyText)]">
              {mesLabel}
            </span>
            <button
              type="button"
              onClick={handleProximoMes}
              className="flex items-center justify-center rounded-xl border border-outline bg-white p-2.5 text-[var(--text-lessImportantText)] hover:bg-muted/30 hover:text-[var(--text-bodyText)]"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Indicadores financeiros: labels Body/Medium/Regular; valores Heading/Extra Small/Bold */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#0E1015]">Indicadores financeiros</h2>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-outline bg-surface p-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-normal leading-[1.5] text-[var(--text-lessImportantText)]"
                style={{ fontSize: "var(--font-size-body-md, 16px)" }}
              >
                Taxas administrativas das consultas
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openModalTaxas}
                className="gap-1 shrink-0"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>
            <p
              className="mt-1 font-bold leading-normal text-[var(--text-bodyText)]"
              style={{ fontSize: "var(--font-size-heading-xs, 20px)" }}
            >
              {indicadores.taxa_medico_percent}% (médico)
            </p>
            <p
              className="font-bold leading-normal text-[var(--text-bodyText)]"
              style={{ fontSize: "var(--font-size-heading-xs, 20px)" }}
            >
              {indicadores.taxa_paciente_percent}% (paciente)
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-outline bg-surface p-4 shadow-sm">
            <p
              className="font-normal leading-[1.5] text-[var(--text-lessImportantText)]"
              style={{ fontSize: "var(--font-size-body-md, 16px)" }}
            >
              Taxa administrativa recebida
            </p>
            <p
              className="mt-1 font-bold leading-normal text-[var(--text-bodyText)]"
              style={{ fontSize: "var(--font-size-heading-xs, 20px)" }}
            >
              {formatarMoeda(indicadores.taxa_administrativa_recebida)}
            </p>
          </div>
          <div className="rounded-xl border border-outline bg-surface p-4 shadow-sm">
            <p
              className="font-normal leading-[1.5] text-[var(--text-lessImportantText)]"
              style={{ fontSize: "var(--font-size-body-md, 16px)" }}
            >
              Total recebido por consultas
            </p>
            <p
              className="mt-1 font-bold leading-normal text-[var(--text-bodyText)]"
              style={{ fontSize: "var(--font-size-heading-xs, 20px)" }}
            >
              {formatarMoeda(indicadores.total_recebido_consultas)}
            </p>
          </div>
          <div className="rounded-xl border border-outline bg-surface p-4 shadow-sm">
            <p
              className="font-normal leading-[1.5] text-[var(--text-lessImportantText)]"
              style={{ fontSize: "var(--font-size-body-md, 16px)" }}
            >
              Total plantão
            </p>
            <p
              className="mt-1 font-bold leading-normal text-[var(--text-bodyText)]"
              style={{ fontSize: "var(--font-size-heading-xs, 20px)" }}
            >
              {formatarMoeda(indicadores.total_plantao)}
            </p>
          </div>
          <div className="rounded-xl border border-outline bg-surface p-4 shadow-sm">
            <p
              className="font-normal leading-[1.5] text-[var(--text-lessImportantText)]"
              style={{ fontSize: "var(--font-size-body-md, 16px)" }}
            >
              Total agendamentos
            </p>
            <p
              className="mt-1 font-bold leading-normal text-[var(--text-bodyText)]"
              style={{ fontSize: "var(--font-size-heading-xs, 20px)" }}
            >
              {formatarMoeda(indicadores.total_agendamentos)}
            </p>
          </div>
          <div className="rounded-xl border border-outline bg-surface p-4 shadow-sm">
            <p
              className="font-normal leading-[1.5] text-[var(--text-lessImportantText)]"
              style={{ fontSize: "var(--font-size-body-md, 16px)" }}
            >
              Total reembolsado
            </p>
            <p
              className="mt-1 font-bold leading-normal text-[var(--text-bodyText)]"
              style={{ fontSize: "var(--font-size-heading-xs, 20px)" }}
            >
              {formatarMoeda(indicadores.total_reembolsado)}
            </p>
          </div>
          <div className="rounded-xl border border-outline bg-surface p-4 shadow-sm">
            <p
              className="font-normal leading-[1.5] text-[var(--text-lessImportantText)]"
              style={{ fontSize: "var(--font-size-body-md, 16px)" }}
            >
              Valor líquido da taxa recebida
            </p>
            <p
              className="mt-1 font-bold leading-normal text-[var(--text-bodyText)]"
              style={{ fontSize: "var(--font-size-heading-xs, 20px)" }}
            >
              {formatarMoeda(indicadores.valor_liquido_taxa)}
            </p>
          </div>
        </div>
      </section>

      {/* Gráfico: valor médio por especialidade (Recharts BarChart) */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#0E1015]">
          Valor médio das consultas por especialidade
        </h2>
        <div className="rounded-xl border border-outline bg-surface p-6 shadow-sm">
          {chartData.length === 0 ? (
            <p className="text-sm text-text-secondary">Nenhum dado no período.</p>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis
                    dataKey="especialidade"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 12, fill: "var(--text-lessImportantText)" }}
                    tickFormatter={(value) => value}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12, fill: "var(--text-lessImportantText)" }}
                    tickFormatter={(value) => formatarMoeda(value)}
                  />
                  <Tooltip
                    cursor={undefined}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-outline bg-surface px-3 py-2 shadow-sm">
                          <p className="text-xs font-normal text-[var(--text-lessImportantText)]">
                            Média por consulta
                          </p>
                          <p className="text-sm font-bold text-[var(--text-bodyText)]">
                            {formatarMoeda(item.media)}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-lessImportantText)]">
                            {item.especialidade}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="media"
                    fill="var(--chart-1)"
                    radius={[8, 8, 0, 0]}
                    name="Média"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Tabs: Repasses | Reembolsos */}
      <section>
        <div className="mb-4 flex gap-6 border-b border-outline">
          <button
            type="button"
            onClick={() => setAba("repasses")}
            className={cn(
              "pb-3 text-sm font-medium transition-colors",
              aba === "repasses"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            Repasses
          </button>
          <button
            type="button"
            onClick={() => setAba("reembolsos")}
            className={cn(
              "pb-3 text-sm font-medium transition-colors",
              aba === "reembolsos"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            Reembolsos
          </button>
        </div>

        {aba === "repasses" && (
          <div className="rounded-xl border border-outline bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline bg-muted/30">
                    <th className="px-4 py-3 font-medium text-[#0E1015]">ID</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">Médico</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">CRM</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">Data e hora</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">Valor</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]"></th>
                  </tr>
                </thead>
                <tbody>
                  {repasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                        Nenhum repasse no período.
                      </td>
                    </tr>
                  ) : (
                    repasses.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-outline last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 text-[#0E1015]">{r.id_short}</td>
                        <td className="px-4 py-3 text-[#0E1015]">{r.medico_nome}</td>
                        <td className="px-4 py-3 text-text-secondary">{r.crm}</td>
                        <td className="px-4 py-3 text-text-secondary">{r.datahora}</td>
                        <td className="px-4 py-3 font-medium text-[#0E1015]">
                          {formatarMoeda(r.valor)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/10"
                            onClick={() => abrirModalConsultasRepasse(r)}
                          >
                            Ver consultas
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {repassesTotalPages > 1 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-outline px-4 py-3">
                <span className="text-sm text-text-secondary">Páginas</span>
                {Array.from({ length: Math.min(5, repassesTotalPages) }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => trocarPaginaRepasses(p)}
                      disabled={isPending}
                      className={cn(
                        "rounded px-2 py-1 text-sm font-medium",
                        repassesPage === p
                          ? "bg-primary text-primary-foreground"
                          : "text-text-secondary hover:bg-muted hover:text-text-primary"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                {repassesTotalPages > 5 && (
                  <span className="text-sm text-text-secondary">... {repassesTotalPages}</span>
                )}
              </div>
            )}
          </div>
        )}

        {aba === "reembolsos" && (
          <div className="rounded-xl border border-outline bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline bg-muted/30">
                    <th className="px-4 py-3 font-medium text-[#0E1015]">ID reembolso</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">Paciente</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">ID paciente</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">Data e hora</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">Valor</th>
                    <th className="px-4 py-3 font-medium text-[#0E1015]">ID consulta</th>
                  </tr>
                </thead>
                <tbody>
                  {reembolsos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                        Nenhum reembolso no período.
                      </td>
                    </tr>
                  ) : (
                    reembolsos.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-outline last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 text-[#0E1015]">{r.id_short}</td>
                        <td className="px-4 py-3 text-[#0E1015]">{r.paciente_nome}</td>
                        <td className="px-4 py-3 text-text-secondary">{r.id_paciente_short}</td>
                        <td className="px-4 py-3 text-text-secondary">{r.datahora}</td>
                        <td className="px-4 py-3 font-medium text-[#0E1015]">
                          {formatarMoeda(r.valor)}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{r.id_consulta_short}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {reembolsosTotalPages > 1 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-outline px-4 py-3">
                <span className="text-sm text-text-secondary">Páginas</span>
                {Array.from({ length: Math.min(5, reembolsosTotalPages) }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => trocarPaginaReembolsos(p)}
                      disabled={isPending}
                      className={cn(
                        "rounded px-2 py-1 text-sm font-medium",
                        reembolsosPage === p
                          ? "bg-primary text-primary-foreground"
                          : "text-text-secondary hover:bg-muted hover:text-text-primary"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                {reembolsosTotalPages > 5 && (
                  <span className="text-sm text-text-secondary">... {reembolsosTotalPages}</span>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal: Taxas administrativas */}
      <Dialog open={modalTaxasOpen} onOpenChange={setModalTaxasOpen}>
        <DialogContent showClose className="max-w-md">
          <DialogHeader>
            <DialogTitle>Taxas administrativas das consultas</DialogTitle>
            <DialogDescription className="sr-only">
              Editar percentuais de taxa para médico e paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="taxa-medico" className="font-semibold text-[#0E1015]">
                Médico
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="taxa-medico"
                  type="text"
                  inputMode="decimal"
                  value={editTaxaMedico}
                  onChange={(e) => setEditTaxaMedico(e.target.value.replace(/[^0-9,.]/g, ""))}
                  placeholder="5"
                  className="w-24"
                />
                <span className="text-sm text-text-secondary">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxa-paciente" className="font-semibold text-[#0E1015]">
                Paciente
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="taxa-paciente"
                  type="text"
                  inputMode="decimal"
                  value={editTaxaPaciente}
                  onChange={(e) => setEditTaxaPaciente(e.target.value.replace(/[^0-9,.]/g, ""))}
                  placeholder="3"
                  className="w-24"
                />
                <span className="text-sm text-text-secondary">%</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setModalTaxasOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary-hover"
              onClick={salvarTaxas}
              disabled={salvandoTaxas}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Consultas incluídas nos repasses */}
      <Dialog open={modalConsultasOpen} onOpenChange={setModalConsultasOpen}>
        <DialogContent showClose className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Consultas incluídas nos repasses</DialogTitle>
            <DialogDescription className="sr-only">
              Lista de consultas incluídas no repasse selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto py-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline">
                  <th className="pb-2 font-medium text-[#0E1015]">ID</th>
                  <th className="pb-2 font-medium text-[#0E1015]">Paciente</th>
                  <th className="pb-2 font-medium text-[#0E1015]">Data/Hora</th>
                  <th className="pb-2 font-medium text-[#0E1015]">Valor</th>
                  <th className="pb-2 font-medium text-[#0E1015]">Taxa</th>
                  <th className="pb-2 font-medium text-[#0E1015]">Valor líquido</th>
                </tr>
              </thead>
              <tbody>
                {consultasRepasse.map((c, idx) => (
                  <tr key={`${c.id_consulta_short}-${idx}`} className="border-b border-outline last:border-0">
                    <td className="py-2 text-[#0E1015]">{c.id_consulta_short}</td>
                    <td className="py-2 text-[#0E1015]">{c.paciente_nome}</td>
                    <td className="py-2 text-text-secondary">{c.datahora}</td>
                    <td className="py-2 text-[#0E1015]">{formatarMoeda(c.valor)}</td>
                    <td className="py-2 text-[#0E1015]">{formatarMoeda(c.taxa)}</td>
                    <td className="py-2 font-medium text-[#0E1015]">
                      {formatarMoeda(c.valor_liquido)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {consultasRepasse.length === 0 && (
              <p className="py-4 text-center text-text-secondary">Nenhuma consulta.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
