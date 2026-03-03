"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  UserCircle,
  CircleDollarSign,
  FileText,
  Bell,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { usePermissoes } from "@/hooks/use-permissoes";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permissao: "acessar_modulo_dashboard" as const },
  { href: "/pacientes", label: "Pacientes", icon: UserPlus, permissao: "acessar_modulo_paciente" as const },
  { href: "/medicos", label: "Médicos", icon: UserCircle, permissao: "acessar_modulo_medico" as const },
  { href: "/financeiro", label: "Gestão financeira", icon: CircleDollarSign, permissao: "acessar_modulo_financeiro" as const },
  { href: "/consultas", label: "Consultas", icon: FileText, permissao: null },
] as const;

const BOTTOM_ITEMS = [
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { pode } = usePermissoes();

  const navItemsFiltered = useMemo(() => {
    return NAV_ITEMS.filter((item) => item.permissao == null || pode(item.permissao));
  }, [pode]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const width = collapsed ? "w-[72px]" : "w-60";

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-outline bg-surface transition-[width] duration-200",
        width
      )}
    >
      {/* Logo + menu toggle */}
      <div className="flex h-16 items-center justify-between border-b border-outline px-4">
        {!collapsed ? (
          <Image
            src="/images/Marca.png"
            alt="Tôro Médicos"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        ) : (
          <Image
            src="/images/Marca.png"
            alt="Tôro Médicos"
            width={40}
            height={40}
            className="h-8 w-8 object-contain"
            priority
          />
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-md p-2 text-text-secondary hover:bg-background hover:text-text-primary"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Nav principal */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItemsFiltered.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active-bg text-sidebar-active-text"
                  : "text-text-primary hover:bg-background",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Notificações + Configurações */}
      <div className="border-t border-outline p-3">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active-bg text-sidebar-active-text"
                  : "text-text-primary hover:bg-background",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="flex flex-col items-center gap-3 border-t border-outline p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E00000] text-white transition-colors hover:bg-[#c20000]"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
        <p className="text-center text-xs text-[#888888]">
          Powered by Fraktal Softwares
        </p>
      </div>
    </aside>
  );
}
