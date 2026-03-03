import { notFound } from "next/navigation";
import { getDetalhesPaciente, getExamesPaciente } from "../../actions";
import { ExamesClient } from "./exames-client";

export default async function ExamesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paciente = await getDetalhesPaciente(id);
  if (!paciente) notFound();
  const exames = await getExamesPaciente(id, paciente.id_user);
  return <ExamesClient pacienteId={id} exames={exames} />;
}
