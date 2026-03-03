"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Paperclip, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  aprovarDocumentacaoMedico,
  recusarDocumentacaoMedico,
  type MedicoParaAprovacao,
  type DocumentoAprovacao,
} from "../../actions";

type Props = {
  medico: MedicoParaAprovacao;
};

function DocItem({ doc }: { doc: DocumentoAprovacao }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline bg-muted/30 p-4">
      <div className="flex items-center gap-2 min-w-0">
        <Paperclip className="h-4 w-4 shrink-0 text-text-secondary" />
        <span className="truncate text-[#0E1015]">{doc.nomeArquivo}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-primary hover:bg-primary-hover"
          disabled={!doc.url}
          onClick={() => doc.url && window.open(doc.url, "_blank")}
          title="Baixar"
        >
          <Download className="h-4 w-4 mr-1" />
          Baixar
        </Button>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
          onClick={() => doc.url && window.open(doc.url, "_blank")}
          disabled={!doc.url}
          title="Visualizar"
        >
          Visualizar
        </button>
      </div>
    </div>
  );
}

export function AprovacaoClient({ medico }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalRecusarOpen, setModalRecusarOpen] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState("");

  async function handleAprovar() {
    startTransition(async () => {
      const result = await aprovarDocumentacaoMedico(medico.id);
      if (result.ok) {
        toast.success("Documentação aprovada com sucesso!");
        router.push(`/medicos/${medico.id}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao aprovar.");
      }
    });
  }

  function openModalRecusar() {
    setMotivoRecusa("");
    setModalRecusarOpen(true);
  }

  async function handleRecusar() {
    startTransition(async () => {
      const result = await recusarDocumentacaoMedico(medico.id, motivoRecusa);
      if (result.ok) {
        setModalRecusarOpen(false);
        toast.error("A documentação do médico foi reprovada.");
        router.push(`/medicos/${medico.id}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao recusar.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/medicos/${medico.id}`}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar
        </Link>
        <h2 className="text-xl font-semibold text-[#0E1015]">Aprovação de documentos</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medico.documentosPessoais.map((doc) => (
            <div key={doc.label}>
              <p className="mb-2 text-sm font-medium text-text-secondary">{doc.label}</p>
              <DocItem doc={doc} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos profissional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medico.documentosProfissional.map((doc) => (
            <div key={doc.label}>
              <p className="mb-2 text-sm font-medium text-text-secondary">{doc.label}</p>
              <DocItem doc={doc} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={openModalRecusar}
          disabled={isPending}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
          title="Recusar documentação"
        >
          Recusar documentação
        </button>
        <Button
          type="button"
          onClick={handleAprovar}
          disabled={isPending}
          className="bg-[#374151] text-white hover:bg-[#4B5563]"
          title="Aprovar documentação"
        >
          Aprovar documentação
        </Button>
      </div>

      <Dialog open={modalRecusarOpen} onOpenChange={setModalRecusarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0E1015]">Recusar documentação</DialogTitle>
            <DialogDescription className="sr-only">
              Informe o motivo da reprovação que será enviado por e-mail ao médico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="motivo-recusa" className="text-[#0E1015]">
              Motivo da reprovação (será enviado por e-mail ao médico)
            </Label>
            <textarea
              id="motivo-recusa"
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              placeholder="Ex.: Documento ilegível. Por favor reenvie o CRM com maior resolução."
              rows={4}
              className="w-full rounded-lg border border-outline bg-background px-3 py-2 text-[#0E1015] placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalRecusarOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-primary text-white hover:bg-primary-hover"
              onClick={handleRecusar}
              disabled={isPending}
            >
              Recusar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
