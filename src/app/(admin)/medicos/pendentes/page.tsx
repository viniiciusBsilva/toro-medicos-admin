import { Suspense } from "react";
import { listarMedicos, contarMedicosPendentes, type StatusMedico } from "../actions";
import { MedicosClient } from "../medicos-client";

export default async function MedicosPendentesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    filtro?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim();
  const statusParam = params.status;
  const statusList = ["aprovado", "em_analise", "reprovado", "banido"] as const;
  const status: StatusMedico[] | undefined = statusParam
    ? statusParam
        .split(",")
        .filter((x): x is StatusMedico => statusList.includes(x as typeof statusList[number]))
    : undefined;
  const filtro = params.filtro?.trim();

  const [data, pendentesCount] = await Promise.all([
    listarMedicos(page, q, status, filtro, true),
    contarMedicosPendentes(),
  ]);

  return (
    <Suspense fallback={<div className="animate-pulse rounded-lg bg-outline/30 h-64" />}>
      <MedicosClient
        initialData={data}
        initialPage={page}
        pendentesCount={pendentesCount}
        apenasPendentes={true}
      />
    </Suspense>
  );
}
