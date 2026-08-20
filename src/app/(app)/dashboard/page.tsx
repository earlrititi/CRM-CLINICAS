import {
  Building2,
  CalendarDays,
  ClipboardList,
  CircleAlert,
  Clock3,
  LogOut,
  Plus,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

import { signOut } from "@/app/(app)/dashboard/actions";
import { getCurrentUserClinicMemberships } from "@/lib/auth/guards";
import { getCurrentAccount } from "@/lib/auth/session";
import { getCoreModelCounts, type CoreModelCounts } from "@/lib/clinic/metrics";

export const dynamic = "force-dynamic";

function buildStats(counts: CoreModelCounts) {
  return [
    { label: "Citas hoy", value: counts.appointmentsToday.toString(), detail: "Activas", icon: CalendarDays },
    { label: "Pendientes", value: counts.pendingAppointments.toString(), detail: "Por confirmar", icon: Clock3 },
    { label: "Pacientes", value: counts.patients.toString(), detail: "Activos", icon: Users },
    { label: "Profesionales", value: counts.professionals.toString(), detail: "Activos", icon: Stethoscope },
    {
      label: "Servicios",
      value: counts.services.toString(),
      detail: "Activos",
      icon: ClipboardList,
    },
  ];
}

const quickActions = [
  { label: "Nueva cita", icon: Plus },
  { label: "Nuevo paciente", icon: UserPlus },
  { label: "Nuevo servicio", icon: Stethoscope },
];

const roleLabels = {
  clinic_admin: "Admin",
  professional: "Profesional",
  readonly: "Lectura",
  reception: "Recepcion",
} as const;

const clinicStatusLabels = {
  active: "Activa",
  inactive: "Inactiva",
  suspended: "Suspendida",
  trialing: "Prueba",
} as const;

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  const memberships = await getCurrentUserClinicMemberships();
  const counts = await getCoreModelCounts(memberships.map((membership) => membership.clinicId));
  const stats = buildStats(counts);

  return (
    <main className="min-h-screen bg-[#f7f8f4]">
      <header className="border-b border-[#d9ded6] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#0f766e]">CRM Reservas</p>
            <h1 className="mt-1 text-xl font-semibold text-[#202722]">Panel interno</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[260px] truncate text-sm text-[#667069] sm:block">{account.email}</span>
            <form action={signOut}>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#cfd7cf] bg-white text-[#202722] hover:border-[#0f766e] hover:text-[#0f766e]"
                title="Cerrar sesion"
                type="submit"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
              </button>
            </form>
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
                  Copia `.env.example` a `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL` y
                  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para activar login y proteccion real de rutas. Este acceso sin
                  sesion solo esta permitido en desarrollo.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.label} className="rounded-lg border border-[#d9ded6] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#667069]">{item.label}</p>
                  <Icon aria-hidden="true" className="h-5 w-5 text-[#0f766e]" />
                </div>
                <p className="mt-5 text-3xl font-semibold text-[#202722]">{item.value}</p>
                <p className="mt-1 text-sm text-[#667069]">{item.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-lg border border-[#d9ded6] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-[#e4e8e2] px-5 py-4">
              <h2 className="text-base font-semibold text-[#202722]">Agenda de hoy</h2>
              <Link
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cfd7cf] bg-white px-3 text-sm font-medium text-[#202722] hover:border-[#0f766e] hover:text-[#0f766e]"
                href={"/dashboard/calendar" as Route}
              >
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Calendario
              </Link>
            </div>
            <div className="grid min-h-[340px] place-items-center px-5 py-12 text-center">
              <div className="max-w-sm">
                <CalendarDays aria-hidden="true" className="mx-auto h-10 w-10 text-[#0f766e]" />
                <p className="mt-4 text-sm font-medium text-[#202722]">Sin citas cargadas</p>
                <p className="mt-2 text-sm leading-6 text-[#667069]">
                  No hay citas programadas para hoy.
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-[#d9ded6] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-[#202722]">Clinicas</h2>
                <Building2 aria-hidden="true" className="h-5 w-5 text-[#0f766e]" />
              </div>
              {memberships.length > 0 ? (
                <div className="mt-4 divide-y divide-[#e4e8e2]">
                  {memberships.map((membership) => (
                    <div className="py-3 first:pt-0 last:pb-0" key={membership.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#202722]">
                            {membership.clinic?.name ?? "Clinica sin datos visibles"}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#667069]">
                            {membership.clinic ? `/${membership.clinic.slug}` : membership.clinicId}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-[#e9f5f3] px-2 py-1 text-xs font-medium text-[#0f766e]">
                          {roleLabels[membership.role]}
                        </span>
                      </div>
                      {membership.clinic ? (
                        <p className="mt-2 text-xs text-[#667069]">{clinicStatusLabels[membership.clinic.status]}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#667069]">Sin clinicas vinculadas.</p>
              )}
            </div>

            <div className="rounded-lg border border-[#d9ded6] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[#202722]">Accesos rapidos</h2>
              <div className="mt-4 grid gap-3">
                {quickActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      className="flex h-11 items-center gap-3 rounded-md border border-[#d9ded6] bg-white px-3 text-left text-sm font-medium text-[#202722] hover:border-[#0f766e] hover:text-[#0f766e]"
                      disabled
                      key={item.label}
                      type="button"
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-[#d9ded6] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[#202722]">Base tecnica</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#667069]">Framework</dt>
                  <dd className="font-medium text-[#202722]">Next.js</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#667069]">Auth</dt>
                  <dd className="font-medium text-[#202722]">Supabase SSR</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#667069]">Validacion</dt>
                  <dd className="font-medium text-[#202722]">Zod</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
