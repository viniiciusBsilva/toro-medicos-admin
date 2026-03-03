"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const updateSession = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setHasSession(!!session);
      });
    };

    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const hasRecoveryHash = hash.includes("type=recovery") && hash.includes("access_token=");

    if (hasRecoveryHash) {
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(() => {
            updateSession();
            window.history.replaceState(null, "", window.location.pathname);
          })
          .catch(() => setHasSession(false));
        return;
      }
    }

    updateSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        updateSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      await router.push("/login/senha-alterada");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (hasSession === null) {
    return (
      <p className="text-center text-text-secondary">Carregando…</p>
    );
  }

  if (!hasSession) {
    return (
      <>
        <p className="text-center text-text-primary">
          Link inválido ou expirado. Solicite uma nova recuperação de senha.
        </p>
        <Button asChild className="mt-6 w-full" variant="outline">
          <Link href="/login/recuperar-senha">Solicitar novamente</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-text-primary">Recuperar senha</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Crie uma nova senha para acessar sua conta.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">
            Criar nova senha <span className="text-primary">*</span>
          </Label>
          <PasswordInput
            id="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">
            Confirmar senha <span className="text-primary">*</span>
          </Label>
          <PasswordInput
            id="confirm"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </>
  );
}
