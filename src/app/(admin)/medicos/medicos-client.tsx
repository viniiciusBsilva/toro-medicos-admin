"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePermissoes } from "@/hooks/use-permissoes";
import { listarMedicos, type ListaMedicosResult, type StatusMedico } from "./actions";

const STATUS_OPCOES: { value: StatusMedico; label: string }[] = [
  { value: "aprovado", label: "Aprovado" },
  { value: "em_analise", label: "Em análise" },
  { value: "reprovado", label: "Reprovado" },
  { value: "banido", label: "Banido" },
];

const STATUS_BADGE: Record<string, string> = {
  aprovado: "bg-[#D2E8B0]",
  em_analise: "bg-[#FEE59A]",
  reprovado: "bg-[#FFCDD2]",
  banido: "bg-gray-200",
};

const STATUS_LABEL: Record<string, string> = {
  aprovado: "Aprovado",
  em_analise: "Em analise",
  reprovado: "Reprovado",
  banido: "Banido",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function BadgeStatus({ status }: { status: string }) {
  const bg = STATUS_BADGE[status] ?? "bg-gray-100";
  const label = STATUS_LABEL[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-medium text-[#0E1015] ${bg}`}
    >
      {label}
    </span>
  );
}

type Props = {
  initialData: ListaMedicosResult;
  initialPage: number;
  pendentesCount: number;
  apenasPendentes?: boolean;
};

export function MedicosClient({
  initialData,
  initialPage,
  pendentesCount,
  apenasPendentes = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pode } = usePermissoes();
  const [isPending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState(true);

  const q = searchParams.get("q") ?? "";
  const statusParam = searchParams.get("status");
  const statusList = ["aprovado", "em_analise", "reprovado", "banido"] as const;
  const statusFilters: StatusMedico[] = statusParam
    ? statusParam
        .split(",")
        .filter((x): x is StatusMedico => statusList.includes(x as (typeof statusList)[number]))
    : [];
  const filtroParam = searchParams.get("filtro") ?? "";

  const [localSearch, setLocalSearch] = useState(q);
  const [localStatus, setLocalStatus] = useState<StatusMedico[]>(statusFilters);
  const [localFiltro, setLocalFiltro] = useState(filtroParam);
  const [data, setData] = useState<ListaMedicosResult>(initialData);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearingRef = useRef(false);

  const { medicos, total, page, totalPages } = data;

  const basePath = apenasPendentes ? "/medicos/pendentes" : "/medicos";

  useEffect(() => {
    if (clearingRef.current) {
      if (!searchParams.get("q")) {
        setLocalSearch("");
        clearingRef.current = false;
      }
      return;
    }
    setLocalSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  async function aplicarBusca(
    qValue: string | undefined,
    pageNum: number = 1,
    statusArr?: StatusMedico[],
    filtroVal?: string
  ) {
    const status = statusArr !== undefined ? statusArr : (searchParams.get("status") ? searchParams.get("status")!.split(",").filter((x): x is StatusMedico => statusList.includes(x as StatusMedico)) : undefined);
    const filtro = filtroVal !== undefined ? filtroVal : searchParams.get("filtro")?.trim();
    const result = await listarMedicos(pageNum, qValue?.trim() || undefined, status?.length ? status : undefined, filtro?.trim() || undefined, apenasPendentes);
    setData(result);
  }

  useEffect(() => {
    const trimmed = localSearch.trim();
    const currentQ = searchParams.get("q") ?? "";
    if (trimmed === currentQ.trim()) return;
    if (trimmed === "") {
      startTransition(() => {
        router.replace(`${basePath}?${buildParams({ q: undefined, page: 1 })}`);
        aplicarBusca(undefined, 1);
      });
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        router.replace(`${basePath}?${buildParams({ q: trimmed, page: 1 })}`);
        aplicarBusca(trimmed, 1);
      });
      debounceRef.current = null;
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch]);

  function buildParams(updates: {
    q?: string;
    page?: number;
    status?: string;
    filtro?: string;
  }) {
    const p = new URLSearchParams(searchParams.toString());
    if (updates.q !== undefined)
      updates.q ? p.set("q", updates.q) : p.delete("q");
    if (updates.page !== undefined)
      updates.page > 1 ? p.set("page", String(updates.page)) : p.delete("page");
    if (updates.status !== undefined)
      updates.status ? p.set("status", updates.status) : p.delete("status");
    if (updates.filtro !== undefined)
      updates.filtro ? p.set("filtro", updates.filtro) : p.delete("filtro");
    return p.toString();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = localSearch.trim() || undefined;
    startTransition(() => {
      router.replace(`${basePath}?${buildParams({ q: trimmed, page: 1 })}`);
      aplicarBusca(trimmed, 1);
    });
  }

  function handleFilterApply() {
    const filtroVal = localFiltro.trim() || undefined;
    const statusStr = localStatus.length ? localStatus.join(",") : undefined;
    const semFiltro = !filtroVal && !statusStr;
    if (semFiltro) setLocalSearch("");
    startTransition(() => {
      router.replace(
        `${basePath}?${buildParams({
          q: semFiltro ? undefined : localSearch.trim() || undefined,
          filtro: filtroVal,
          status: statusStr,
          page: 1,
        })}`
      );
      aplicarBusca(
        semFiltro ? undefined : localSearch.trim() || undefined,
        1,
        localStatus.length ? localStatus : undefined,
        filtroVal
      );
    });
    setFilterOpen(false);
  }

  function handleFilterClear() {
    setLocalStatus([]);
    setLocalFiltro("");
    startTransition(() => {
      router.replace(`${basePath}?${buildParams({ q: localSearch.trim() || undefined, filtro: undefined, status: undefined, page: 1 })}`);
      aplicarBusca(localSearch.trim() || undefined, 1, [], "");
    });
    setFilterOpen(false);
  }

  function toggleStatus(s: StatusMedico) {
    setLocalStatus((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  return (
    <div className="space-y-6">
      {apenasPendentes && (
        <div className="flex items-center gap-4">
          <Link
            href="/medicos"
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </Link>
          <h2 className="text-xl font-semibold text-[#0E1015]">
            Médicos com aprovação pendente
          </h2>
        </div>
      )}

      {!apenasPendentes && pendentesCount > 0 && pode("validar_cadastro_medicos") && (
        <Link
          href="/medicos/pendentes"
          className="flex items-center gap-2 rounded-lg bg-[#FEE59A] px-4 py-3 text-[#0E1015] hover:opacity-90"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            Existem médicos com aprovação pendente. Clique aqui para visualizar
          </span>
        </Link>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="relative">
            <Input
              type="search"
              placeholder="Pesquisar por nome ou e-mail"
              value={localSearch}
              onChange={(e) => {
                const v = e.target.value;
                setLocalSearch(v);
                if (!v.trim()) {
                  clearingRef.current = true;
                  startTransition(() => {
                    router.replace(`${basePath}?${buildParams({ q: undefined, page: 1 })}`);
                    aplicarBusca(undefined, 1);
                  });
                }
              }}
              className="h-11 w-full rounded-full border border-outline bg-white pl-4 pr-11 text-[var(--text-bodyText)] placeholder:text-[var(--text-lessImportantText)]"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-lessImportantText)]" />
          </div>
        </form>
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full" title="Filtrar">
              <Filter className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-[#0E1015]">Filtrar</DialogTitle>
              <DialogDescription className="sr-only">
                Filtros por cidade, estado ou especialidade e status do médico.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-[#0E1015]">Buscar cidade, estado ou especialidade</Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar cidade, estado ou especialidade"
                    value={localFiltro}
                    onChange={(e) => setLocalFiltro(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                </div>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between font-semibold text-[#0E1015]"
                  onClick={() => setStatusExpanded(!statusExpanded)}
                >
                  Status
                  <ChevronUp
                    className={`h-4 w-4 transition-transform ${statusExpanded ? "" : "rotate-180"}`}
                  />
                </button>
                {statusExpanded && (
                  <div className="space-y-2">
                    {STATUS_OPCOES.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2 text-sm text-[#0E1015]"
                      >
                        <input
                          type="checkbox"
                          checked={localStatus.includes(opt.value)}
                          onChange={() => toggleStatus(opt.value)}
                          className="h-4 w-4 rounded border-2 border-primary text-primary"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleFilterClear}>
                  Limpar
                </Button>
                <Button type="button" onClick={handleFilterApply}>
                  Filtrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-outline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline bg-background text-left text-xs font-semibold uppercase text-text-secondary">
                <th className="px-4 py-3">CRM</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Nº de consultas</th>
                <th className="px-4 py-3">Especialidade</th>
                <th className="px-4 py-3">Último acesso</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {medicos.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-text-secondary"
                  >
                    Nenhum médico encontrado.
                  </td>
                </tr>
              ) : (
                medicos.map((m) => (
                  <tr
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/medicos/${m.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/medicos/${m.id}`);
                      }
                    }}
                    className="min-h-[52px] cursor-pointer border-b border-outline transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium text-[#0E1015]">{m.crm}</td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-[#0E1015]" title={m.nome}>
                      {m.nome}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#0E1015]" title={m.email}>
                      {m.email}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-[#0E1015]">
                      {[m.cidade, m.uf].filter(Boolean).join("/") || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#0E1015]">{m.total_consultas}</td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-[#0E1015]">
                      {m.especialidade ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#0E1015]">
                      {formatDate(m.ultimo_acesso)}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeStatus status={m.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">
            Total: {total} médico{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Páginas</span>
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || isPending}
              onClick={() => {
                const newPage = page - 1;
                startTransition(() => {
                  router.replace(`${basePath}?${buildParams({ page: newPage })}`);
                  aplicarBusca(searchParams.get("q") ?? undefined, newPage);
                });
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] text-center text-sm font-medium text-[#0E1015]">
              {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isPending}
              onClick={() => {
                const newPage = page + 1;
                startTransition(() => {
                  router.replace(`${basePath}?${buildParams({ page: newPage })}`);
                  aplicarBusca(searchParams.get("q") ?? undefined, newPage);
                });
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
