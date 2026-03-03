"use client";

import Link from "next/link";
import { ChevronLeft, ArrowRight, Calendar, CircleDollarSign, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DetalhesPaciente, ConsultaHistoricoItem } from "../actions";

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTelefone(t: string): string {
  if (!t || t.length < 10) return t;
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

// Cores de fundo conforme especificação; texto sempre #0E1015
const STATUS_BADGE: Record<string, string> = {
  agendada: "bg-[#FEE59A]",
  em_andamento: "bg-blue-100",
  realizada: "bg-[#D2E8B0]",
  cancelada: "bg-[#FFC599]",
  pago: "bg-[#D2E8B0]",
  em_aberto: "bg-[#FEE59A]",
  atrasado: "bg-[#FFCDD2]",
  estornado: "bg-gray-100",
  reembolsado: "bg-[#FFE082]",
};

const STATUS_LABEL: Record<string, string> = {
  reembolsado: "Reembolso",
};

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
  paciente: DetalhesPaciente;
  consultas: ConsultaHistoricoItem[];
};

export function DetalhesPacienteClient({ paciente, consultas }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/pacientes"
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar
        </Link>
        <h2 className="text-xl font-semibold text-text-primary">Detalhes do Paciente</h2>
        <span className="ml-auto text-sm text-text-secondary">#{shortId(paciente.id)}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados básicos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Nome completo</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">{paciente.nome}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">E-mail</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">{paciente.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Telefone</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">
              {formatTelefone(paciente.telefone)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Data de nascimento</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">
              {formatDate(paciente.data_nascimento)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Idade</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">
              {paciente.idade != null ? `${paciente.idade} anos` : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Cidade</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">
              {paciente.cidade ?? "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Estado</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">
              {paciente.uf ?? "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">
              Quantidade de consultas realizadas
            </p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">
              {paciente.total_consultas}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-text-secondary">Data do cadastro</p>
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">
              {formatDate(paciente.data_cadastro)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="p-0">
          <Link
            href={`/pacientes/${paciente.id}/prontuario`}
            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
          >
            <span className="font-medium text-text-primary">Ver informações de saúde</span>
            <ArrowRight className="h-5 w-5 text-primary" />
          </Link>
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
                  className="relative rounded-xl border border-outline bg-[#FAFAFA] p-5 shadow-sm"
                >
                  {/* ID top left | Status da consulta top right */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-[#0E1015]">#{shortId(c.id)}</p>
                    <BadgeStatus status={c.status} />
                  </div>
                  {/* Nome e especialidade */}
                  <p className="text-base font-semibold text-[#0E1015]">{c.medico_nome}</p>
                  {c.medico_especialidade && (
                    <p className="text-sm text-[#0E1015]">{c.medico_especialidade}</p>
                  )}
                  {/* Data, valor e tipo com ícones */}
                  <div className="mt-3 space-y-2">
                    <p className="flex items-center gap-2 text-sm text-[#0E1015]">
                      <Calendar className="h-4 w-4 shrink-0 text-text-secondary" />
                      {formatDataHora(c.datahora)}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-[#0E1015]">
                      <CircleDollarSign className="h-4 w-4 shrink-0 text-text-secondary" />
                      {formatValor(c.valor_consulta)}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-[#0E1015]">
                      <Building2 className="h-4 w-4 shrink-0 text-text-secondary" />
                      {c.tipo === "retorno" ? "Retorno" : "Normal"}
                    </p>
                  </div>
                  {/* Link detalhes */}
                  <Link
                    href={`/consultas/${c.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#0E1015] hover:text-primary hover:underline"
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
    </div>
  );
}
