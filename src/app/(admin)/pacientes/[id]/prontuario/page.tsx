import { notFound } from "next/navigation";
import { getProntuarioPaciente } from "../../actions";
import { ProntuarioClient } from "./prontuario-client";

export default async function ProntuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProntuarioPaciente(id);
  if (!data) notFound();
  return <ProntuarioClient data={data} />;
}
