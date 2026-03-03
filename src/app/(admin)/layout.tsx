import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { AdminLayoutClient } from "./admin-layout-client";
import { getAdminWithPermissoes } from "./get-admin-with-permissoes";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const service = createServiceClient();
  const { data: adminRow } = await service
    .from("user_admin")
    .select("id")
    .eq("id_user", user.id)
    .limit(1)
    .maybeSingle();
  if (!adminRow) {
    redirect("/acesso-negado");
  }
  const initial = await getAdminWithPermissoes();
  return (
    <AdminLayoutClient initial={initial}>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </AdminLayoutClient>
  );
}
