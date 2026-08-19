import { activeAppointmentStatuses } from "@/lib/auth/permissions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type CoreModelCounts = {
  appointmentsToday: number;
  patients: number;
  pendingAppointments: number;
  professionals: number;
  services: number;
};

export const emptyCoreModelCounts: CoreModelCounts = {
  appointmentsToday: 0,
  patients: 0,
  pendingAppointments: 0,
  professionals: 0,
  services: 0,
};

function getUtcDayRange(date = new Date()) {
  const startsAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 1);

  return {
    endsAt: endsAt.toISOString(),
    startsAt: startsAt.toISOString(),
  };
}

export async function getCoreModelCounts(clinicIds: readonly string[]): Promise<CoreModelCounts> {
  const scopedClinicIds = [...new Set(clinicIds)];

  if (!isSupabaseConfigured || scopedClinicIds.length === 0) {
    return emptyCoreModelCounts;
  }

  const supabase = await createClient();
  const { endsAt, startsAt } = getUtcDayRange();
  const [appointmentsToday, pendingAppointments, patients, professionals, services] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("clinic_id", scopedClinicIds)
      .in("status", [...activeAppointmentStatuses])
      .gte("starts_at", startsAt)
      .lt("starts_at", endsAt),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("clinic_id", scopedClinicIds)
      .eq("status", "pending"),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .in("clinic_id", scopedClinicIds)
      .eq("status", "active"),
    supabase
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .in("clinic_id", scopedClinicIds)
      .eq("status", "active"),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .in("clinic_id", scopedClinicIds)
      .eq("status", "active"),
  ]);

  const error = [appointmentsToday.error, pendingAppointments.error, patients.error, professionals.error, services.error].find(
    Boolean,
  );

  if (error) {
    throw new Error("Unable to load dashboard metrics.");
  }

  return {
    appointmentsToday: appointmentsToday.count ?? 0,
    patients: patients.count ?? 0,
    pendingAppointments: pendingAppointments.count ?? 0,
    professionals: professionals.count ?? 0,
    services: services.count ?? 0,
  };
}
