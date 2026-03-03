"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Pie, PieChart } from "recharts";
import type { DashboardData } from "./actions";
import { getDashboardData } from "./actions";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatarMoeda(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const chartConfigMedicos: ChartConfig = {
  total: { label: "Médicos", color: "var(--chart-1)" },
};

const chartConfigFaixa: ChartConfig = {
  total: { label: "Pacientes", color: "var(--chart-1)" },
};

const chartConfigPie: ChartConfig = {
  total: { label: "Total", color: "var(--chart-1)" },
  reembolsadas: { label: "Reembolsadas", color: "var(--chart-2)" },
};

type Props = {
  initialData: DashboardData;
  initialAnoMes: string;
};

export function DashboardClient({ initialData, initialAnoMes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [anoMes, setAnoMes] = useState(initialAnoMes);
  const [busca, setBusca] = useState(searchParams.get("q") ?? "");
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const [ano, mes] = anoMes.split("-").map(Number);
  const mesLabel = MESES[mes - 1] ?? "—";

  function atualizarUrl(nextAnoMes: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("anoMes", nextAnoMes);
    if (busca) p.set("q", busca);
    else p.delete("q");
    router.push(`/dashboard?${p.toString()}`, { scroll: false });
  }

  function handleMesAnterior() {
    const d = new Date(ano, mes - 2, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setAnoMes(next);
    atualizarUrl(next);
    startTransition(async () => {
      const d = await getDashboardData(next);
      setData(d);
    });
  }

  function handleProximoMes() {
    const d = new Date(ano, mes, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setAnoMes(next);
    atualizarUrl(next);
    startTransition(async () => {
      const d = await getDashboardData(next);
      setData(d);
    });
  }

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(searchParams.toString());
    busca ? p.set("q", busca) : p.delete("q");
    router.push(`/dashboard?${p.toString()}`, { scroll: false });
  }

  const percentReembolsadas =
    data.totalConsultas > 0
      ? Math.round((data.totalReembolsadas / data.totalConsultas) * 100)
      : 0;

  const pieData = [
    { name: "Total de consultas", value: data.totalConsultas, fill: "var(--chart-2)" },
    { name: "Consultas reembolsadas", value: data.totalReembolsadas, fill: "var(--chart-1)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#0E1015]">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleBusca} className="min-w-0 flex-1">
            <div className="relative">
              <Input
                type="search"
                placeholder="Pesquisar por cidade ou estado"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-11 w-full rounded-full border border-outline bg-white pl-4 pr-11 text-[var(--text-bodyText)] placeholder:text-[var(--text-lessImportantText)]"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-lessImportantText)]" />
            </div>
          </form>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMesAnterior}
              disabled={isPending}
              className="flex items-center justify-center rounded-xl border border-outline bg-white p-2.5 text-[var(--text-lessImportantText)] hover:bg-muted/30 hover:text-[var(--text-bodyText)] disabled:opacity-50"
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
              disabled={isPending}
              className="flex items-center justify-center rounded-xl border border-outline bg-white p-2.5 text-[var(--text-lessImportantText)] hover:bg-muted/30 hover:text-[var(--text-bodyText)] disabled:opacity-50"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Dados de cadastros */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#0E1015]">Dados de cadastros</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Total de usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{data.totalUsuarios}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Total de pacientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{data.totalPacientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Total de médicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{data.totalMedicos}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Médicos por especialidade */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#0E1015]">Médicos por especialidade</h2>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfigMedicos} className="h-[280px] w-full">
              <BarChart data={data.medicosPorEspecialidade}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="especialidade"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--text-lessImportantText)" }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--text-lessImportantText)" }} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      {/* Total de pacientes por faixa etária */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#0E1015]">Total de pacientes por faixa etária</h2>
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfigFaixa} className="h-[280px] w-full">
              <BarChart data={data.pacientesPorFaixaEtaria}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="faixa"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--text-lessImportantText)" }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--text-lessImportantText)" }} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      {/* Dados de uso de plataforma */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#0E1015]">Dados de uso de plataforma</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Consultas de plantão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{data.consultasPlantao}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Consultas agendadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{data.consultasAgendadas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Consultas reembolsadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{data.consultasReembolsadas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Média de consultas/médico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{data.mediaConsultasPorMedico}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Valor mínimo pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{formatarMoeda(data.valorMinimoPago)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-normal text-[var(--text-lessImportantText)]">
                Valor máximo pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--text-bodyText)]">{formatarMoeda(data.valorMaximoPago)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* % consultas reembolsadas vs total */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#0E1015]">
          % de consultas reembolsadas vs total de consultas
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row">
            <ChartContainer
              config={chartConfigPie}
              className="mx-auto aspect-square max-h-[250px] [&_.recharts-pie-label-text]:fill-foreground"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieData.length ? pieData : [{ name: "Nenhum", value: 1, fill: "var(--chart-2)" }]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={0}
                />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col justify-center gap-2 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[var(--chart-2)]" />
                  <span className="text-[var(--text-lessImportantText)]">
                    Total de consultas - {data.totalConsultas} ({100 - percentReembolsadas}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[var(--chart-1)]" />
                  <span className="text-[var(--text-lessImportantText)]">
                    Consultas reembolsadas - {data.totalReembolsadas} ({percentReembolsadas}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Total de consultas por dia da semana */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#0E1015]">Total de consultas por dia da semana</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline bg-muted/30 font-semibold text-[#0E1015]">
                    <th className="px-4 py-3">Horário</th>
                    <th className="px-4 py-3">Segunda</th>
                    <th className="px-4 py-3">Terça</th>
                    <th className="px-4 py-3">Quarta</th>
                    <th className="px-4 py-3">Quinta</th>
                    <th className="px-4 py-3">Sexta</th>
                    <th className="px-4 py-3">Sábado</th>
                    <th className="px-4 py-3">Domingo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.consultasPorDiaSemana.map((row) => (
                    <tr key={row.horario} className="border-b border-outline last:border-0">
                      <td className="px-4 py-2 font-medium text-[#0E1015]">{row.horario}</td>
                      <td className="px-4 py-2 text-[var(--text-lessImportantText)]">{row.seg || "—"}</td>
                      <td className="px-4 py-2 text-[var(--text-lessImportantText)]">{row.ter || "—"}</td>
                      <td className="px-4 py-2 text-[var(--text-lessImportantText)]">{row.qua || "—"}</td>
                      <td className="px-4 py-2 text-[var(--text-lessImportantText)]">{row.qui || "—"}</td>
                      <td className="px-4 py-2 text-[var(--text-lessImportantText)]">{row.sex || "—"}</td>
                      <td className="px-4 py-2 text-[var(--text-lessImportantText)]">{row.sab || "—"}</td>
                      <td className="px-4 py-2 text-[var(--text-lessImportantText)]">{row.dom || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
