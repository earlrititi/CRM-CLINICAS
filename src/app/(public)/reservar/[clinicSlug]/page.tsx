import { notFound } from "next/navigation";
import { CalendarDays, Check, CircleAlert, Clock3, Mail, MapPin, Phone, Stethoscope, UserRound } from "lucide-react";

import { createPublicBooking } from "@/app/(public)/reservar/[clinicSlug]/actions";
import { formatAppointmentTime } from "@/lib/calendar/dates";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicBookingData, type PublicService, type PublicSlot } from "@/lib/public-booking/data";

type BookingPageProps = {
  params: Promise<{
    clinicSlug: string;
  }>;
  searchParams: Promise<{
    confirmed?: string;
    date?: string;
    error?: string;
    professional?: string;
    service?: string;
  }>;
};

const errorMessages = {
  booking_failed: "No se pudo confirmar esa reserva. El hueco puede haberse ocupado.",
  invalid_request: "Revisa los datos y vuelve a intentarlo.",
  supabase_not_configured: "Supabase no esta configurado.",
} as const;

function getDateValue(value: string | undefined) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

function getDateOptions(selectedDate: string) {
  const startDate = new Date(`${selectedDate}T00:00:00.000Z`);

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);

    return {
      label: new Intl.DateTimeFormat("es", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
        weekday: "short",
      }).format(date),
      value: date.toISOString().slice(0, 10),
    };
  });
}

function formatPrice(service: PublicService) {
  return new Intl.NumberFormat("es-ES", {
    currency: service.currency,
    style: "currency",
  }).format(service.priceCents / 100);
}

function slotValue(slot: PublicSlot) {
  return `${slot.startsAt}|${slot.professionalId}`;
}

export default async function PublicBookingPage({ params, searchParams }: BookingPageProps) {
  const { clinicSlug } = await params;
  const query = await searchParams;
  const selectedDate = getDateValue(query.date);
  const data = await getPublicBookingData({
    clinicSlug,
    date: selectedDate,
    professionalId: query.professional,
    serviceId: query.service,
  });

  if (isSupabaseConfigured && !data.clinic) {
    notFound();
  }

  const clinic = data.clinic;
  const selectedService = data.services.find((service) => service.id === query.service) ?? null;
  const selectedProfessional = data.professionals.find((professional) => professional.id === query.professional) ?? null;
  const errorMessage = query.error ? errorMessages[query.error as keyof typeof errorMessages] : null;
  const canBook = Boolean(selectedService && data.slots.length > 0 && isSupabaseConfigured);

  return (
    <main className="min-h-screen bg-[#f7f8f4]">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section className="rounded-lg border border-[#d9ded6] bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#0f766e]">Reserva online</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#202722]">{clinic?.name ?? "Clinica"}</h1>
          {clinic?.address ? (
            <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#667069]">
              <MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#0f766e]" />
              {clinic.address}
            </p>
          ) : null}
          <div className="mt-5 grid gap-3 text-sm">
            {clinic?.phone ? (
              <a className="flex items-center gap-2 text-[#202722]" href={`tel:${clinic.phone}`}>
                <Phone aria-hidden="true" className="h-4 w-4 text-[#0f766e]" />
                {clinic.phone}
              </a>
            ) : null}
            {clinic?.email ? (
              <a className="flex items-center gap-2 text-[#202722]" href={`mailto:${clinic.email}`}>
                <Mail aria-hidden="true" className="h-4 w-4 text-[#0f766e]" />
                {clinic.email}
              </a>
            ) : null}
          </div>

          <div className="mt-6 rounded-md border border-[#e4e8e2] bg-[#fbfcfa] p-4">
            <h2 className="text-sm font-semibold text-[#202722]">Politica de reserva</h2>
            <p className="mt-2 text-sm leading-6 text-[#667069]">
              La cita queda pendiente hasta que la clinica la confirme. Para cambios o cancelaciones, contacta con el
              centro.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[#d9ded6] bg-white p-6 shadow-sm">
          {query.confirmed === "1" ? (
            <div className="rounded-md border border-[#cfe6d5] bg-[#f1fbf3] p-4 text-sm text-[#24723a]">
              <div className="flex gap-3">
                <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Reserva recibida.</p>
                  <p className="mt-1 leading-6">La clinica revisara la solicitud y confirmara la cita.</p>
                </div>
              </div>
            </div>
          ) : null}

          {!isSupabaseConfigured ? (
            <div className="mb-5 rounded-md border border-[#f0d7a7] bg-[#fffaf0] p-4 text-sm text-[#7c4a03]">
              <div className="flex gap-3">
                <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Supabase no esta configurado.</p>
                  <p className="mt-1 leading-6">La reserva publica se activara al conectar Supabase y aplicar migraciones.</p>
                </div>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-5 rounded-md border border-[#ead1d1] bg-[#fff1f1] p-4 text-sm text-[#9f2828]">
              {errorMessage}
            </div>
          ) : null}

          <form className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-[#202722]" htmlFor="service">
                Servicio
              </label>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cfd7cf] bg-white px-3 text-sm text-[#202722]"
                defaultValue={selectedService?.id ?? ""}
                disabled={!isSupabaseConfigured || data.services.length === 0}
                id="service"
                name="service"
              >
                <option value="">Selecciona un servicio</option>
                {data.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.durationMinutes} min · {formatPrice(service)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#202722]" htmlFor="professional">
                Profesional
              </label>
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cfd7cf] bg-white px-3 text-sm text-[#202722]"
                defaultValue={selectedProfessional?.id ?? ""}
                disabled={!selectedService || data.professionals.length === 0}
                id="professional"
                name="professional"
              >
                <option value="">Cualquier profesional disponible</option>
                {data.professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="text-sm font-medium text-[#202722]">Fecha</span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-[#cfd7cf] bg-white px-3 text-sm text-[#202722]"
                  defaultValue={selectedDate}
                  disabled={!isSupabaseConfigured}
                  name="date"
                >
                  {getDateOptions(selectedDate).map((date) => (
                    <option key={date.value} value={date.value}>
                      {date.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#cfd7cf] bg-white px-4 text-sm font-medium text-[#202722] hover:border-[#0f766e] hover:text-[#0f766e] disabled:opacity-60"
                disabled={!isSupabaseConfigured}
                type="submit"
              >
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Ver huecos
              </button>
            </div>
          </form>

          <form action={createPublicBooking} className="mt-6 grid gap-5">
            <input name="bookingDate" type="hidden" value={selectedDate} />
            <input name="clinicSlug" type="hidden" value={clinicSlug} />
            <input name="professionalId" type="hidden" value={selectedProfessional?.id ?? ""} />
            <input name="serviceId" type="hidden" value={selectedService?.id ?? ""} />
            <input aria-hidden="true" className="hidden" name="website" tabIndex={-1} />

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#202722]">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-[#0f766e]" />
                Hora disponible
              </div>
              {selectedService && data.slots.length > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {data.slots.map((slot, index) => (
                    <label
                      className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-[#d9ded6] bg-white px-3 py-2 text-sm text-[#202722] has-[:checked]:border-[#0f766e] has-[:checked]:bg-[#edf9f7]"
                      key={`${slot.startsAt}-${slot.professionalId}`}
                    >
                      <input
                        className="h-4 w-4 accent-[#0f766e]"
                        defaultChecked={index === 0}
                        name="slotKey"
                        required
                        type="radio"
                        value={slotValue(slot)}
                      />
                      <span>
                        <span className="block font-medium">
                          {formatAppointmentTime(slot.startsAt, clinic?.timezone ?? "Europe/Madrid")}
                        </span>
                        <span className="block text-xs text-[#667069]">{slot.professionalName}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed border-[#cfd7cf] bg-[#fbfcfa] p-4 text-sm text-[#667069]">
                  {selectedService ? "No hay huecos disponibles para esa seleccion." : "Selecciona un servicio."}
                </div>
              )}
            </div>

            <div className="rounded-md border border-[#e4e8e2] bg-[#fbfcfa] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#202722]">
                <UserRound aria-hidden="true" className="h-4 w-4 text-[#0f766e]" />
                Datos del paciente
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm"
                  disabled={!canBook}
                  maxLength={80}
                  name="firstName"
                  placeholder="Nombre"
                  required
                />
                <input
                  className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm"
                  disabled={!canBook}
                  maxLength={120}
                  name="lastName"
                  placeholder="Apellidos"
                  required
                />
                <input
                  className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm"
                  disabled={!canBook}
                  maxLength={40}
                  name="phone"
                  placeholder="Telefono"
                />
                <input
                  className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm"
                  disabled={!canBook}
                  maxLength={160}
                  name="email"
                  placeholder="Email"
                  type="email"
                />
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#667069]">
                <input
                  className="mt-1 h-4 w-4 accent-[#0f766e]"
                  disabled={!canBook}
                  name="communicationsConsent"
                  type="checkbox"
                />
                Acepto recibir comunicaciones relacionadas con esta reserva.
              </label>
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-medium text-white hover:bg-[#115e59] disabled:opacity-60"
              disabled={!canBook}
              type="submit"
            >
              <Check aria-hidden="true" className="h-4 w-4" />
              Confirmar reserva
            </button>
          </form>

          {selectedService ? (
            <div className="mt-5 rounded-md border border-[#e4e8e2] bg-white p-4">
              <div className="flex items-start gap-3">
                <Stethoscope aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#0f766e]" />
                <div>
                  <p className="text-sm font-semibold text-[#202722]">{selectedService.name}</p>
                  <p className="mt-1 text-sm text-[#667069]">
                    {selectedService.durationMinutes} min · {formatPrice(selectedService)}
                  </p>
                  {selectedService.description ? (
                    <p className="mt-2 text-sm leading-6 text-[#667069]">{selectedService.description}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
