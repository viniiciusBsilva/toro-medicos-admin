import { notFound } from "next/navigation";
import { getDetalhesConsulta } from "../actions";
import { DetalhesConsultaClient } from "./detalhes-consulta-client";

export default async function ConsultaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detalhes = await getDetalhesConsulta(id);
  if (!detalhes) notFound();
  return <DetalhesConsultaClient detalhes={detalhes} />;
}
