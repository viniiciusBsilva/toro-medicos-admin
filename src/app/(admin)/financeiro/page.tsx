import {
  getIndicadoresFinanceiros,
  getMediaConsultasPorEspecialidade,
  listarRepasses,
  listarReembolsos,
} from "./actions";
import { FinanceiroClient } from "./financeiro-client";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ anoMes?: string; q?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const anoMes =
    params.anoMes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const busca = params.q ?? "";

  const [indicadores, medias, repassesData, reembolsosData] = await Promise.all([
    getIndicadoresFinanceiros(anoMes),
    getMediaConsultasPorEspecialidade(anoMes),
    listarRepasses(1, anoMes, busca),
    listarReembolsos(1, anoMes, busca),
  ]);

  return (
    <FinanceiroClient
      initialAnoMes={anoMes}
      initialIndicadores={indicadores}
      initialMedias={medias}
      initialRepasses={repassesData.repasses}
      initialRepassesTotal={repassesData.total}
      initialRepassesTotalPages={repassesData.totalPages}
      initialReembolsos={reembolsosData.reembolsos}
      initialReembolsosTotal={reembolsosData.total}
      initialReembolsosTotalPages={reembolsosData.totalPages}
    />
  );
}
