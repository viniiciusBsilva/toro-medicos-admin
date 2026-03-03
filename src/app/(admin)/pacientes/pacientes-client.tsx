"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
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
import type { PacienteListItem, ListaPacientesResult } from "./actions";

type IdadeFilter = "0-12" | "13-55" | "56+";

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function formatTelefone(t: string): string {
  if (!t || t.length < 10) return t;
  const d = t.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

export function PacientesClient({
  initialData,
  initialPage,
}: {
  initialData: ListaPacientesResult;
  initialPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);

  const q = searchParams.get("q") ?? "";
  const idadeParam = searchParams.get("idade");
  const idadeFilters = idadeParam ? (idadeParam.split(",") as IdadeFilter[]) : [];
  const cidadeParam = searchParams.get("cidade") ?? "";

  const [localSearch, setLocalSearch] = useState(q);
  const [localIdade, setLocalIdade] = useState<IdadeFilter[]>(idadeFilters);
  const [localCidade, setLocalCidade] = useState(cidadeParam);

  const { pacientes, total, page, totalPages } = initialData;

  function buildParams(updates: { q?: string; page?: number; idade?: string; cidade?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    if (updates.q !== undefined) updates.q ? p.set("q", updates.q) : p.delete("q");
    if (updates.page !== undefined) updates.page > 1 ? p.set("page", String(updates.page)) : p.delete("page");
    if (updates.idade !== undefined) updates.idade ? p.set("idade", updates.idade) : p.delete("idade");
    if (updates.cidade !== undefined) updates.cidade ? p.set("cidade", updates.cidade) : p.delete("cidade");
    return p.toString();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(`/pacientes?${buildParams({ q: localSearch.trim() || undefined, page: 1 })}`);
    });
  }

  function handleFilterApply() {
    const idadeStr = localIdade.length ? localIdade.join(",") : undefined;
    startTransition(() => {
      router.push(`/pacientes?${buildParams({ cidade: localCidade.trim() || undefined, idade: idadeStr, page: 1 })}`);
      setFilterOpen(false);
    });
  }

  function handleFilterClear() {
    setLocalIdade([]);
    setLocalCidade("");
    startTransition(() => {
      router.push(`/pacientes?${buildParams({ cidade: undefined, idade: undefined, page: 1 })}`);
      setFilterOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      {/* Busca (campo expansivo, ícone à direita) + Filtro */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="relative">
            <Input
              type="search"
              placeholder="Pesquisar pacientes"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
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
              <DialogTitle>Filtrar</DialogTitle>
              <DialogDescription className="sr-only">
                Filtros por cidade, estado e faixa etária.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Buscar cidade ou estado</Label>
                <Input
                  placeholder="Buscar cidade ou estado"
                  value={localCidade}
                  onChange={(e) => setLocalCidade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Idade</Label>
                <div className="space-y-2">
                  {(["0-12", "13-55", "56+"] as const).map((faixa) => (
                    <label key={faixa} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={localIdade.includes(faixa)}
                        onChange={(e) => {
                          if (e.target.checked) setLocalIdade((prev) => [...prev, faixa]);
                          else setLocalIdade((prev) => prev.filter((x) => x !== faixa));
                        }}
                        className="h-4 w-4 rounded border-2 border-primary text-primary"
                      />
                      {faixa === "0-12" && "0 a 12 anos"}
                      {faixa === "13-55" && "13 a 55 anos"}
                      {faixa === "56+" && "56+ anos"}
                    </label>
                  ))}
                </div>
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

      {/* Tabela */}
      <div className="rounded-xl border border-outline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline bg-background text-left text-xs font-semibold uppercase text-text-secondary">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Nº consultas</th>
                <th className="px-4 py-3">Idade</th>
                <th className="px-4 py-3">Cidade/UF</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              ) : (
                pacientes.map((p) => (
                  <tr
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/pacientes/${p.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/pacientes/${p.id}`);
                      }
                    }}
                    className="min-h-[52px] cursor-pointer border-b border-outline transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">#{shortId(p.id)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-text-primary" title={p.nome}>
                      {p.nome}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-text-primary" title={p.email}>
                      {p.email}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{formatTelefone(p.telefone)}</td>
                    <td className="px-4 py-3 text-text-primary">{p.total_consultas}</td>
                    <td className="px-4 py-3 text-text-primary">
                      {p.idade != null ? `${p.idade} anos` : "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-text-primary">
                      {[p.cidade, p.uf].filter(Boolean).join("/") || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">
            Total: {total} paciente{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Páginas</span>
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || isPending}
              onClick={() => router.push(`/pacientes?${buildParams({ page: page - 1 })}`)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] text-center text-sm font-medium text-text-primary">
              {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || isPending}
              onClick={() => router.push(`/pacientes?${buildParams({ page: page + 1 })}`)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
