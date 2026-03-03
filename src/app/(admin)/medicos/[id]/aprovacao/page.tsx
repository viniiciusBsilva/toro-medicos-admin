import { notFound } from "next/navigation";
import { getMedicoParaAprovacao } from "../../actions";
import { AprovacaoClient } from "./aprovacao-client";

export default async function MedicoAprovacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const medico = await getMedicoParaAprovacao(id);
  if (!medico) notFound();
  return <AprovacaoClient medico={medico} />;
}
