"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkUserIsAdmin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const isInvalidCreds = error.message === "Invalid login credentials";
        const isAuthError = error.status === 401;
        const msg = isInvalidCreds
          ? "E-mail ou senha incorretos."
          : isAuthError
            ? "Falha na autenticação. Verifique se a chave do Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY) está correta no .env.local e reinicie o servidor."
            : error.message;
        toast.error(msg);
        return;
      }
      if (!data.user) {
        toast.error("Erro ao entrar. Tente novamente.");
        return;
      }
      const { isAdmin } = await checkUserIsAdmin();
      if (!isAdmin) {
        await supabase.auth.signOut();
        router.push("/acesso-negado");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-text-primary">Bem vindo</h1>
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
        <div className="space-y-2">
          <Label htmlFor="password">
            Senha <span className="text-primary">*</span>
          </Label>
          <PasswordInput
            id="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        <div>
          <Link
            href="/login/recuperar-senha"
            className="text-sm font-medium text-primary hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
          />
          Continuar conectado
        </label>
      </form>
    </>
  );
}
