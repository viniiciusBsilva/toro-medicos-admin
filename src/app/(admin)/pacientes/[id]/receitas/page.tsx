import { notFound } from "next/navigation";
import { getDetalhesPaciente, getReceitasPaciente } from "../../actions";
import { ReceitasClient } from "./receitas-client";

export default async function ReceitasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paciente = await getDetalhesPaciente(id);
  if (!paciente) notFound();
  const receitas = await getReceitasPaciente(paciente.id_user);
  return <ReceitasClient pacienteId={id} receitas={receitas} />;
}
