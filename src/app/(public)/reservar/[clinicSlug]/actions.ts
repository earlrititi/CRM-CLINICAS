"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { publicBookingSchema } from "@/lib/validation/public-booking";

function buildBookingPath(
  clinicSlug: string,
  params: {
    confirmed?: string;
    date?: string;
    error?: string;
    professional?: string | null;
    service?: string;
  },
) {
  const searchParams = new URLSearchParams();

  if (params.confirmed) {
    searchParams.set("confirmed", params.confirmed);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.service) {
    searchParams.set("service", params.service);
  }

  if (params.professional) {
    searchParams.set("professional", params.professional);
  }

  if (params.date) {
    searchParams.set("date", params.date);
  }

  const query = searchParams.toString();
  return (query ? `/reservar/${clinicSlug}?${query}` : `/reservar/${clinicSlug}`) as Route;
}

export async function createPublicBooking(formData: FormData) {
  const slotKey = typeof formData.get("slotKey") === "string" ? String(formData.get("slotKey")) : "";
  const [startsAt, slotProfessionalId] = slotKey.split("|");
  const professionalId = formData.get("professionalId") || slotProfessionalId || null;

  const parsed = publicBookingSchema.safeParse({
    bookingDate: formData.get("bookingDate"),
    clinicSlug: formData.get("clinicSlug"),
    communicationsConsent: formData.get("communicationsConsent"),
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    professionalId,
    serviceId: formData.get("serviceId"),
    startsAt,
    website: formData.get("website"),
  });

  const rawFallbackSlug =
    typeof formData.get("clinicSlug") === "string" ? String(formData.get("clinicSlug")) : "clinica";
  const fallbackSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawFallbackSlug) ? rawFallbackSlug : "clinica";

  if (!parsed.success) {
    redirect(buildBookingPath(fallbackSlug, { error: "invalid_request" }));
  }

  const input = parsed.data;
  const retryParams = {
    date: input.bookingDate,
    professional: input.professionalId,
    service: input.serviceId,
  };

  if (!isSupabaseConfigured) {
    redirect(buildBookingPath(input.clinicSlug, { ...retryParams, error: "supabase_not_configured" }));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_public_booking", {
    booking_clinic_slug: input.clinicSlug,
    booking_date: input.bookingDate,
    booking_professional_id: input.professionalId,
    booking_service_id: input.serviceId,
    booking_starts_at: input.startsAt,
    communications_consent: input.communicationsConsent,
    patient_email: input.email ?? null,
    patient_first_name: input.firstName,
    patient_last_name: input.lastName,
    patient_phone: input.phone ?? null,
    website: input.website ?? null,
  });

  if (error) {
    redirect(buildBookingPath(input.clinicSlug, { ...retryParams, error: "booking_failed" }));
  }

  redirect(buildBookingPath(input.clinicSlug, { confirmed: "1" }));
}
