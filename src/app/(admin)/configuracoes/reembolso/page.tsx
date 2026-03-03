"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getConfiguracoes, updatePercentualReembolso } from "../actions";
import { toast } from "sonner";

export default function EditarReembolsoPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [percentual, setPercentual] = useState("");

  useEffect(() => {
    getConfiguracoes().then((c) => {
      setPercentual(
        c.percentual_reembolso_24h != null ? String(c.percentual_reembolso_24h) : "50"
      );
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(percentual.replace(/\D/g, ""), 10);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      toast.error("Informe um percentual entre 0 e 100.");
      return;
    }
    startTransition(async () => {
      const result = await updatePercentualReembolso(n);
      if (result.ok) {
        toast.success("Percentual de reembolso atualizado.");
        router.push("/configuracoes");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-5 w-5" />
        Voltar
      </Link>
      <h2 className="text-xl font-semibold text-[#0E1015]">Editar % de cancelamento</h2>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="percentual" className="text-[#0E1015]">
                Percentual de reembolso (%) se cancelado em menos de 24h
              </Label>
              <Input
                id="percentual"
                type="text"
                inputMode="numeric"
                value={percentual}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                  setPercentual(v);
                }}
                placeholder="50"
                className="text-[#0E1015]"
              />
            </div>
            <p className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-text-secondary/20 text-xs font-bold text-text-secondary">
                i
              </span>
              Exemplo: Se 50%, o paciente recebe metade do valor da consulta caso cancele com menos de 24h de antecedência.
            </p>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary-hover"
            >
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
