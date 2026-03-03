import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SenhaAlteradaPage() {
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-success bg-success/10 text-success">
          <CheckCircle2 className="h-12 w-12" strokeWidth={2} />
        </div>
      </div>
      <h1 className="mt-6 text-xl font-bold text-text-primary">
        Senha alterada com sucesso!
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Agora você já pode acessar sua conta normalmente.
      </p>
      <Button
        asChild
        className="mt-8 w-full border-2 border-primary bg-surface text-primary hover:bg-sidebar-active-bg hover:text-primary"
        size="lg"
        variant="outline"
      >
        <Link href="/login">Ir para login</Link>
      </Button>
    </div>
  );
}
