import { listarNotificacoes } from "./actions";
import { NotificacoesClient } from "./notificacoes-client";

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const params = await searchParams;
  const filtroParam = params.filtro?.toLowerCase();
  const filtro =
    filtroParam === "lidas" || filtroParam === "nao_lidas" ? filtroParam : "todas";
  const { notificacoes } = await listarNotificacoes(filtro);
  return (
    <NotificacoesClient initialNotificacoes={notificacoes} initialFiltro={filtro} />
  );
}
