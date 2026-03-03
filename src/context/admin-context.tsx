"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";
import type { AdminPermissoes } from "@/lib/types/permissions";

export type AdminUser = {
  id: string;
  nome: string;
  email: string;
  admin_id: string;
};

export type AdminContextType = {
  admin: AdminUser | null;
  permissoes: AdminPermissoes | null;
  loading: boolean;
};

const AdminContext = createContext<AdminContextType>({
  admin: null,
  permissoes: null,
  loading: true,
});

export function AdminProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AdminContextType;
}) {
  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
