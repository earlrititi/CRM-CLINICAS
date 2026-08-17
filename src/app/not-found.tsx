import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg border border-[#d9ded6] bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#0f766e]">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-[#202722]">Pagina no encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-[#667069]">
          La ruta solicitada no existe o todavia no esta disponible.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-[#0f766e] px-4 text-sm font-medium text-white hover:bg-[#115e59]"
        >
          Volver al panel
        </Link>
      </div>
    </main>
  );
}
