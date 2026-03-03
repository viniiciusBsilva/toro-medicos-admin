import { listarEquipe } from "./actions";
import { EquipeClient } from "./equipe-client";

export default async function EquipePage() {
  const membros = await listarEquipe();
  return <EquipeClient membrosIniciais={membros} />;
}
