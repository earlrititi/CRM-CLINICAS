import Link from "next/link";
import type { Route } from "next";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Filter,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import { appointmentStatuses, type AppointmentStatus } from "@/lib/auth/permissions";
import { getCurrentUserClinicMemberships } from "@/lib/auth/guards";
import { getCurrentAccount } from "@/lib/auth/session";
import { getCalendarData, parseAppointmentStatus, type CalendarAppointment } from "@/lib/calendar/data";
import {
  calendarViews,
  formatAppointmentTime,
  formatDateValue,
  formatDateValueInTimeZone,
  getAdjacentCalendarDate,
  getCalendarRange,
  type CalendarView,
} from "@/lib/calendar/dates";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams: Promise<{
    clinic?: string;
    date?: string;
    professional?: string;
    service?: string;
    status?: string;
    view?: string;
  }>;
};

const viewLabels = {
  day: "Dia",
  month: "Mes",
  week: "Semana",
} as const;

const statusLabels = {
  cancelled: "Cancelada",
  completed: "Completada",
  confirmed: "Confirmada",
  no_show: "No asistio",
  pending: "Pendiente",
  rescheduled: "Reprogramada",
  waiting: "En espera",
} as const satisfies Record<AppointmentStatus, string>;

const statusStyles = {
  cancelled: "border-[#ead1d1] bg-[#fff1f1] text-[#9f2828]",
  completed: "border-[#cfe6d5] bg-[#f1fbf3] text-[#24723a]",
  confirmed: "border-[#c7e9e4] bg-[#edf9f7] text-[#0f766e]",
  no_show: "border-[#e7d5bd] bg-[#fff7ec] text-[#8a4b0d]",
  pending: "border-[#f0d7a7] bg-[#fffaf0] text-[#7c4a03]",
  rescheduled: "border-[#d7d8ec] bg-[#f4f5ff] text-[#474b92]",
  waiting: "border-[#d5e1ed] bg-[#f1f7fc] text-[#286b9f]",
} as const satisfies Record<AppointmentStatus, string>;

function parseCalendarView(value: string | undefined): CalendarView {
  return calendarViews.includes(value as CalendarView) ? (value as CalendarView) : "week";
}

function buildCalendarHref(params: {
  clinicId?: string;
  date: string;
  professionalId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  view: CalendarView;
}) {
  const searchParams = new URLSearchParams({
    date: params.date,
    view: params.view,
  });

  if (params.clinicId) {
    searchParams.set("clinic", params.clinicId);
  }

  if (params.professionalId) {
    searchParams.set("professional", params.professionalId);
  }

  if (params.serviceId) {
    searchParams.set("service", params.serviceId);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  return `/dashboard/calendar?${searchParams.toString()}` as Route;
}

function getAppointmentsForDay(appointments: CalendarAppointment[], day: Date, timeZone: string) {
  const dateValue = formatDateValue(day);
  return appointments.filter((appointment) => formatDateValueInTimeZone(appointment.startsAt, timeZone) === dateValue);
}

function AppointmentItem({
  appointment,
  compact = false,
  timeZone,
}: {
  appointment: CalendarAppointment;
  compact?: boolean;
  timeZone: string;
}) {
  return (
    <article className="rounded-md border border-[#d9ded6] bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1 h-9 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: appointment.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#202722]">
              {appointment.title ?? appointment.serviceName}
            </p>
            <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusStyles[appointment.status]}`}>
              {statusLabels[appointment.status]}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-[#667069]">
            {formatAppointmentTime(appointment.startsAt, timeZone)} - {formatAppointmentTime(appointment.endsAt, timeZone)}
          </p>
          <p className="mt-2 truncate text-sm text-[#202722]">{appointment.patientName}</p>
          {!compact ? (
            <p className="mt-1 truncate text-xs text-[#667069]">
              {appointment.professionalName} · {appointment.serviceName}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EmptyAppointments({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid place-items-center rounded-md border border-dashed border-[#cfd7cf] bg-[#fbfcf8] text-center ${compact ? "min-h-24 p-3" : "min-h-56 p-6"}`}>
      <div>
        <CalendarDays aria-hidden="true" className="mx-auto h-7 w-7 text-[#0f766e]" />
        <p className="mt-3 text-sm font-medium text-[#202722]">Sin citas</p>
      </div>
    </div>
  );
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const account = await getCurrentAccount();
  const memberships = await getCurrentUserClinicMemberships();
  const view = parseCalendarView(params.view);
  const status = parseAppointmentStatus(params.status);
  const range = getCalendarRange(view, params.date);
  const selectedClinicId = memberships.some((membership) => membership.clinicId === params.clinic)
    ? params.clinic
    : undefined;
  const selectedTimeZone =
    memberships.find((membership) => membership.clinicId === selectedClinicId)?.clinic?.timezone ??
    memberships.find((membership) => membership.clinic)?.clinic?.timezone ??
    "Europe/Madrid";
  const selectedProfessionalId = params.professional;
  const selectedServiceId = params.service;
  const calendarData = await getCalendarData({
    clinicIds: memberships.map((membership) => membership.clinicId),
    endsAt: range.endsAt,
    filters: {
      clinicId: selectedClinicId,
      professionalId: selectedProfessionalId,
      serviceId: selectedServiceId,
      status,
    },
    startsAt: range.startsAt,
  });

  const clinicOptions = memberships
    .filter((membership) => membership.clinic)
    .map((membership) => ({
      id: membership.clinicId,
      label: membership.clinic?.name ?? membership.clinicId,
    }));
  const previousDate = getAdjacentCalendarDate(range, -1);
  const nextDate = getAdjacentCalendarDate(range, 1);

  return (
    <main className="min-h-screen bg-[#f7f8f4]">
      <header className="border-b border-[#d9ded6] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <Link className="text-xs font-medium uppercase tracking-[0.14em] text-[#0f766e]" href="/dashboard">
              CRM Reservas
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-[#202722]">Calendario</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[260px] truncate text-sm text-[#667069] sm:block">{account.email}</span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0f766e] px-3 text-sm font-medium text-white hover:bg-[#115e59]"
              disabled
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nueva cita
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6">
        {account.isDevelopmentBypass ? (
          <section className="mb-6 rounded-lg border border-[#f0d7a7] bg-[#fffaf0] p-4 text-sm text-[#7c4a03]">
            <div className="flex gap-3">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Supabase no esta configurado.</p>
                <p className="mt-1 leading-6">
                  La vista funciona en modo estructura; los datos reales apareceran al conectar Supabase y aplicar las
                  migraciones.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-[#d9ded6] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#cfd7cf] bg-white text-[#202722] hover:border-[#0f766e] hover:text-[#0f766e]"
                href={buildCalendarHref({
                  clinicId: selectedClinicId,
                  date: previousDate,
                  professionalId: selectedProfessionalId,
                  serviceId: selectedServiceId,
                  status,
                  view,
                })}
                title="Periodo anterior"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </Link>
              <div className="min-w-40 px-2">
                <p className="text-sm font-semibold capitalize text-[#202722]">{range.label}</p>
                <p className="text-xs text-[#667069]">{viewLabels[view]}</p>
              </div>
              <Link
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#cfd7cf] bg-white text-[#202722] hover:border-[#0f766e] hover:text-[#0f766e]"
                href={buildCalendarHref({
                  clinicId: selectedClinicId,
                  date: nextDate,
                  professionalId: selectedProfessionalId,
                  serviceId: selectedServiceId,
                  status,
                  view,
                })}
                title="Periodo siguiente"
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>

            <nav className="flex rounded-md border border-[#cfd7cf] bg-[#f7f8f4] p-1">
              {calendarViews.map((calendarView) => (
                <Link
                  className={`rounded px-3 py-1.5 text-sm font-medium ${
                    calendarView === view ? "bg-white text-[#0f766e] shadow-sm" : "text-[#667069] hover:text-[#202722]"
                  }`}
                  href={buildCalendarHref({
                    clinicId: selectedClinicId,
                    date: range.value,
                    professionalId: selectedProfessionalId,
                    serviceId: selectedServiceId,
                    status,
                    view: calendarView,
                  })}
                  key={calendarView}
                >
                  {viewLabels[calendarView]}
                </Link>
              ))}
            </nav>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-5">
            <input name="view" type="hidden" value={view} />
            <input name="date" type="hidden" value={range.value} />
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#667069]">Clinica</span>
              <select
                className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-[#202722]"
                defaultValue={selectedClinicId ?? ""}
                name="clinic"
              >
                <option value="">Todas</option>
                {clinicOptions.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#667069]">Profesional</span>
              <select
                className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-[#202722]"
                defaultValue={selectedProfessionalId ?? ""}
                name="professional"
              >
                <option value="">Todos</option>
                {calendarData.professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#667069]">Servicio</span>
              <select
                className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-[#202722]"
                defaultValue={selectedServiceId ?? ""}
                name="service"
              >
                <option value="">Todos</option>
                {calendarData.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#667069]">Estado</span>
              <select
                className="h-10 rounded-md border border-[#cfd7cf] bg-white px-3 text-[#202722]"
                defaultValue={status ?? ""}
                name="status"
              >
                <option value="">Todos</option>
                {appointmentStatuses.map((appointmentStatus) => (
                  <option key={appointmentStatus} value={appointmentStatus}>
                    {statusLabels[appointmentStatus]}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#0f766e] px-3 text-sm font-medium text-white hover:bg-[#115e59]"
                type="submit"
              >
                <Filter aria-hidden="true" className="h-4 w-4" />
                Filtrar
              </button>
              <Link
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#cfd7cf] bg-white text-[#202722] hover:border-[#0f766e] hover:text-[#0f766e]"
                href={"/dashboard/calendar" as Route}
                title="Limpiar filtros"
              >
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </form>
        </section>

        <section className="mt-6">
          {view === "day" ? (
            <div className="rounded-lg border border-[#d9ded6] bg-white p-4 shadow-sm">
              <div className="grid gap-3">
                {calendarData.appointments.length > 0 ? (
                  calendarData.appointments.map((appointment) => (
                    <AppointmentItem appointment={appointment} key={appointment.id} timeZone={selectedTimeZone} />
                  ))
                ) : (
                  <EmptyAppointments />
                )}
              </div>
            </div>
          ) : (
            <div className={`grid gap-3 ${view === "week" ? "lg:grid-cols-7" : "sm:grid-cols-2 lg:grid-cols-7"}`}>
              {range.days.map((day) => {
                const dayAppointments = getAppointmentsForDay(calendarData.appointments, day, selectedTimeZone);

                return (
                  <section className="rounded-lg border border-[#d9ded6] bg-white p-3 shadow-sm" key={day.toISOString()}>
                    <div className="mb-3 border-b border-[#e4e8e2] pb-2">
                      <p className="text-sm font-semibold capitalize text-[#202722]">
                        {new Intl.DateTimeFormat("es", {
                          day: "2-digit",
                          month: "short",
                          timeZone: "UTC",
                          weekday: view === "week" ? "short" : undefined,
                        }).format(day)}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {dayAppointments.length > 0 ? (
                        dayAppointments.map((appointment) => (
                          <AppointmentItem
                            appointment={appointment}
                            compact
                            key={appointment.id}
                            timeZone={selectedTimeZone}
                          />
                        ))
                      ) : (
                        <EmptyAppointments compact />
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
