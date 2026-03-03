/** Placeholder: gerar com `npx supabase gen types typescript --project-id ogytuggahlscsiuhuyun` quando disponível. */

export type UserRow = Record<string, unknown>;
export type UserInsert = Record<string, unknown>;
export type UserUpdate = Partial<UserInsert>;

export type UserAdminRow = Record<string, unknown>;
export type UserAdminInsert = Record<string, unknown>;
export type UserAdminUpdate = Partial<UserAdminInsert>;

export type AdminPermissoesRow = Record<string, unknown>;
export type AdminPermissoesInsert = Record<string, unknown>;
export type AdminPermissoesUpdate = Partial<AdminPermissoesInsert>;

export type UserMedicoRow = Record<string, unknown>;
export type UserMedicoInsert = Record<string, unknown>;
export type UserMedicoUpdate = Partial<UserMedicoInsert>;

export type UserPacienteRow = Record<string, unknown>;
export type UserPacienteInsert = Record<string, unknown>;
export type UserPacienteUpdate = Partial<UserPacienteInsert>;

export type ConsultaRow = Record<string, unknown>;
export type ConsultaInsert = Record<string, unknown>;
export type ConsultaUpdate = Partial<ConsultaInsert>;

export type ConfiguracoesRow = Record<string, unknown>;
export type ConfiguracoesInsert = Record<string, unknown>;
export type ConfiguracoesUpdate = Partial<ConfiguracoesInsert>;

export type AvaliacoesRow = Record<string, unknown>;
export type AvaliacoesInsert = Record<string, unknown>;
export type AvaliacoesUpdate = Partial<AvaliacoesInsert>;

export type EnderecoRow = Record<string, unknown>;
export type EnderecoInsert = Record<string, unknown>;
export type EnderecoUpdate = Partial<EnderecoInsert>;

export type Database = {
  public: {
    Tables: {
      user: { Row: UserRow; Insert: UserInsert; Update: UserUpdate };
      user_admin: {
        Row: UserAdminRow;
        Insert: UserAdminInsert;
        Update: UserAdminUpdate;
      };
      admin_permissoes: {
        Row: AdminPermissoesRow;
        Insert: AdminPermissoesInsert;
        Update: AdminPermissoesUpdate;
      };
      user_medico: {
        Row: UserMedicoRow;
        Insert: UserMedicoInsert;
        Update: UserMedicoUpdate;
      };
      user_paciente: {
        Row: UserPacienteRow;
        Insert: UserPacienteInsert;
        Update: UserPacienteUpdate;
      };
      consulta: {
        Row: ConsultaRow;
        Insert: ConsultaInsert;
        Update: ConsultaUpdate;
      };
      configuracoes: {
        Row: ConfiguracoesRow;
        Insert: ConfiguracoesInsert;
        Update: ConfiguracoesUpdate;
      };
      avaliacoes: {
        Row: AvaliacoesRow;
        Insert: AvaliacoesInsert;
        Update: AvaliacoesUpdate;
      };
      endereco: {
        Row: EnderecoRow;
        Insert: EnderecoInsert;
        Update: EnderecoUpdate;
      };
    };
  };
};
