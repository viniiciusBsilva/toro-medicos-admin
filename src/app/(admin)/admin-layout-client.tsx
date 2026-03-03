"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminProvider } from "@/context/admin-context";
import { usePermissoes } from "@/hooks/use-permissoes";
import type { AdminPermissoes } from "@/lib/types/permissions";
import type { AdminWithPermissoes } from "./get-admin-with-permissoes";

type PermissaoCampo = keyof Omit<AdminPermissoes, "id" | "id_admin" | "created_at">;

const ROTA_PERMISSAO: { pattern: RegExp | string; campo: PermissaoCampo }[] = [
  { pattern: /^\/dashboard\/?$/, campo: "acessar_modulo_dashboard" },
  { pattern: /^\/pacientes(\/|$)/, campo: "acessar_modulo_paciente" },
  { pattern: /^\/medicos\/pendentes(\/|$)/, campo: "validar_cadastro_medicos" },
  { pattern: /\/medicos\/[^/]+\/aprovacao\/?$/, campo: "validar_cadastro_medicos" },
  { pattern: /^\/medicos(\/|$)/, campo: "acessar_modulo_medico" },
  { pattern: /^\/financeiro(\/|$)/, campo: "acessar_modulo_financeiro" },
  { pattern: "/configuracoes/equipe", campo: "gerenciar_equipe_adm" },
  { pattern: "/configuracoes/whatsapp", campo: "editar_num_wpp_suporte" },
];

function PermissaoRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pode } = usePermissoes();

  useEffect(() => {
    for (const { pattern, campo } of ROTA_PERMISSAO) {
      const match = typeof pattern === "string" ? pathname.includes(pattern) : pattern.test(pathname);
      if (match && !pode(campo)) {
        router.replace("/acesso-negado");
        return;
      }
    }
  }, [pathname, pode, router]);

  return <>{children}</>;
}

export function AdminLayoutClient({
  initial,
  children,
}: {
  initial: AdminWithPermissoes;
  children: React.ReactNode;
}) {
  return (
    <AdminProvider
      value={{
        admin: initial.admin,
        permissoes: initial.permissoes,
        loading: false,
      }}
    >
      <PermissaoRouteGuard>{children}</PermissaoRouteGuard>
    </AdminProvider>
  );
}
