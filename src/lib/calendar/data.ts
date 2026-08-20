import { appointmentStatuses, type AppointmentStatus } from "@/lib/auth/permissions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type CalendarFilterOption = {
  color?: string;
  id: string;
  label: string;
};

export type CalendarAppointment = {
  clinicId: string;
  color: string;
  endsAt: string;
  id: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  startsAt: string;
  status: AppointmentStatus;
  title: string | null;
};

export type CalendarDataFilters = {
  clinicId?: string;
  professionalId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
};

export type CalendarData = {
  appointments: CalendarAppointment[];
  professionals: CalendarFilterOption[];
  services: CalendarFilterOption[];
};

const emptyCalendarData: CalendarData = {
  appointments: [],
  professionals: [],
  services: [],
};

export function parseAppointmentStatus(value: string | undefined): AppointmentStatus | undefined {
  return appointmentStatuses.includes(value as AppointmentStatus) ? (value as AppointmentStatus) : undefined;
}

function getScopedClinicIds(clinicIds: readonly string[], selectedClinicId: string | undefined) {
  const uniqueClinicIds = [...new Set(clinicIds)];

  if (!selectedClinicId) {
    return uniqueClinicIds;
  }

  return uniqueClinicIds.includes(selectedClinicId) ? [selectedClinicId] : [];
}

export async function getCalendarData(params: {
  clinicIds: readonly string[];
  endsAt: string;
  filters: CalendarDataFilters;
  startsAt: string;
}): Promise<CalendarData> {
  const clinicIds = getScopedClinicIds(params.clinicIds, params.filters.clinicId);

  if (!isSupabaseConfigured || clinicIds.length === 0) {
    return emptyCalendarData;
  }

  const supabase = await createClient();

  let appointmentsQuery = supabase
    .from("appointments")
    .select("id, clinic_id, patient_id, professional_id, service_id, status, starts_at, ends_at, title")
    .in("clinic_id", clinicIds)
    .gte("starts_at", params.startsAt)
    .lt("starts_at", params.endsAt)
    .order("starts_at", { ascending: true });

  if (params.filters.professionalId) {
    appointmentsQuery = appointmentsQuery.eq("professional_id", params.filters.professionalId);
  }

  if (params.filters.serviceId) {
    appointmentsQuery = appointmentsQuery.eq("service_id", params.filters.serviceId);
  }

  if (params.filters.status) {
    appointmentsQuery = appointmentsQuery.eq("status", params.filters.status);
  }

  const [appointmentsResult, professionalsResult, servicesResult] = await Promise.all([
    appointmentsQuery,
    supabase
      .from("professionals")
      .select("id, full_name, calendar_color")
      .in("clinic_id", clinicIds)
      .eq("status", "active")
      .order("full_name", { ascending: true }),
    supabase
      .from("services")
      .select("id, name, color")
      .in("clinic_id", clinicIds)
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  const error = [appointmentsResult.error, professionalsResult.error, servicesResult.error].find(Boolean);

  if (error) {
    throw new Error("Unable to load calendar data.");
  }

  const appointments = appointmentsResult.data ?? [];
  const professionals = professionalsResult.data ?? [];
  const services = servicesResult.data ?? [];
  const patientIds = [...new Set(appointments.map((appointment) => appointment.patient_id))];
  const patientsResult =
    patientIds.length > 0
      ? await supabase.from("patients").select("id, first_name, last_name").in("id", patientIds)
      : { data: [], error: null };

  if (patientsResult.error) {
    throw new Error("Unable to load appointment patients.");
  }

  const patientsById = new Map(
    patientsResult.data.map((patient) => [patient.id, `${patient.first_name} ${patient.last_name}`]),
  );
  const professionalsById = new Map(
    professionals.map((professional) => [
      professional.id,
      {
        color: professional.calendar_color,
        label: professional.full_name,
      },
    ]),
  );
  const servicesById = new Map(
    services.map((service) => [
      service.id,
      {
        color: service.color,
        label: service.name,
      },
    ]),
  );

  return {
    appointments: appointments.map((appointment) => {
      const professional = professionalsById.get(appointment.professional_id);
      const service = servicesById.get(appointment.service_id);

      return {
        clinicId: appointment.clinic_id,
        color: professional?.color ?? service?.color ?? "#0f766e",
        endsAt: appointment.ends_at,
        id: appointment.id,
        patientName: patientsById.get(appointment.patient_id) ?? "Paciente sin datos visibles",
        professionalId: appointment.professional_id,
        professionalName: professional?.label ?? "Profesional sin datos visibles",
        serviceId: appointment.service_id,
        serviceName: service?.label ?? "Servicio sin datos visibles",
        startsAt: appointment.starts_at,
        status: appointment.status,
        title: appointment.title,
      };
    }),
    professionals: professionals.map((professional) => ({
      color: professional.calendar_color,
      id: professional.id,
      label: professional.full_name,
    })),
    services: services.map((service) => ({
      color: service.color ?? undefined,
      id: service.id,
      label: service.name,
    })),
  };
}
