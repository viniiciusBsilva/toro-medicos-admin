export default function AdminLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
