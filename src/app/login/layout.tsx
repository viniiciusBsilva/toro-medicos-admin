import { LoginImageRight } from "./login-image-right";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Metade esquerda: formulário (em mobile ocupa 100%) */}
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-background px-6 py-12 md:w-1/2 md:min-w-0 md:px-12 lg:px-16">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
      {/* Metade direita: imagem cobrindo todo o lado, sem scroll */}
      <div className="relative hidden h-screen overflow-hidden md:block md:w-1/2">
        <LoginImageRight />
      </div>
    </div>
  );
}
