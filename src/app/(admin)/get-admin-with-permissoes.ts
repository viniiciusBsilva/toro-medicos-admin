import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { AdminPermissoes } from "@/lib/types/permissions";

export type AdminWithPermissoes = {
  admin: {
    id: string;
    nome: string;
    email: string;
    admin_id: string;
  } | null;
  permissoes: AdminPermissoes | null;
};

const CACHE_REVALIDATE_SECONDS = 60;

/** Carrega admin + permissões por id do user (cacheado para não refazer em toda navegação). */
async function fetchAdminWithPermissoesByUserId(userId: string): Promise<AdminWithPermissoes> {
  try {
    const service = createServiceClient();
    const { data: adminRow, error: errAdmin } = await service
      .from("user_admin")
      .select("id, id_user")
      .eq("id_user", userId)
      .maybeSingle();
    if (errAdmin || !adminRow) return { admin: null, permissoes: null };

    const idAdmin = (adminRow as { id: string; id_user: string }).id;
    const { data: userRow } = await service
      .from("user")
      .select("id, nome, email")
      .eq("id", userId)
      .maybeSingle();
    const u = userRow as { id: string; nome: string | null; email: string | null } | null;
    const admin = u
      ? {
          id: u.id,
          nome: u.nome ?? "",
          email: u.email ?? "",
          admin_id: idAdmin,
        }
      : null;

    const { data: permRow } = await service
      .from("admin_permissoes")
      .select("*")
      .eq("id_admin", idAdmin)
      .maybeSingle();
    const permissoes = permRow as AdminPermissoes | null;

    return { admin, permissoes };
  } catch {
    return { admin: null, permissoes: null };
  }
}

/** Carrega admin + permissões por userId (cacheado). Use no layout quando já tiver o user. */
export function getAdminWithPermissoesForUser(userId: string): Promise<AdminWithPermissoes> {
  return unstable_cache(
    () => fetchAdminWithPermissoesByUserId(userId),
    ["admin-with-permissoes", userId],
    { revalidate: CACHE_REVALIDATE_SECONDS }
  )();
}

/** Carrega o admin logado e suas permissões. Cache por user.id para navegação rápida entre telas. */
export async function getAdminWithPermissoes(): Promise<AdminWithPermissoes> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return { admin: null, permissoes: null };

    return getAdminWithPermissoesForUser(user.id);
  } catch {
    return { admin: null, permissoes: null };
  }
}
