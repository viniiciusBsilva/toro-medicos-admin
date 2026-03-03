"use client";

import type { ReactNode } from "react";

type PermissaoGuardProps = {
  permissao: boolean;
  children: ReactNode;
  fallback?: ReactNode;
};

/** Placeholder: verifica permissão antes de renderizar children. */
export function PermissaoGuard({
  permissao,
  children,
  fallback = null,
}: PermissaoGuardProps) {
  if (!permissao) return <>{fallback}</>;
  return <>{children}</>;
}
