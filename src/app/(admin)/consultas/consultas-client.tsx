"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ListaConsultasResult } from "./actions";

const STATUS_BADGE: Record<string, string> = {
  realizada: "bg-[#D2E8B0]",
  agendada: "bg-[#FEE59A]",
  cancelada: "bg-[#FFC599]",
};

const STATUS_LABEL: Record<string, string> = {
  realizada: "Realizada",
  agendada: "Agendada",
  cancelada: "Cancelada",
};

function formatCpf(cpf: string | null): string {
  if (!cpf || !cpf.trim()) return "—";
  const d = cpf.replace(/\D/g, "");
  if (d.length >= 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return cpf;
}

function formatValor(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function BadgeStatus({ status }: { status: string }) {
  const key = status?.toLowerCase() ?? "agendada";
  const bg = STATUS_BADGE[key] ?? "bg-[#FEE59A]";
  const label = STATUS_LABEL[key] ?? status ?? "Agendada";
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-medium text-[#0E1015] ${bg}`}>
      {label}
    </span>
  );
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Props = {
  initialData: ListaConsultasResult;
  initialAnoMes: string;
};

export function ConsultasClient({ initialData, initialAnoMes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [localSearch, setLocalSearch] = useState(searchParams.get("q") ?? "");
  const [ano, mes] = initialAnoMes.split("-").map(Number);
  const mesLabel = MESES[mes - 1] ?? "—";

  const { consultas, page, totalPages } = initialData;

  function buildParams(updates: { page?: number; q?: string; anoMes?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (updates.page !== undefined) {
      if (updates.page > 1) p.set("page", String(updates.page));
      else p.delete("page");
    }
    if (updates.q !== undefined) {
      if (updates.q) p.set("q", updates.q);
      else p.delete("q");
    }
    if (updates.anoMes !== undefined) p.set("anoMes", updates.anoMes);
    return p.toString();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(`/consultas?${buildParams({ q: localSearch.trim() || undefined, page: 1 })}`);
    });
  }

  function prevMonth() {
    const d = new Date(ano, mes - 2, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    startTransition(() => router.push(`/consultas?${buildParams({ anoMes: next, page: 1 })}`));
  }

  function nextMonth() {
    const d = new Date(ano, mes, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    startTransition(() => router.push(`/consultas?${buildParams({ anoMes: next, page: 1 })}`));
  }

  const pageNumbers: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("ellipsis");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (!pageNumbers.includes(i)) pageNumbers.push(i);
    }
    if (page < totalPages - 2) pageNumbers.push("ellipsis");
    if (totalPages > 1) pageNumbers.push(totalPages);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="relative">
            <Input
              type="search"
              placeholder="Pesquisar por nome ou e-mail"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="h-11 w-full rounded-full border border-outline bg-white pl-4 pr-11 text-[var(--text-bodyText)] placeholder:text-[var(--text-lessImportantText)]"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-lessImportantText)]" />
          </div>
        </form>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
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
            onClick={nextMonth}
            disabled={isPending}
            className="flex items-center justify-center rounded-xl border border-outline bg-white p-2.5 text-[var(--text-lessImportantText)] hover:bg-muted/30 hover:text-[var(--text-bodyText)] disabled:opacity-50"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline font-semibold text-[#0E1015]">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">CPF</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Profissional CRM</th>
                  <th className="px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-outline last:border-b-0 transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/consultas/${c.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#0E1015]">{c.id_short}</span>
                    </td>
                    <td className="px-4 py-3">
                      <BadgeStatus status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-[#0E1015]">{c.paciente_nome}</td>
                    <td className="px-4 py-3 text-[#0E1015]">{formatCpf(c.paciente_cpf)}</td>
                    <td className="px-4 py-3 text-[#0E1015]">{c.data}</td>
                    <td className="px-4 py-3 text-[#0E1015]">{c.horario}</td>
                    <td className="px-4 py-3 text-[#0E1015]">{c.profissional_crm}</td>
                    <td className="px-4 py-3 text-[#0E1015]">{formatValor(c.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {consultas.length === 0 && (
            <p className="px-4 py-8 text-center text-text-secondary">Nenhuma consulta encontrada.</p>
          )}
        </CardContent>
      </Card>

      {totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">Páginas</p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page <= 1 || isPending}
              onClick={() => router.push(`/consultas?${buildParams({ page: page - 1 })}`)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((n, i) =>
              n === "ellipsis" ? (
                <span key={`e-${i}`} className="px-2 text-text-secondary">
                  ...
                </span>
              ) : (
                <Button
                  key={n}
                  type="button"
                  variant={page === n ? "default" : "outline"}
                  size="icon"
                  className={page === n ? "bg-primary hover:bg-primary-hover" : ""}
                  onClick={() => router.push(`/consultas?${buildParams({ page: n })}`)}
                >
                  {n}
                </Button>
              )
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isPending}
              onClick={() => router.push(`/consultas?${buildParams({ page: page + 1 })}`)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
