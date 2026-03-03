"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AlterarSenhaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: novaSenha });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Senha alterada com sucesso.");
        router.push("/configuracoes");
        router.refresh();
      } catch {
        toast.error("Erro ao alterar senha. Tente novamente.");
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
      <h2 className="text-xl font-semibold text-[#0E1015]">Alterar senha</h2>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual" className="text-[#0E1015]">
                Senha atual
              </Label>
              <PasswordInput
                id="senha-atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="********"
                className="text-[#0E1015]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova-senha" className="text-[#0E1015]">
                Nova senha
              </Label>
              <PasswordInput
                id="nova-senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="********"
                className="text-[#0E1015]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha" className="text-[#0E1015]">
                Confirmar senha
              </Label>
              <PasswordInput
                id="confirmar-senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="********"
                className="text-[#0E1015]"
                required
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
