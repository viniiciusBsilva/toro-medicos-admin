"use client";

import { useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Upload, ImageIcon } from "lucide-react";
import { updateFotoPerfil, uploadFotoPerfil } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePermissoes } from "@/hooks/use-permissoes";
import type { PerfilAdmin, ConfiguracoesValores } from "./actions";

function AdicionarImagemButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadFotoPerfil(formData);
      if (result.ok) {
        router.refresh();
        toast.success("Foto atualizada.");
      } else {
        toast.error(result.error ?? "Erro ao enviar imagem.");
      }
      e.target.value = "";
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={isPending}
      />
      <Button
        type="button"
        className="w-fit bg-primary hover:bg-primary-hover"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        <Upload className="mr-2 h-4 w-4" />
        Adicionar imagem
      </Button>
    </>
  );
}

function RemoverFotoButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function handleRemove() {
    startTransition(async () => {
      const result = await updateFotoPerfil(null);
      if (result.ok) {
        router.refresh();
      }
    });
  }
  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
    >
      Remover foto
    </button>
  );
}

function formatTelefone(t: string | null): string {
  if (!t || !t.trim()) return "(99) 99999-9999";
  const d = t.replace(/\D/g, "");
  if (d.length >= 10) {
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return t;
}

type Props = {
  perfil: PerfilAdmin | null;
  config: ConfiguracoesValores;
};

export function ConfiguracoesClient({ perfil, config }: Props) {
  const { pode } = usePermissoes();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[#0E1015]">Configurações</h2>
        {pode("gerenciar_equipe_adm") && (
          <Link href="/configuracoes/equipe">
            <Button className="bg-primary hover:bg-primary-hover">
              Gerenciar equipe →
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
              {perfil?.profile_image ? (
                <img
                  src={perfil.profile_image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-text-secondary" />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <AdicionarImagemButton />
              <RemoverFotoButton />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-2 text-sm font-medium text-[#0E1015]">E-mail</p>
          <Input
            readOnly
            value={perfil?.email ?? ""}
            className="bg-muted/50 text-[#0E1015]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative flex items-center">
            <Input
              readOnly
              type="password"
              value="********"
              className="bg-muted/50 pr-10 text-[#0E1015]"
            />
            <Link
              href="/configuracoes/alterar-senha"
              className="absolute right-3 text-text-secondary hover:text-text-primary"
              title="Alterar senha"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
          <Link
            href="/login/recuperar-senha"
            className="text-sm font-medium text-primary hover:underline"
          >
            Recuperar senha
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold text-[#0E1015]">WhatsApp do suporte</h3>
          <p className="mt-1 text-sm text-[#0E1015]">Número do WhatsApp</p>
          <div className="relative mt-2 flex items-center">
            <Input
              readOnly
              value={config.whatsapp_suporte ? formatTelefone(config.whatsapp_suporte) : ""}
              placeholder="(99) 99999-9999"
              className="rounded-md border border-border bg-muted/50 pr-10 text-[#0E1015]"
            />
            <Link
              href="/configuracoes/whatsapp"
              className="absolute right-3 text-text-secondary hover:text-text-primary"
              title="Editar WhatsApp"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reembolso em cancelamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative flex items-center">
            <Input
              readOnly
              value={config.percentual_reembolso_24h != null ? `${config.percentual_reembolso_24h}%` : "50%"}
              className="bg-muted/50 pr-10 text-[#0E1015]"
            />
            <Link
              href="/configuracoes/reembolso"
              className="absolute right-3 text-text-secondary hover:text-text-primary"
              title="Editar percentual"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
          <p className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-text-secondary/20 text-xs font-bold text-text-secondary">
              i
            </span>
            Exemplo: Se 50%, o paciente recebe metade do valor da consulta caso cancele com menos de 24h de antecedência.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
