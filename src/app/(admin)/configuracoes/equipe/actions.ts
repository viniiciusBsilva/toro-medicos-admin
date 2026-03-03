"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { AdminPermissoes } from "@/lib/types/permissions";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DELETE_ADMIN_URL = `${SUPABASE_URL}/functions/v1/delete-admin`;
const CREATE_ADMIN_URL = `${SUPABASE_URL}/functions/v1/create-admin`;

export type MembroEquipe = {
  /** PK de user_admin — usar em admin_permissoes.id_admin e delete-admin */
  id_admin: string;
  id_user: string;
  nome: string | null;
  email: string | null;
  profile_image: string | null;
};

/** Lista admins (user_admin + user), excluindo o usuário logado. */
export async function listarEquipe(): Promise<MembroEquipe[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return [];

    const service = createServiceClient();
    const { data: adminRows, error: errAdmins } = await service
      .from("user_admin")
      .select("id, id_user");
    if (errAdmins || !adminRows?.length) return [];

    const filtered = (adminRows as { id: string; id_user: string }[]).filter(
      (r) => r.id_user !== user.id
    );
    if (filtered.length === 0) return [];

    const idUsers = filtered.map((r) => r.id_user);
    const { data: users, error } = await service
      .from("user")
      .select("id, nome, email, profile_image")
      .in("id", idUsers);
    if (error || !users) return [];

    const userMap = new Map(
      (users as { id: string; nome: string | null; email: string | null; profile_image: string | null }[]).map(
        (u) => [u.id, u]
      )
    );
    return filtered.map((r) => {
      const u = userMap.get(r.id_user);
      return {
        id_admin: r.id,
        id_user: r.id_user,
        nome: u?.nome ?? null,
        email: u?.email ?? null,
        profile_image: u?.profile_image ?? null,
      };
    });
  } catch {
    return [];
  }
}

/** Retorna permissões do admin (id_admin = id do user). */
export async function getPermissoesAdmin(
  id_admin: string
): Promise<AdminPermissoes | null> {
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from("admin_permissoes")
      .select("*")
      .eq("id_admin", id_admin)
      .maybeSingle();
    if (error || !data) return null;
    return data as AdminPermissoes;
  } catch {
    return null;
  }
}

export type PermissoesPayload = {
  gerenciar_equipe_adm: boolean | null;
  editar_num_wpp_suporte: boolean | null;
  acessar_modulo_financeiro: boolean | null;
  acessar_modulo_paciente: boolean | null;
  acessar_modulo_medico: boolean | null;
  validar_cadastro_medicos: boolean | null;
  acessar_modulo_dashboard: boolean | null;
};

/** Salva permissões do admin (upsert em admin_permissoes). */
export async function salvarPermissoes(
  id_admin: string,
  payload: PermissoesPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const service = createServiceClient();
    const { data: existing } = await service
      .from("admin_permissoes")
      .select("id")
      .eq("id_admin", id_admin)
      .maybeSingle();

    const row = {
      id_admin,
      gerenciar_equipe_adm: payload.gerenciar_equipe_adm ?? false,
      editar_num_wpp_suporte: payload.editar_num_wpp_suporte ?? false,
      acessar_modulo_financeiro: payload.acessar_modulo_financeiro ?? false,
      acessar_modulo_paciente: payload.acessar_modulo_paciente ?? false,
      acessar_modulo_medico: payload.acessar_modulo_medico ?? false,
      validar_cadastro_medicos: payload.validar_cadastro_medicos ?? false,
      acessar_modulo_dashboard: payload.acessar_modulo_dashboard ?? false,
    };

    if (existing) {
      const { error } = await service
        .from("admin_permissoes")
        .update(row)
        .eq("id_admin", id_admin);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await service.from("admin_permissoes").insert(row);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Chama a Edge Function delete-admin. */
export async function deleteAdmin(
  id_admin: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(DELETE_ADMIN_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_admin }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Chama a Edge Function create-admin. */
export async function createAdmin(
  nome: string,
  email: string,
  permissoes: PermissoesPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const body = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      permissoes: {
        gerenciar_equipe_adm: permissoes.gerenciar_equipe_adm ?? false,
        editar_num_wpp_suporte: permissoes.editar_num_wpp_suporte ?? false,
        acessar_modulo_financeiro: permissoes.acessar_modulo_financeiro ?? false,
        acessar_modulo_paciente: permissoes.acessar_modulo_paciente ?? false,
        acessar_modulo_medico: permissoes.acessar_modulo_medico ?? false,
        validar_cadastro_medicos: permissoes.validar_cadastro_medicos ?? false,
        acessar_modulo_dashboard: permissoes.acessar_modulo_dashboard ?? false,
      },
    };
    const res = await fetch(CREATE_ADMIN_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
