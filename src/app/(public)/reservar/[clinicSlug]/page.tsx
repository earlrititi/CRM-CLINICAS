import { CalendarDays, Check, Clock3, ShieldCheck, UserRound } from "lucide-react";

type BookingPageProps = {
  params: Promise<{
    clinicSlug: string;
  }>;
};

function titleFromSlug(slug: string) {
  return decodeURIComponent(slug)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function PublicBookingPage({ params }: BookingPageProps) {
  const { clinicSlug } = await params;
  const clinicName = titleFromSlug(clinicSlug);

  return (
    <main className="min-h-screen bg-[#f7f8f4]">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="rounded-lg border border-[#d9ded6] bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#0f766e]">Reserva online</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#202722]">{clinicName}</h1>
          <p className="mt-3 text-sm leading-6 text-[#667069]">
            Selecciona servicio, profesional y horario disponible. La confirmacion quedara vinculada al panel interno
            de la clinica.
          </p>

          <div className="mt-6 grid gap-3 text-sm">
            {[
              { icon: ShieldCheck, label: "Formulario publico sin datos internos expuestos" },
              { icon: Clock3, label: "Preparado para disponibilidad por profesional" },
              { icon: CalendarDays, label: "Fechas guardadas en UTC y mostradas por zona horaria" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div className="flex items-center gap-3 rounded-md border border-[#e4e8e2] p-3" key={item.label}>
                  <Icon aria-hidden="true" className="h-4 w-4 text-[#0f766e]" />
                  <span className="text-[#202722]">{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-[#d9ded6] bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-[#202722]" htmlFor="service">
                Servicio
              </label>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cfd7cf] bg-white px-3 text-sm text-[#667069]"
                disabled
                id="service"
              >
                <option>Selecciona un servicio</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#202722]" htmlFor="professional">
                Profesional
              </label>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cfd7cf] bg-white px-3 text-sm text-[#667069]"
                disabled
                id="professional"
              >
                <option>Cualquier profesional disponible</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[#202722]">Fecha</span>
                <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm text-[#667069]">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  Pendiente
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#202722]">Hora</span>
                <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm text-[#667069]">
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                  Pendiente
                </span>
              </label>
            </div>

            <div className="rounded-md border border-[#e4e8e2] bg-[#fbfcfa] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#202722]">
                <UserRound aria-hidden="true" className="h-4 w-4 text-[#0f766e]" />
                Datos del paciente
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm"
                  disabled
                  placeholder="Nombre"
                />
                <input
                  className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm"
                  disabled
                  placeholder="Telefono"
                />
                <input
                  className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm sm:col-span-2"
                  disabled
                  placeholder="Email"
                />
              </div>
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-medium text-white opacity-60"
              disabled
              type="button"
            >
              <Check aria-hidden="true" className="h-4 w-4" />
              Confirmar reserva
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
