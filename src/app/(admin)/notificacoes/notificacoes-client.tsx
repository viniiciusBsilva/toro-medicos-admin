"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserCircle } from "lucide-react";
import {
  listarNotificacoes,
  marcarComoLida,
  type FiltroNotificacao,
  type NotificacaoItem,
} from "./actions";
import { cn } from "@/lib/utils";

function formatarDataHora(iso: string): string {
  try {
    const d = new Date(iso);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes} - ${h}h${min}`;
  } catch {
    return "—";
  }
}

const FILTROS: { value: FiltroNotificacao; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "lidas", label: "Lidas" },
  { value: "nao_lidas", label: "Não lidas" },
];

type Props = {
  initialNotificacoes: NotificacaoItem[];
  initialFiltro: FiltroNotificacao;
};

export function NotificacoesClient({ initialNotificacoes, initialFiltro }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtro, setFiltro] = useState<FiltroNotificacao>(initialFiltro);
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>(initialNotificacoes);
  const [isPending, startTransition] = useTransition();

  function trocarFiltro(value: FiltroNotificacao) {
    setFiltro(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todas") params.delete("filtro");
    else params.set("filtro", value);
    router.push(`/notificacoes?${params.toString()}`, { scroll: false });
    startTransition(async () => {
      const { notificacoes: list } = await listarNotificacoes(value);
      setNotificacoes(list);
    });
  }

  async function handleCliqueNotificacao(id: string, lida: boolean, url: string) {
    if (!lida) {
      await marcarComoLida(id);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0E1015]">Notificações</h1>

      {/* Abas: Todas | Lidas | Não lidas */}
      <div className="flex gap-6 border-b border-outline">
        {FILTROS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => trocarFiltro(value)}
            disabled={isPending}
            className={cn(
              "pb-3 text-sm font-medium transition-colors disabled:opacity-50",
              filtro === value
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de cards */}
      <div className="space-y-4">
        {isPending && notificacoes.length === 0 ? (
          <div className="rounded-xl border border-outline bg-surface p-6 shadow-sm">
            <div className="h-5 w-32 animate-pulse rounded bg-outline/50" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-outline/30" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-outline/30" />
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="rounded-xl border border-outline bg-surface p-8 text-center text-text-secondary">
            Nenhuma notificação
            {filtro !== "todas" && ` ${filtro === "lidas" ? "lida" : "não lida"}`}.
          </div>
        ) : (
          notificacoes.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-outline bg-surface p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex shrink-0 items-center gap-2">
                  {!n.lida && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                  )}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <UserCircle className="h-5 w-5 text-text-secondary" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0E1015]">{n.titulo}</p>
                  <p className="mt-1 text-sm text-text-secondary">{n.mensagem}</p>
                  <Link
                    href={n.acao_url}
                    onClick={() => handleCliqueNotificacao(n.id, n.lida, n.acao_url)}
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    {n.acao_label}
                  </Link>
                  <p className="mt-2 text-xs text-text-secondary">
                    {formatarDataHora(n.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
