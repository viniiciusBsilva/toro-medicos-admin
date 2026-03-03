"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, ChevronUp, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  listarEquipe,
  getPermissoesAdmin,
  salvarPermissoes,
  deleteAdmin,
  createAdmin,
  type MembroEquipe,
  type PermissoesPayload,
} from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminPermissoes } from "@/lib/types/permissions";
import { toast } from "sonner";

const CAMPOS_PERMISSAO = [
  { key: "gerenciar_equipe_adm", label: "Pode gerenciar a equipe administrativa?" },
  { key: "editar_num_wpp_suporte", label: "Pode editar o número de WhatsApp do suporte?" },
] as const;
const CONFIGURACOES_KEYS = ["gerenciar_equipe_adm", "editar_num_wpp_suporte"] as const;

const FINANCEIRO = [
  { key: "acessar_modulo_financeiro", label: "Pode acessar o módulo financeiro?" },
] as const;

const PACIENTES = [
  { key: "acessar_modulo_paciente", label: "Pode acessar o módulo de pacientes?" },
] as const;

const MEDICOS = [
  { key: "acessar_modulo_medico", label: "Pode acessar o módulo de médico?" },
  { key: "validar_cadastro_medicos", label: "Pode validar o cadastro de novos médicos?" },
] as const;
const MEDICOS_KEYS = ["acessar_modulo_medico", "validar_cadastro_medicos"] as const;

const DASHBOARD = [
  { key: "acessar_modulo_dashboard", label: "Pode acessar o módulo de dashboard?" },
] as const;

function toPayload(p: Partial<AdminPermissoes> | null): PermissoesPayload {
  return {
    gerenciar_equipe_adm: p?.gerenciar_equipe_adm ?? false,
    editar_num_wpp_suporte: p?.editar_num_wpp_suporte ?? false,
    acessar_modulo_financeiro: p?.acessar_modulo_financeiro ?? false,
    acessar_modulo_paciente: p?.acessar_modulo_paciente ?? false,
    acessar_modulo_medico: p?.acessar_modulo_medico ?? false,
    validar_cadastro_medicos: p?.validar_cadastro_medicos ?? false,
    acessar_modulo_dashboard: p?.acessar_modulo_dashboard ?? false,
  };
}

type PermissaoKey = keyof PermissoesPayload;

function SecaoPermissoes({
  titulo,
  campos,
  "selecionarTudoKeys": selecionarTudoKeys,
  payload,
  onChange,
  open,
  onToggle,
}: {
  titulo: string;
  campos: readonly { key: PermissaoKey; label: string }[];
  selecionarTudoKeys?: readonly PermissaoKey[];
  payload: PermissoesPayload;
  onChange: (k: PermissaoKey, v: boolean) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const allChecked = selecionarTudoKeys
    ? selecionarTudoKeys.every((k) => payload[k] === true)
    : false;

  return (
    <div className="border-b border-outline last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-primary/10 px-4 py-3 text-left font-medium text-[#0E1015]"
      >
        {titulo}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-4 pt-2">
          {selecionarTudoKeys && selecionarTudoKeys.length > 1 && (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => {
                  selecionarTudoKeys.forEach((k) => onChange(k, !allChecked));
                }}
                className="h-4 w-4 rounded border-outline"
              />
              <span className="text-sm text-[#0E1015]">Selecionar tudo</span>
            </label>
          )}
          {campos.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={payload[key] === true}
                onChange={(e) => onChange(key, e.target.checked)}
                className="h-4 w-4 rounded border-outline"
              />
              <span className="text-sm text-[#0E1015]">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function EquipeClient({ membrosIniciais }: { membrosIniciais: MembroEquipe[] }) {
  const router = useRouter();
  const [membros, setMembros] = useState<MembroEquipe[]>(membrosIniciais);
  const [selected, setSelected] = useState<MembroEquipe | null>(membrosIniciais[0] ?? null);
  const [permissoes, setPermissoes] = useState<AdminPermissoes | null>(null);
  const [payload, setPayload] = useState<PermissoesPayload>(toPayload(null));
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Configurações: true,
    Financeiro: true,
    Pacientes: true,
    Médicos: true,
    Dashboard: true,
  });
  const [isPendingSave, startSave] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();

  const [modalNovoUsuarioOpen, setModalNovoUsuarioOpen] = useState(false);
  const [novoUsuarioSuccess, setNovoUsuarioSuccess] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoPayload, setNovoPayload] = useState<PermissoesPayload>(toPayload(null));
  const [novoOpenSections, setNovoOpenSections] = useState<Record<string, boolean>>({
    Configurações: true,
    Financeiro: false,
    Pacientes: false,
    Médicos: false,
    Dashboard: false,
  });
  const [isPendingCreate, startCreate] = useTransition();

  useEffect(() => {
    setMembros(membrosIniciais);
    if (membrosIniciais.length && !selected) setSelected(membrosIniciais[0]);
  }, [membrosIniciais]);

  useEffect(() => {
    if (!selected) {
      setPermissoes(null);
      setPayload(toPayload(null));
      return;
    }
    getPermissoesAdmin(selected.id_admin).then((p) => {
      setPermissoes(p);
      setPayload(toPayload(p));
    });
  }, [selected?.id_admin]);

  const handlePermissaoChange = (key: PermissaoKey, value: boolean) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (name: string) => {
    setOpenSections((s) => ({ ...s, [name]: !s[name] }));
  };

  const handleSalvar = () => {
    if (!selected) return;
    startSave(async () => {
      const result = await salvarPermissoes(selected.id_admin, payload);
      if (result.ok) {
        toast.success("Alterações salvas.");
        getPermissoesAdmin(selected.id_admin).then(setPermissoes);
      } else {
        toast.error(result.error ?? "Erro ao salvar.");
      }
    });
  };

  const openModalNovoUsuario = () => {
    setNovoUsuarioSuccess(false);
    setNovoNome("");
    setNovoEmail("");
    setNovoPayload(toPayload(null));
    setNovoOpenSections({
      Configurações: true,
      Financeiro: false,
      Pacientes: false,
      Médicos: false,
      Dashboard: false,
    });
    setModalNovoUsuarioOpen(true);
  };

  const closeModalNovoUsuario = () => {
    setModalNovoUsuarioOpen(false);
    setNovoUsuarioSuccess(false);
    router.refresh();
  };

  const handleNovoUsuarioPermissaoChange = (key: PermissaoKey, value: boolean) => {
    setNovoPayload((prev) => ({ ...prev, [key]: value }));
  };

  const handleFinalizarCadastro = () => {
    const nome = novoNome.trim();
    const email = novoEmail.trim().toLowerCase();
    if (!nome) {
      toast.error("Informe o nome.");
      return;
    }
    if (!email) {
      toast.error("Informe o e-mail.");
      return;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      toast.error("E-mail inválido.");
      return;
    }
    startCreate(async () => {
      const result = await createAdmin(nome, email, novoPayload);
      if (result.ok) {
        setNovoUsuarioSuccess(true);
        setTimeout(() => closeModalNovoUsuario(), 2500);
      } else {
        toast.error(result.error ?? "Erro ao cadastrar.");
      }
    });
  };

  const handleExcluir = () => {
    if (!selected) return;
    if (!confirm("Excluir este usuário da equipe? Esta ação não pode ser desfeita.")) return;
    startDelete(async () => {
      const result = await deleteAdmin(selected.id_admin);
      if (result.ok) {
        toast.success("Usuário excluído da equipe.");
        router.refresh();
        setMembros((m) => m.filter((x) => x.id_admin !== selected.id_admin));
        setSelected((s) => (s?.id_admin === selected.id_admin ? null : s));
      } else {
        toast.error(result.error ?? "Erro ao excluir.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1 text-[#0E1015] hover:underline"
        >
          <ChevronLeft className="h-5 w-5" />
          Gerenciar equipe
        </Link>
        <Button
          type="button"
          className="bg-primary hover:bg-primary-hover"
          onClick={openModalNovoUsuario}
        >
          Adicionar usuário
        </Button>
      </div>

      <Dialog open={modalNovoUsuarioOpen} onOpenChange={(open) => !open && closeModalNovoUsuario()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" showClose={!isPendingCreate && !novoUsuarioSuccess}>
          <DialogHeader>
            <DialogTitle className="text-[#0E1015]">Novo usuário</DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para cadastrar novo usuário na equipe administrativa.
            </DialogDescription>
          </DialogHeader>
          {novoUsuarioSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-center text-[#0E1015]">
                Um convite com as credenciais de acesso foi enviado para o e-mail do usuário cadastrado!
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary-hover"
                disabled
              >
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Finalizando...
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="novo-nome" className="text-[#0E1015]">Nome</Label>
                  <Input
                    id="novo-nome"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="nome"
                    className="text-[#0E1015]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novo-email" className="text-[#0E1015]">E-mail</Label>
                  <Input
                    id="novo-email"
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="email.com"
                    className="text-[#0E1015]"
                  />
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-medium text-[#0E1015]">Permissões do usuário</h3>
                <div className="rounded-lg border border-outline overflow-hidden">
                  <SecaoPermissoes
                    titulo="Configurações"
                    campos={CAMPOS_PERMISSAO}
                    selecionarTudoKeys={CONFIGURACOES_KEYS}
                    payload={novoPayload}
                    onChange={handleNovoUsuarioPermissaoChange}
                    open={novoOpenSections["Configurações"] ?? true}
                    onToggle={() => setNovoOpenSections((s) => ({ ...s, Configurações: !s["Configurações"] }))}
                  />
                  <SecaoPermissoes
                    titulo="Financeiro"
                    campos={FINANCEIRO}
                    payload={novoPayload}
                    onChange={handleNovoUsuarioPermissaoChange}
                    open={novoOpenSections["Financeiro"] ?? false}
                    onToggle={() => setNovoOpenSections((s) => ({ ...s, Financeiro: !s["Financeiro"] }))}
                  />
                  <SecaoPermissoes
                    titulo="Pacientes"
                    campos={PACIENTES}
                    payload={novoPayload}
                    onChange={handleNovoUsuarioPermissaoChange}
                    open={novoOpenSections["Pacientes"] ?? false}
                    onToggle={() => setNovoOpenSections((s) => ({ ...s, Pacientes: !s["Pacientes"] }))}
                  />
                  <SecaoPermissoes
                    titulo="Médicos"
                    campos={MEDICOS}
                    selecionarTudoKeys={MEDICOS_KEYS}
                    payload={novoPayload}
                    onChange={handleNovoUsuarioPermissaoChange}
                    open={novoOpenSections["Médicos"] ?? false}
                    onToggle={() => setNovoOpenSections((s) => ({ ...s, Médicos: !s["Médicos"] }))}
                  />
                  <SecaoPermissoes
                    titulo="Dashboard"
                    campos={DASHBOARD}
                    payload={novoPayload}
                    onChange={handleNovoUsuarioPermissaoChange}
                    open={novoOpenSections["Dashboard"] ?? false}
                    onToggle={() => setNovoOpenSections((s) => ({ ...s, Dashboard: !s["Dashboard"] }))}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalNovoUsuarioOpen(false)}
                  disabled={isPendingCreate}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-primary hover:bg-primary-hover"
                  onClick={handleFinalizarCadastro}
                  disabled={isPendingCreate}
                >
                  {isPendingCreate ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Finalizando...
                    </>
                  ) : (
                    "Finalizar e cadastrar"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-outline">
              {membros.map((m) => (
                <li key={m.id_admin}>
                  <button
                    type="button"
                    onClick={() => setSelected(m)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                      selected?.id_admin === m.id_admin ? "bg-muted" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[#0E1015]">{m.nome || "Sem nome"}</p>
                      <p className="text-sm text-text-secondary">{m.email || ""}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
                  </button>
                </li>
              ))}
            </ul>
            {membros.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-text-secondary">
                Nenhum outro usuário na equipe.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-6 pt-6">
            {selected ? (
              <>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
                    {selected.profile_image ? (
                      <img
                        src={selected.profile_image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-text-secondary" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-[#0E1015]">{selected.nome || "Sem nome"}</p>
                  <p className="text-sm text-text-secondary">{selected.email || ""}</p>
                </div>

                <div>
                  <h3 className="mb-3 font-medium text-[#0E1015]">Permissões do usuário</h3>
                  <div className="rounded-lg border border-outline overflow-hidden">
                    <SecaoPermissoes
                      titulo="Configurações"
                      campos={CAMPOS_PERMISSAO}
                      selecionarTudoKeys={CONFIGURACOES_KEYS}
                      payload={payload}
                      onChange={handlePermissaoChange}
                      open={openSections["Configurações"] ?? true}
                      onToggle={() => toggleSection("Configurações")}
                    />
                    <SecaoPermissoes
                      titulo="Financeiro"
                      campos={FINANCEIRO}
                      payload={payload}
                      onChange={handlePermissaoChange}
                      open={openSections["Financeiro"] ?? true}
                      onToggle={() => toggleSection("Financeiro")}
                    />
                    <SecaoPermissoes
                      titulo="Pacientes"
                      campos={PACIENTES}
                      payload={payload}
                      onChange={handlePermissaoChange}
                      open={openSections["Pacientes"] ?? true}
                      onToggle={() => toggleSection("Pacientes")}
                    />
                    <SecaoPermissoes
                      titulo="Médicos"
                      campos={MEDICOS}
                      selecionarTudoKeys={MEDICOS_KEYS}
                      payload={payload}
                      onChange={handlePermissaoChange}
                      open={openSections["Médicos"] ?? true}
                      onToggle={() => toggleSection("Médicos")}
                    />
                    <SecaoPermissoes
                      titulo="Dashboard"
                      campos={DASHBOARD}
                      payload={payload}
                      onChange={handlePermissaoChange}
                      open={openSections["Dashboard"] ?? true}
                      onToggle={() => toggleSection("Dashboard")}
                    />
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-outline pt-4">
                  <button
                    type="button"
                    onClick={handleExcluir}
                    disabled={isPendingDelete}
                    className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    Excluir usuário
                  </button>
                  <Button
                    type="button"
                    onClick={handleSalvar}
                    disabled={isPendingSave}
                    className="bg-[#1e3a5f] hover:bg-[#2a4a6f]"
                  >
                    Salvar alterações
                  </Button>
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-text-secondary">
                Selecione um usuário na lista.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
