import { notFound } from "next/navigation";
import {
  getDetalhesPaciente,
  getConsultasPaciente,
} from "../actions";
import { DetalhesPacienteClient } from "./detalhes-paciente-client";

export default async function PacienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paciente = await getDetalhesPaciente(id);
  if (!paciente) notFound();
  const consultas = await getConsultasPaciente(paciente.id_user);
  return (
    <DetalhesPacienteClient
      paciente={paciente}
      consultas={consultas}
    />
  );
}
