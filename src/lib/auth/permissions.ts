export const platformRoles = ["superadmin"] as const;

export const clinicRoles = ["clinic_admin", "reception", "professional", "readonly"] as const;

export type PlatformRole = (typeof platformRoles)[number];
export type ClinicRole = (typeof clinicRoles)[number];

export const appointmentStatuses = [
  "pending",
  "confirmed",
  "waiting",
  "cancelled",
  "no_show",
  "completed",
  "rescheduled",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];
