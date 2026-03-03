"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pacientes": "Pacientes",
  "/medicos": "Médicos",
  "/financeiro": "Gestão financeira",
  "/consultas": "Consultas",
  "/notificacoes": "Notificações",
  "/configuracoes": "Configurações",
  "/configuracoes/equipe": "Equipe",
  "/configuracoes/equipe/adicionar": "Adicionar usuário",
  "/configuracoes/alterar-senha": "Alterar senha",
  "/configuracoes/whatsapp": "Editar WhatsApp do suporte",
  "/configuracoes/reembolso": "Editar % de cancelamento",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.match(/^\/pacientes\/[^/]+\/prontuario$/)) return "Informações de saúde";
  if (pathname.match(/^\/pacientes\/[^/]+\/exames$/)) return "Exames";
  if (pathname.match(/^\/pacientes\/[^/]+\/atestados$/)) return "Atestados";
  if (pathname.match(/^\/pacientes\/[^/]+\/receitas$/)) return "Receitas";
  if (pathname.match(/^\/pacientes\/[^/]+$/)) return "Detalhes do Paciente";
  if (pathname.startsWith("/pacientes/")) return "Pacientes";
  if (pathname === "/medicos/pendentes" || pathname.startsWith("/medicos/pendentes?"))
    return "Médicos com aprovação pendente";
  if (pathname.match(/^\/medicos\/[^/]+\/aprovacao$/)) return "Aprovação de documentos";
  if (pathname.match(/^\/medicos\/[^/]+$/)) return "Detalhes do médico";
  if (pathname.startsWith("/medicos/")) return "Médicos";
  if (pathname.match(/^\/consultas\/[^/]+$/)) return "Detalhes da consulta";
  if (pathname.startsWith("/consultas/")) return "Consultas";
  return "Admin";
}

export function AdminTopbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="border-b border-outline bg-surface px-8 py-5">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
    </header>
  );
}
