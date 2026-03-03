import Link from "next/link";
import { verificarConfigSupabase } from "../verificar-config";
import { Button } from "@/components/ui/button";

export default async function VerificarConfigPage() {
  const check = await verificarConfigSupabase();

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-xl border border-outline bg-surface p-6">
      <h1 className="text-xl font-bold text-text-primary">Verificação do Supabase</h1>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          {check.urlDefinida ? "✓" : "✗"} URL definida
        </li>
        <li className="flex items-center gap-2">
          {check.urlCorreta ? "✓" : "✗"} URL correta (ogytuggahlscsiuhuyun)
        </li>
        <li className="flex items-center gap-2">
          {check.anonKeyDefinida ? "✓" : "✗"} Anon key definida
        </li>
        <li className="flex items-center gap-2">
          {check.anonKeyPareceValida ? "✓" : "✗"} Anon key parece válida (não é placeholder)
        </li>
      </ul>
      <p className="rounded-lg bg-background p-3 text-sm text-text-secondary">
        {check.mensagem}
      </p>
      <Button asChild variant="outline">
        <Link href="/login">Voltar ao login</Link>
      </Button>
    </div>
  );
}
