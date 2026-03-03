export type AdminPermissoes = {
  id: number;
  id_admin: string;
  gerenciar_equipe_adm: boolean | null;
  editar_num_wpp_suporte: boolean | null;
  acessar_modulo_financeiro: boolean | null;
  acessar_modulo_paciente: boolean | null;
  acessar_modulo_medico: boolean | null;
  validar_cadastro_medicos: boolean | null;
  acessar_modulo_dashboard: boolean | null;
  created_at: string;
};

type PermissaoCampo = keyof Omit<
  AdminPermissoes,
  "id" | "id_admin" | "created_at"
>;

/** Nunca usar truthy — null é acesso negado. Apenas === true libera. */
export function temPermissao(
  permissoes: AdminPermissoes | null,
  campo: PermissaoCampo
): boolean {
  return permissoes?.[campo] === true;
}
