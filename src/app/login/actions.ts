"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export type LoginResult = {
  error?: string;
};

/** Verifica se o usuário autenticado está em user_admin. Usado após o login no cliente. */
export async function checkUserIsAdmin(): Promise<{ isAdmin: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { isAdmin: false };
  }
  const service = createServiceClient();
  const { data, error } = await service
    .from("user_admin")
    .select("id")
    .eq("id_user", user.id)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[checkUserIsAdmin]", error);
    return { isAdmin: false };
  }
  return { isAdmin: !!data };
}
