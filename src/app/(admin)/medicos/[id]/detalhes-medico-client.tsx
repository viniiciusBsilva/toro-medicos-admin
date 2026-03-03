"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ArrowRight, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePermissoes } from "@/hooks/use-permissoes";
import { banirMedico, type DetalhesMedico, type ConsultaMedicoItem } from "../actions";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTelefone(t: string | null): string {
  if (!t || t.length < 10) return t || "—";
  const d = t.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

function formatDataHora(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} - ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatValor(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

const STATUS_BADGE: Record<string, string> = {
  aprovado: "bg-[#D2E8B0]",
  em_analise: "bg-[#FEE59A]",
  reprovado: "bg-[#FFCDD2]",
  banido: "bg-gray-200",
};

const STATUS_LABEL: Record<string, string> = {
  aprovado: "Aprovado",
  em_analise: "Em análise",
  reprovado: "Reprovado",
  banido: "Banido",
};

function BadgeStatus({ status }: { status: string }) {
  const bg = STATUS_BADGE[status] ?? "bg-gray-100";
  const label = STATUS_LABEL[status] ?? status.replace(/_/g, " ");
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-medium text-[#0E1015] ${bg}`}>
      {label}
    </span>
  );
}

const MOSTRAR_IR_APROVACAO = ["em_analise", "reprovado", "banido"];

type Props = {
  medico: DetalhesMedico;
  consultas: ConsultaMedicoItem[];
};

export function DetalhesMedicoClient({ medico, consultas }: Props) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [isPending, startTransition] = useTransition();
  const [modalBanirOpen, setModalBanirOpen] = useState(false);

  const mostrarIrAprovacao = MOSTRAR_IR_APROVACAO.includes(medico.status) && pode("validar_cadastro_medicos");
  const mostrarBanir = medico.status === "aprovado";

  async function handleBanir() {
    startTransition(async () => {
      const result = await banirMedico(medico.id);
      if (result.ok) {
        setModalBanirOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/medicos"
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </Link>
          <h2 className="text-xl font-semibold text-[#0E1015]">Detalhes do médico</h2>
        </div>
        <div className="flex items-center gap-2">
          {mostrarIrAprovacao && (
            <Link
              href={`/medicos/${medico.id}/aprovacao`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Ir para aprovação
            </Link>
          )}
          {mostrarBanir && (
            <button
              type="button"
              onClick={() => setModalBanirOpen(true)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Banir médico
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados básicos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">CRM</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">{medico.crm}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Nome completo</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">{medico.nome}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Status</p>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <BadgeStatus status={medico.status} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">E-mail</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">{medico.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Telefone</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">
              {formatTelefone(medico.telefone)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Cidade</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">
              {medico.cidade ?? "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Estado</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">
              {medico.uf ?? "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">
              Consultas realizadas
            </p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">
              {medico.total_consultas}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Especialidade</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">
              {medico.area_atuacao}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Data do cadastro</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">
              {formatDate(medico.data_cadastro)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Último acesso</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">
              {formatDate(medico.ultimo_acesso)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados profissionais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-1">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Área de atuação</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">
              {medico.area_atuacao}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">
              Formação acadêmica
            </p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015]">—</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">
              Experiência profissional
            </p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[#0E1015] whitespace-pre-wrap">
              {medico.exp_profissional ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de consultas</CardTitle>
        </CardHeader>
        <CardContent>
          {consultas.length === 0 ? (
            <p className="py-4 text-center text-text-secondary">Nenhuma consulta registrada.</p>
          ) : (
            <ul className="space-y-4">
              {consultas.map((c) => (
                <li
                  key={c.id}
                  className="relative flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline bg-[#FAFAFA] p-5 shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#0E1015]">#{shortId(c.id)}</p>
                    <p className="text-sm text-[#0E1015]">Paciente: {c.paciente_nome}</p>
                    <p className="text-sm text-text-secondary">
                      {formatDataHora(c.datahora)} · {formatValor(c.valor_consulta)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {c.tipo === "retorno" ? "Retorno" : "Normal"}
                    </p>
                  </div>
                  <Link
                    href={`/consultas/${c.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Detalhes da consulta
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#0E1015]">
                {medico.media_avaliacao != null
                  ? medico.media_avaliacao.toFixed(1)
                  : "—"}
              </span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              {medico.total_avaliacoes != null
                ? `Baseado em ${medico.total_avaliacoes} avaliações`
                : "Sem avaliações"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalBanirOpen} onOpenChange={setModalBanirOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0E1015]">Banir profissional</DialogTitle>
            <DialogDescription className="sr-only">
              Confirmação para banir o médico. Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-[#0E1015]">
            <p>Tem certeza que deseja banir este médico?</p>
            <p className="text-sm text-text-secondary">Esta ação não poderá ser desfeita.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalBanirOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-primary text-white hover:bg-primary-hover"
              onClick={handleBanir}
              disabled={isPending}
            >
              Banir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
