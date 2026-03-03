export default function AcessoNegadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-xl font-bold text-text-primary">Acesso negado</h1>
        <p className="mt-2 text-text-secondary">
          Você não tem permissão para acessar o painel administrativo.
        </p>
      </div>
    </div>
  );
}
