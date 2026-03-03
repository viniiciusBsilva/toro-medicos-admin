"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getConfiguracoes, updateWhatsappSuporte } from "../actions";
import { toast } from "sonner";

function formatTelefone(t: string): string {
  const d = t.replace(/\D/g, "");
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export default function EditarWhatsAppPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [numero, setNumero] = useState("");

  useEffect(() => {
    getConfiguracoes().then((c) => {
      setNumero(c.whatsapp_suporte ?? "");
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
    setNumero(formatTelefone(v));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = numero.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Informe um número válido com DDD.");
      return;
    }
    startTransition(async () => {
      const result = await updateWhatsappSuporte(digits);
      if (result.ok) {
        toast.success("WhatsApp do suporte atualizado.");
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
      <h2 className="text-xl font-semibold text-[#0E1015]">Editar WhatsApp do suporte</h2>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-[#0E1015]">
                Número do WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={numero}
                onChange={handleChange}
                placeholder="(99) 99999-9999"
                className="text-[#0E1015]"
              />
            </div>
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
