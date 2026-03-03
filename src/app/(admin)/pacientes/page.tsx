import { Suspense } from "react";
import { listarPacientes } from "./actions";
import { PacientesClient } from "./pacientes-client";

type IdadeFilter = "0-12" | "13-55" | "56+";

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; idade?: string; cidade?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim();
  const idadeParam = params.idade;
  const idade = idadeParam
    ? (idadeParam.split(",").filter((x) => ["0-12", "13-55", "56+"].includes(x)) as IdadeFilter[])
    : undefined;
  const cidade = params.cidade?.trim();

  const data = await listarPacientes(page, q, idade, cidade);

  return (
    <Suspense fallback={<div className="animate-pulse rounded-lg bg-outline/30 h-64" />}>
      <PacientesClient initialData={data} initialPage={page} />
    </Suspense>
  );
}
