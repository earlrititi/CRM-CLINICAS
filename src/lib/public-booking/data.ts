import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type PublicClinic = {
  address: string | null;
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
  slug: string;
  timezone: string;
};

export type PublicService = {
  category: string | null;
  currency: string;
  description: string | null;
  durationMinutes: number;
  id: string;
  name: string;
  priceCents: number;
};

export type PublicProfessional = {
  color: string;
  id: string;
  name: string;
  specialty: string | null;
};

export type PublicSlot = {
  endsAt: string;
  professionalId: string;
  professionalName: string;
  startsAt: string;
};

export type PublicBookingData = {
  clinic: PublicClinic | null;
  professionals: PublicProfessional[];
  services: PublicService[];
  slots: PublicSlot[];
};

function titleFromSlug(slug: string) {
  return decodeURIComponent(slug)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getFallbackPublicBookingData(clinicSlug: string): PublicBookingData {
  return {
    clinic: {
      address: null,
      email: null,
      id: "development-clinic",
      name: titleFromSlug(clinicSlug),
      phone: null,
      slug: clinicSlug,
      timezone: "Europe/Madrid",
    },
    professionals: [],
    services: [],
    slots: [],
  };
}

export async function getPublicBookingData(params: {
  clinicSlug: string;
  date: string;
  professionalId?: string | null;
  serviceId?: string | null;
}): Promise<PublicBookingData> {
  if (!isSupabaseConfigured) {
    return getFallbackPublicBookingData(params.clinicSlug);
  }

  const supabase = await createClient();
  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("id, name, slug, timezone, phone, email, address")
    .eq("slug", params.clinicSlug)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (clinicError) {
    throw new Error("Unable to load public clinic.");
  }

  if (!clinic) {
    return {
      clinic: null,
      professionals: [],
      services: [],
      slots: [],
    };
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price_cents, currency, category")
    .eq("clinic_id", clinic.id)
    .eq("status", "active")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (servicesError) {
    throw new Error("Unable to load public services.");
  }

  const serviceRows = services ?? [];
  const selectedServiceId = params.serviceId && serviceRows.some((service) => service.id === params.serviceId)
    ? params.serviceId
    : null;

  let professionals: PublicProfessional[] = [];

  if (selectedServiceId) {
    const { data: professionalLinks, error: professionalLinksError } = await supabase
      .from("professional_services")
      .select("professional_id")
      .eq("clinic_id", clinic.id)
      .eq("service_id", selectedServiceId)
      .eq("is_active", true);

    if (professionalLinksError) {
      throw new Error("Unable to load public professional services.");
    }

    const professionalIds = (professionalLinks ?? []).map((link) => link.professional_id);

    if (professionalIds.length > 0) {
      const { data: professionalRows, error: professionalsError } = await supabase
        .from("professionals")
        .select("id, full_name, specialty, calendar_color")
        .eq("clinic_id", clinic.id)
        .eq("status", "active")
        .in("id", professionalIds)
        .order("full_name", { ascending: true });

      if (professionalsError) {
        throw new Error("Unable to load public professionals.");
      }

      professionals = (professionalRows ?? []).map((professional) => ({
        color: professional.calendar_color,
        id: professional.id,
        name: professional.full_name,
        specialty: professional.specialty,
      }));
    }
  }

  const selectedProfessionalId =
    params.professionalId && professionals.some((professional) => professional.id === params.professionalId)
      ? params.professionalId
      : null;

  const slots =
    selectedServiceId && params.date
      ? await getPublicSlots({
          clinicSlug: params.clinicSlug,
          date: params.date,
          professionalId: selectedProfessionalId,
          serviceId: selectedServiceId,
        })
      : [];

  return {
    clinic: {
      address: clinic.address,
      email: clinic.email,
      id: clinic.id,
      name: clinic.name,
      phone: clinic.phone,
      slug: clinic.slug,
      timezone: clinic.timezone,
    },
    professionals,
    services: serviceRows.map((service) => ({
      category: service.category,
      currency: service.currency,
      description: service.description,
      durationMinutes: service.duration_minutes,
      id: service.id,
      name: service.name,
      priceCents: service.price_cents,
    })),
    slots,
  };
}

async function getPublicSlots(params: {
  clinicSlug: string;
  date: string;
  professionalId: string | null;
  serviceId: string;
}): Promise<PublicSlot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_available_slots", {
    booking_clinic_slug: params.clinicSlug,
    target_date: params.date,
    target_professional_id: params.professionalId,
    target_service_id: params.serviceId,
  });

  if (error) {
    throw new Error("Unable to load public slots.");
  }

  return (data ?? []).map((slot) => ({
    endsAt: slot.ends_at,
    professionalId: slot.professional_id,
    professionalName: slot.professional_name,
    startsAt: slot.starts_at,
  }));
}
