import { notFound, redirect } from "next/navigation";
import type { Route } from "next";

import { getSafeNextPath } from "@/lib/auth/redirects";
import {
  canBypassAuthForLocalDevelopment,
  isSupabaseConfigured,
} from "@/lib/env";
import {
  clinicRoles,
  hasAnyClinicRole,
  hasClinicPermission,
  type ClinicMemberStatus,
  type ClinicPermission,
  type ClinicRole,
  type ClinicStatus,
} from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  email: string | null;
  id: string;
  isDevelopmentBypass: boolean;
};

export type ClinicMembership = {
  clinicId: string;
  id: string;
  role: ClinicRole;
  status: ClinicMemberStatus;
  userId: string;
};

export type ClinicMembershipWithClinic = ClinicMembership & {
  clinic: {
    id: string;
    name: string;
    slug: string;
    status: ClinicStatus;
  } | null;
};

const developmentUser: CurrentUser = {
  email: "Sesion pendiente",
  id: "development-user",
  isDevelopmentBypass: true,
};

function buildLoginPath(params: { error?: string; next?: string } = {}) {
  const searchParams = new URLSearchParams();
  const next = getSafeNextPath(params.next);

  if (params.error) {
    searchParams.set("error", params.error);
  }

  searchParams.set("next", next);

  return `/login?${searchParams.toString()}` as Route;
}

function getDevelopmentMembership(clinicId: string): ClinicMembership {
  return {
    clinicId,
    id: "development-membership",
    role: "clinic_admin",
    status: "active",
    userId: developmentUser.id,
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) {
    return canBypassAuthForLocalDevelopment ? developmentUser : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || typeof claims.sub !== "string") {
    return null;
  }

  return {
    email: typeof claims.email === "string" ? claims.email : null,
    id: claims.sub,
    isDevelopmentBypass: false,
  };
}

export async function requireCurrentUser(next = "/dashboard") {
  if (!isSupabaseConfigured && !canBypassAuthForLocalDevelopment) {
    redirect(buildLoginPath({ error: "supabase_not_configured", next }));
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(buildLoginPath({ next }));
  }

  return user;
}

export async function getClinicMembership(clinicId: string): Promise<ClinicMembership | null> {
  if (!isSupabaseConfigured) {
    return canBypassAuthForLocalDevelopment ? getDevelopmentMembership(clinicId) : null;
  }

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_members")
    .select("id, clinic_id, user_id, role, status")
    .eq("clinic_id", clinicId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load clinic membership.");
  }

  if (!data) {
    return null;
  }

  return {
    clinicId: data.clinic_id,
    id: data.id,
    role: data.role,
    status: data.status,
    userId: data.user_id ?? user.id,
  };
}

export async function getCurrentUserClinicMemberships(): Promise<ClinicMembershipWithClinic[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const { data: memberships, error: membershipsError } = await supabase
    .from("clinic_members")
    .select("id, clinic_id, user_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (membershipsError) {
    throw new Error("Unable to load clinic memberships.");
  }

  if (memberships.length === 0) {
    return [];
  }

  const clinicIds = memberships.map((membership) => membership.clinic_id);
  const { data: clinics, error: clinicsError } = await supabase
    .from("clinics")
    .select("id, name, slug, status")
    .in("id", clinicIds)
    .order("name", { ascending: true });

  if (clinicsError) {
    throw new Error("Unable to load clinics.");
  }

  const clinicsById = new Map(clinics.map((clinic) => [clinic.id, clinic]));

  return memberships.map((membership) => ({
    clinic: clinicsById.get(membership.clinic_id) ?? null,
    clinicId: membership.clinic_id,
    id: membership.id,
    role: membership.role,
    status: membership.status,
    userId: membership.user_id ?? user.id,
  }));
}

export async function requireClinicRole(clinicId: string, allowedRoles: readonly ClinicRole[]) {
  await requireCurrentUser();

  const membership = await getClinicMembership(clinicId);

  if (!membership || !hasAnyClinicRole(membership.role, allowedRoles)) {
    notFound();
  }

  return membership;
}

export async function requireClinicPermission(clinicId: string, permission: ClinicPermission) {
  const membership = await requireClinicRole(clinicId, clinicRoles);

  if (!hasClinicPermission(membership.role, permission)) {
    notFound();
  }

  return membership;
}
