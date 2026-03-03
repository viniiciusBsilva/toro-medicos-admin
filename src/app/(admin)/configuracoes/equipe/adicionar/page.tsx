import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdicionarUsuarioPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/configuracoes/equipe"
        className="inline-flex items-center gap-1 text-[#0E1015] hover:underline"
      >
        <ChevronLeft className="h-5 w-5" />
        Voltar
      </Link>
      <p className="text-text-secondary">Adicionar usuário à equipe — em breve.</p>
      <Button variant="outline" asChild>
        <Link href="/configuracoes/equipe">Voltar para Gerenciar equipe</Link>
      </Button>
    </div>
  );
}
