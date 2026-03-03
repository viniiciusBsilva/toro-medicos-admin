"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login/redefinir-senha`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success("Link enviado. Verifique seu e-mail.");
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <>
        <p className="text-center text-text-primary">
          Se existir uma conta com esse e-mail, você receberá um link para
          redefinir a senha.
        </p>
        <p className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-text-primary">Recuperar senha</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">
            E-mail <span className="text-primary">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Enviando…" : "Entrar"}
        </Button>
        <p className="text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </form>
    </>
  );
}
