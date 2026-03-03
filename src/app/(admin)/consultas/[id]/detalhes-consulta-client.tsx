"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  CircleDollarSign,
  Building2,
  FileText,
  Download,
  ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DetalhesConsulta } from "../actions";

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

function DocStatus({ assinado }: { assinado: boolean }) {
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
        assinado ? "bg-[#D2E8B0] text-[#0E1015]" : "bg-[#FEE59A] text-[#0E1015]"
      }`}
    >
      {assinado ? "Disponível" : "Aguardando"}
    </span>
  );
}

type Props = {
  detalhes: DetalhesConsulta;
};

export function DetalhesConsultaClient({ detalhes }: Props) {
  const [prontOpen, setProntOpen] = useState<Record<string, boolean>>({
    principal_queixa: false,
    hipoteses: false,
    observacoes: true,
  });
  const d = detalhes;
  const tipoLabel = d.tipo === "retorno" ? "Retorno" : "Normal";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/consultas"
          className="inline-flex items-center gap-1 text-[#0E1015] hover:text-primary hover:underline"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar
        </Link>
        <h2 className="text-xl font-semibold text-[#0E1015]">Detalhes da consulta</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0E1015]">Dados básicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="text-lg font-semibold text-[#0E1015]">{d.id_short}</p>
            <BadgeStatus status={d.status} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                {d.paciente.profile_image ? (
                  <img src={d.paciente.profile_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-text-secondary" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-[#0E1015]">{d.paciente.nome}</p>
                <p className="flex items-center gap-1 text-sm text-text-secondary">
                  <Calendar className="h-4 w-4" />
                  {d.data} - {d.horario}
                </p>
                <p className="flex items-center gap-1 text-sm text-text-secondary">
                  <CircleDollarSign className="h-4 w-4" />
                  {formatValor(d.valor_consulta)}
                </p>
                <p className="flex items-center gap-1 text-sm text-text-secondary">
                  <Building2 className="h-4 w-4" />
                  {tipoLabel}
                </p>
                <Link
                  href={`/pacientes/${d.paciente.id_paciente}`}
                  className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Ir para o perfil do paciente
                </Link>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                {d.medico.profile_image ? (
                  <img src={d.medico.profile_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-6 w-6 text-text-secondary" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-[#0E1015]">{d.medico.nome}</p>
                <Link
                  href={`/medicos/${d.medico.id_medico}`}
                  className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Ir para o perfil do médico
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0E1015]">Prontuário</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b border-outline last:border-b-0">
            <button
              type="button"
              onClick={() => setProntOpen((o) => ({ ...o, principal_queixa: !o.principal_queixa }))}
              className="flex w-full items-center justify-between px-6 py-3 text-left text-[#0E1015] hover:bg-muted/30"
            >
              Principal queixa
              {prontOpen.principal_queixa ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {prontOpen.principal_queixa && (
              <div className="border-t border-outline px-6 pb-4 pt-2 text-sm text-text-secondary">
                {d.principal_queixa || "—"}
              </div>
            )}
          </div>
          <div className="border-b border-outline last:border-b-0">
            <button
              type="button"
              onClick={() => setProntOpen((o) => ({ ...o, hipoteses: !o.hipoteses }))}
              className="flex w-full items-center justify-between px-6 py-3 text-left text-[#0E1015] hover:bg-muted/30"
            >
              Hipóteses
              {prontOpen.hipoteses ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {prontOpen.hipoteses && (
              <div className="border-t border-outline px-6 pb-4 pt-2 text-sm text-text-secondary">
                {d.hipoteses || "—"}
              </div>
            )}
          </div>
          <div className="last:border-b-0">
            <button
              type="button"
              onClick={() => setProntOpen((o) => ({ ...o, observacoes: !o.observacoes }))}
              className="flex w-full items-center justify-between px-6 py-3 text-left text-[#0E1015] hover:bg-muted/30"
            >
              Observações
              {prontOpen.observacoes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {prontOpen.observacoes && (
              <div className="border-t border-outline px-6 pb-4 pt-2 text-sm text-text-secondary">
                {d.observacoes || "—"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0E1015]">Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Receitas: lista conforme registros na tabela consulta_documento */}
          <div className="rounded-lg border border-outline bg-muted/20 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-[#0E1015]">Receitas</span>
              <DocStatus assinado={d.documentos.receita.some((r) => r.assinado)} />
            </div>
            <ul className="space-y-2">
              {d.documentos.receita.length === 0 ? (
                <li className="text-sm text-text-secondary">Nenhuma receita</li>
              ) : (
                d.documentos.receita.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-text-secondary" />
                      <span className="text-sm text-[#0E1015]">{r.nome_arquivo ?? "receita.pdf"}</span>
                    </div>
                    {r.arquivo_url && (
                      <a
                        href={r.arquivo_url}
                        download
                        className="rounded p-1 text-text-secondary hover:bg-muted hover:text-primary"
                        aria-label="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                ))
              )}
            </ul>
            {d.documentos.receita.length > 0 && (() => {
              const primeiroComUrl = d.documentos.receita.find((r) => r.arquivo_url);
              return (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button size="sm" className="bg-primary hover:bg-primary-hover" asChild={!!primeiroComUrl}>
                    {primeiroComUrl ? (
                      <a href={primeiroComUrl.arquivo_url!} target="_blank" rel="noopener noreferrer">
                        Visualizar
                      </a>
                    ) : (
                      <span>Visualizar</span>
                    )}
                  </Button>
                  <button type="button" className="text-sm font-medium text-primary hover:underline">
                    Compartilhar
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Atestados: lista conforme registros na tabela consulta_documento */}
          <div className="rounded-lg border border-outline bg-muted/20 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-[#0E1015]">Atestados</span>
              <DocStatus assinado={d.documentos.atestado.some((a) => a.assinado)} />
            </div>
            <ul className="space-y-2">
              {d.documentos.atestado.length === 0 ? (
                <li className="text-sm text-text-secondary">Nenhum atestado</li>
              ) : (
                d.documentos.atestado.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-text-secondary" />
                      <span className="text-sm text-[#0E1015]">{a.nome_arquivo ?? "atestado.pdf"}</span>
                    </div>
                    {a.arquivo_url && (
                      <a
                        href={a.arquivo_url}
                        download
                        className="rounded p-1 text-text-secondary hover:bg-muted hover:text-primary"
                        aria-label="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                ))
              )}
            </ul>
            {d.documentos.atestado.length > 0 && (() => {
              const primeiroComUrl = d.documentos.atestado.find((a) => a.arquivo_url);
              return (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button size="sm" className="bg-primary hover:bg-primary-hover" asChild={!!primeiroComUrl}>
                    {primeiroComUrl ? (
                      <a href={primeiroComUrl.arquivo_url!} target="_blank" rel="noopener noreferrer">
                        Visualizar
                      </a>
                    ) : (
                      <span>Visualizar</span>
                    )}
                  </Button>
                  <button type="button" className="text-sm font-medium text-primary hover:underline">
                    Compartilhar
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Pedidos de exames: título + status; "Anexos do paciente:"; lista de arquivos com download; depois Visualizar e Compartilhar */}
          <div className="rounded-lg border border-outline bg-muted/20 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-[#0E1015]">Pedidos de exames</span>
              <DocStatus assinado={d.documentos.pedidos_exame.length > 0} />
            </div>
            <p className="mb-3 text-sm text-text-secondary">Anexos do paciente:</p>
            <ul className="space-y-2">
              {d.documentos.pedidos_exame.length === 0 ? (
                <li className="text-sm text-text-secondary">Nenhum anexo</li>
              ) : (
                d.documentos.pedidos_exame.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-text-secondary" />
                      <span className="text-sm text-[#0E1015]">{p.nome_arquivo ?? "documento.pdf"}</span>
                    </div>
                    {p.arquivo_url && (
                      <a
                        href={p.arquivo_url}
                        download
                        className="rounded p-1 text-text-secondary hover:bg-muted hover:text-primary"
                        aria-label="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                ))
              )}
            </ul>
            {d.documentos.pedidos_exame.length > 0 && (() => {
              const primeiroComUrl = d.documentos.pedidos_exame.find((p) => p.arquivo_url);
              return (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary-hover"
                    asChild={!!primeiroComUrl}
                  >
                    {primeiroComUrl ? (
                      <a href={primeiroComUrl.arquivo_url!} target="_blank" rel="noopener noreferrer">
                        Visualizar
                      </a>
                    ) : (
                      <span>Visualizar</span>
                    )}
                  </Button>
                  <button type="button" className="text-sm font-medium text-primary hover:underline">
                    Compartilhar
                  </button>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
