import { CalendarCheck, Mail } from "lucide-react";

import { requestLoginLink } from "@/app/(auth)/login/actions";
import { getSafeNextPath } from "@/lib/auth/redirects";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    sent?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  auth_request_failed: "No se ha podido enviar el enlace. Revisa la configuracion de Supabase.",
  invalid_email: "Introduce un email valido.",
  supabase_not_configured: "Configura Supabase en .env.local antes de iniciar sesion.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const next = getSafeNextPath(params.next);
  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="flex items-center justify-center bg-[#eef3ed] px-6 py-10">
        <div className="w-full max-w-md rounded-lg border border-[#d9ded6] bg-white p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#dff5ef] text-[#0f766e]">
            <CalendarCheck aria-hidden="true" className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-[#202722]">Acceso al CRM</h1>
          <p className="mt-2 text-sm leading-6 text-[#667069]">
            Enviaremos un enlace seguro a tu email para abrir el panel interno.
          </p>

          <form action={requestLoginLink} className="mt-8 space-y-5">
            <input name="next" type="hidden" value={next} />
            <label className="block">
              <span className="text-sm font-medium text-[#202722]">Email</span>
              <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#cfd7cf] bg-white px-3 focus-within:border-[#0f766e]">
                <Mail aria-hidden="true" className="h-4 w-4 text-[#667069]" />
                <input
                  required
                  autoComplete="email"
                  className="w-full border-0 bg-transparent text-sm text-[#202722] outline-none"
                  name="email"
                  placeholder="usuario@clinica.com"
                  type="email"
                />
              </span>
            </label>

            {errorMessage ? (
              <p className="rounded-md border border-[#f0c7c7] bg-[#fff6f6] px-3 py-2 text-sm text-[#9f2f2f]">
                {errorMessage}
              </p>
            ) : null}

            {params.sent === "1" ? (
              <p className="rounded-md border border-[#b9e4d8] bg-[#effbf7] px-3 py-2 text-sm text-[#11695f]">
                Enlace enviado. Revisa tu bandeja de entrada.
              </p>
            ) : null}

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0f766e] px-4 text-sm font-medium text-white hover:bg-[#115e59] focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:ring-offset-2"
              type="submit"
            >
              Enviar enlace
            </button>
          </form>
        </div>
      </section>
      <section className="hidden items-center bg-[#202722] px-12 text-white lg:flex">
        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8fded4]">Agenda clinica</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">
            Panel preparado para citas, pacientes y profesionales.
          </h2>
          <div className="mt-8 grid gap-3 text-sm text-[#dbe5df]">
            <div className="rounded-md border border-white/10 bg-white/5 p-4">Rutas privadas protegidas por sesion.</div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">Base lista para roles por clinica.</div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">Reserva publica aislada del panel interno.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
