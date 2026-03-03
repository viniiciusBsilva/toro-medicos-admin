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

/** Carrega o admin logado (user + user_admin) e suas permissões (admin_permissoes). */
export async function getAdminWithPermissoes(): Promise<AdminWithPermissoes> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return { admin: null, permissoes: null };

    const service = createServiceClient();
    const { data: adminRow, error: errAdmin } = await service
      .from("user_admin")
      .select("id, id_user")
      .eq("id_user", user.id)
      .maybeSingle();
    if (errAdmin || !adminRow) return { admin: null, permissoes: null };

    const idAdmin = (adminRow as { id: string; id_user: string }).id;
    const { data: userRow } = await service
      .from("user")
      .select("id, nome, email")
      .eq("id", user.id)
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
