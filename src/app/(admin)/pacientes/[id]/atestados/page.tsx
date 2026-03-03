import { notFound } from "next/navigation";
import { getDetalhesPaciente, getAtestadosPaciente } from "../../actions";
import { AtestadosClient } from "./atestados-client";

export default async function AtestadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paciente = await getDetalhesPaciente(id);
  if (!paciente) notFound();
  const atestados = await getAtestadosPaciente(paciente.id_user);
  return <AtestadosClient pacienteId={id} atestados={atestados} />;
}
