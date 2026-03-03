import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAdmin, getConfiguracoes } from "./actions";
import { ConfiguracoesClient } from "./configuracoes-client";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [perfil, config] = await Promise.all([
    getPerfilAdmin(),
    getConfiguracoes(),
  ]);

  return (
    <ConfiguracoesClient
      perfil={perfil}
      config={config}
    />
  );
}
