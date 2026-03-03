import { listarConsultas } from "./actions";
import { ConsultasClient } from "./consultas-client";

export default async function ConsultasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; anoMes?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const now = new Date();
  const anoMes = params.anoMes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const busca = params.q ?? "";
  const data = await listarConsultas(page, anoMes, busca);
  return <ConsultasClient initialData={data} initialAnoMes={anoMes} />;
}
