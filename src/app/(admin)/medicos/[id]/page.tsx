import { notFound } from "next/navigation";
import { getDetalhesMedico, getConsultasMedico } from "../actions";
import { DetalhesMedicoClient } from "./detalhes-medico-client";

export default async function MedicoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const medico = await getDetalhesMedico(id);
  if (!medico) notFound();
  const consultas = await getConsultasMedico(id);
  return (
    <DetalhesMedicoClient
      medico={medico}
      consultas={consultas}
    />
  );
}
