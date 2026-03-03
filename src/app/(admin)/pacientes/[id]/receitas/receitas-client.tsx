"use client";

import Link from "next/link";
import { ChevronLeft, Paperclip, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DocumentoItem } from "../../actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type Props = {
  pacienteId: string;
  receitas: DocumentoItem[];
};

export function ReceitasClient({ pacienteId, receitas }: Props) {
  function handleCompartilhar(url: string | null) {
    if (!url) return;
    if (navigator.share) {
      navigator.share({ title: "Receita", url }).catch(() => window.open(url, "_blank"));
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
        <h2 className="text-xl font-semibold text-text-primary">Receitas</h2>
      </div>

      {receitas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-text-secondary">
            Nenhuma receita registrada.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {receitas.map((doc) => (
            <li key={doc.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="space-y-2 min-w-0 flex-1">
                    <p className="text-sm text-text-secondary">
                      Data de emissão: {formatDate(doc.data_emissao)}
                    </p>
                    <div className="flex items-center gap-2 text-text-primary">
                      <Paperclip className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {doc.nome_arquivo ?? "Documento anexado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary-hover"
                      disabled={!doc.arquivo_url}
                      onClick={() => doc.arquivo_url && window.open(doc.arquivo_url!, "_blank")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={() => handleCompartilhar(doc.arquivo_url)}
                    >
                      Compartilhar
                    </button>
                    {doc.arquivo_url && (
                      <a
                        href={doc.arquivo_url}
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
