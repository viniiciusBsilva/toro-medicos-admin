"use client";

import Link from "next/link";
import { ChevronLeft, ArrowRight, FileText, FilePlus, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProntuarioData } from "../../actions";

type Props = {
  data: ProntuarioData;
};

export function ProntuarioClient({ data }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/pacientes/${data.id}`}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar
        </Link>
        <h2 className="text-xl font-semibold text-text-primary">Informações de saúde</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados básicos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          {data.profile_image && (
            <img
              src={data.profile_image}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-text-secondary">Nome completo</p>
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">{data.nome}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-text-secondary">Idade</p>
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary">
                {data.idade != null ? `${data.idade} anos` : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condições/histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            Já foi diagnosticado/é portador de alguma condição ou doença crônica?
          </p>
          <div className="flex gap-4">
            <span
              className={`rounded-lg px-3 py-2 ${data.condicao_cronica ? "bg-primary/10 font-medium text-primary" : "bg-muted/50 text-text-secondary"}`}
            >
              Sim
            </span>
            <span
              className={`rounded-lg px-3 py-2 ${data.condicao_cronica === false ? "bg-primary/10 font-medium text-primary" : "bg-muted/50 text-text-secondary"}`}
            >
              Não
            </span>
          </div>
          {data.condicao_cronica && data.detalhes_condicao && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-text-secondary">Qual?</p>
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary whitespace-pre-wrap">
                {data.detalhes_condicao}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faz uso prolongado de algum medicamento?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <span
              className={`rounded-lg px-3 py-2 ${data.medicamento_prolongado ? "bg-primary/10 font-medium text-primary" : "bg-muted/50 text-text-secondary"}`}
            >
              Sim
            </span>
            <span
              className={`rounded-lg px-3 py-2 ${data.medicamento_prolongado === false ? "bg-primary/10 font-medium text-primary" : "bg-muted/50 text-text-secondary"}`}
            >
              Não
            </span>
          </div>
          {data.medicamento_prolongado && data.detalhes_medicamento && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-text-secondary">Qual?</p>
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-text-primary whitespace-pre-wrap">
                {data.detalhes_medicamento}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/20">
          <CardContent className="p-0">
            <Link
              href={`/pacientes/${data.id}/exames`}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <span className="flex items-center gap-3 font-medium text-text-primary">
                <FileText className="h-5 w-5 text-primary" />
                Pedidos de exames
              </span>
              <ArrowRight className="h-5 w-5 text-primary" />
            </Link>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-0">
            <Link
              href={`/pacientes/${data.id}/atestados`}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <span className="flex items-center gap-3 font-medium text-text-primary">
                <FilePlus className="h-5 w-5 text-primary" />
                Atestados
              </span>
              <ArrowRight className="h-5 w-5 text-primary" />
            </Link>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-0">
            <Link
              href={`/pacientes/${data.id}/receitas`}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <span className="flex items-center gap-3 font-medium text-text-primary">
                <FileCheck className="h-5 w-5 text-primary" />
                Receitas
              </span>
              <ArrowRight className="h-5 w-5 text-primary" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
