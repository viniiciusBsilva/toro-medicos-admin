"use client";

import Link from "next/link";
import { ChevronLeft, Paperclip, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DocumentoItem } from "../../actions";
import {
  documentoTemDados,
  gerarPdfDocumento,
} from "@/lib/pdf-documento";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type Props = {
  pacienteId: string;
  pacienteNome: string;
  receitas: DocumentoItem[];
};

export function ReceitasClient({ pacienteId, pacienteNome, receitas }: Props) {
  function getCabecalho(doc: DocumentoItem) {
    return {
      medico_nome: doc.medico_nome ?? null,
      paciente_nome: pacienteNome,
      data_emissao: doc.data_emissao,
    };
  }

  function getUrlParaVisualizar(doc: DocumentoItem): string | null {
    if (doc.arquivo_url) return doc.arquivo_url;
    const blob = gerarPdfDocumento(
      "receita",
      doc.conteudo ?? null,
      doc.conteudo_json ?? null,
      getCabecalho(doc)
    );
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  function handleVisualizar(doc: DocumentoItem) {
    const url = getUrlParaVisualizar(doc);
    if (url) window.open(url, "_blank");
  }

  function handleDownload(doc: DocumentoItem) {
    if (doc.arquivo_url) {
      const a = document.createElement("a");
      a.href = doc.arquivo_url;
      a.download = doc.nome_arquivo ?? "receita.pdf";
      a.target = "_blank";
      a.click();
      return;
    }
    const blob = gerarPdfDocumento(
      "receita",
      doc.conteudo ?? null,
      doc.conteudo_json ?? null,
      getCabecalho(doc)
    );
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receita-${doc.id.slice(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
          {receitas.map((doc) => {
            const temDados = documentoTemDados(doc);
            return (
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
                          {doc.nome_arquivo ?? (temDados ? "Receita" : "Documento anexado")}
                        </span>
                      </div>
                    </div>
                    {temDados && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary-hover"
                          onClick={() => handleVisualizar(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="rounded p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
