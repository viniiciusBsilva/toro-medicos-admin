import { useAdmin } from "@/context/admin-context";
import { temPermissao } from "@/lib/types/permissions";
import type { AdminPermissoes } from "@/lib/types/permissions";

type PermissaoCampo = keyof Omit<
  AdminPermissoes,
  "id" | "id_admin" | "created_at"
>;

export function usePermissoes() {
  const { permissoes } = useAdmin();
  return {
    permissoes,
    pode: (campo: PermissaoCampo) => temPermissao(permissoes, campo),
  };
}
