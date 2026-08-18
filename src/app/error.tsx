"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg border border-[#d9ded6] bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#9f2f2f]">Error</p>
        <h1 className="mt-3 text-2xl font-semibold text-[#202722]">No se ha podido cargar la aplicacion</h1>
        <p className="mt-3 text-sm leading-6 text-[#667069]">
          Revisa la configuracion local y vuelve a intentarlo.
        </p>
        {error.digest ? <p className="mt-3 text-xs text-[#667069]">Referencia: {error.digest}</p> : null}
        <button
          className="mt-6 inline-flex h-10 items-center rounded-md bg-[#0f766e] px-4 text-sm font-medium text-white hover:bg-[#115e59]"
          onClick={reset}
          type="button"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
