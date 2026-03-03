import { getDashboardData } from "./actions";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ anoMes?: string; q?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const anoMes = params.anoMes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const data = await getDashboardData(anoMes);
  return <DashboardClient initialData={data} initialAnoMes={anoMes} />;
}
