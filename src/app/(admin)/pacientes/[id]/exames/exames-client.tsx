"use client";

import Link from "next/link";
import { ChevronLeft, Paperclip, Download, Eye, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExameItem } from "../../actions";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type Props = {
  pacienteId: string;
  exames: ExameItem[];
};

export function ExamesClient({ pacienteId, exames }: Props) {
  function handleCompartilhar(url: string | null) {
    if (!url) return;
    if (navigator.share) {
      navigator.share({
        title: "Exame",
        url,
      }).catch(() => window.open(url, "_blank"));
    } else {
      window.open(url, "_blank");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/pacientes/${pacienteId}/prontuario`}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar
        </Link>
        <h2 className="text-xl font-semibold text-text-primary">Exames</h2>
      </div>

      {exames.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-text-secondary">
            Nenhum exame registrado.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {exames.map((ex) => (
            <li key={ex.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="space-y-2 min-w-0 flex-1">
                    <h3 className="font-medium text-text-primary">{ex.titulo}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                      <span>Solicitado em: {formatDate(ex.solicitado_em)}</span>
                      {ex.medico_nome && <span>Médico: {ex.medico_nome}</span>}
                      {ex.data_consulta && (
                        <span>Data da consulta: {formatDate(ex.data_consulta)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      {ex.arquivo_url ? (
                        <>
                          <Paperclip className="h-4 w-4 shrink-0" />
                          <a
                            href={ex.arquivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate underline hover:text-primary"
                          >
                            {ex.arquivo_url.split("/").pop() ?? "Arquivo"}
                          </a>
                        </>
                      ) : (
                        <span className="text-amber-600">Nenhum exame anexado</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary-hover"
                      disabled={!ex.arquivo_url}
                      onClick={() => ex.arquivo_url && window.open(ex.arquivo_url!, "_blank")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={() => handleCompartilhar(ex.arquivo_url ?? null)}
                    >
                      Compartilhar
                    </button>
                    {ex.arquivo_url && (
                      <a
                        href={ex.arquivo_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
