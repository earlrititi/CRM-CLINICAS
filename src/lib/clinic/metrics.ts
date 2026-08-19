import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type CoreModelCounts = {
  patients: number;
  professionals: number;
  services: number;
};

export const emptyCoreModelCounts: CoreModelCounts = {
  patients: 0,
  professionals: 0,
  services: 0,
};

export async function getCoreModelCounts(clinicIds: readonly string[]): Promise<CoreModelCounts> {
  const scopedClinicIds = [...new Set(clinicIds)];

  if (!isSupabaseConfigured || scopedClinicIds.length === 0) {
    return emptyCoreModelCounts;
  }

  const supabase = await createClient();
  const [patients, professionals, services] = await Promise.all([
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

  const error = [patients.error, professionals.error, services.error].find(Boolean);

  if (error) {
    throw new Error("Unable to load dashboard metrics.");
  }

  return {
    patients: patients.count ?? 0,
    professionals: professionals.count ?? 0,
    services: services.count ?? 0,
  };
}
