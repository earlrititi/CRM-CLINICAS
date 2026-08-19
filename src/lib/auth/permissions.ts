export const platformRoles = ["superadmin"] as const;

export const clinicRoles = ["clinic_admin", "reception", "professional", "readonly"] as const;

export type PlatformRole = (typeof platformRoles)[number];
export type ClinicRole = (typeof clinicRoles)[number];

export const clinicStatuses = ["active", "inactive", "trialing", "suspended"] as const;
export const clinicMemberStatuses = ["active", "invited", "suspended"] as const;

export type ClinicStatus = (typeof clinicStatuses)[number];
export type ClinicMemberStatus = (typeof clinicMemberStatuses)[number];

export const clinicPermissions = [
  "clinic:read",
  "clinic:update",
  "members:read",
  "members:manage",
  "audit:read",
  "settings:manage",
  "patients:read",
  "patients:manage",
  "professionals:read",
  "professionals:manage",
  "services:read",
  "services:manage",
  "schedule:read",
  "schedule:manage",
  "resources:read",
  "resources:manage",
] as const;

export type ClinicPermission = (typeof clinicPermissions)[number];

export const clinicRolePermissions = {
  clinic_admin: [
    "clinic:read",
    "clinic:update",
    "members:read",
    "members:manage",
    "audit:read",
    "settings:manage",
    "patients:read",
    "patients:manage",
    "professionals:read",
    "professionals:manage",
    "services:read",
    "services:manage",
    "schedule:read",
    "schedule:manage",
    "resources:read",
    "resources:manage",
  ],
  reception: [
    "clinic:read",
    "members:read",
    "patients:read",
    "patients:manage",
    "professionals:read",
    "services:read",
    "schedule:read",
    "schedule:manage",
    "resources:read",
  ],
  professional: [
    "clinic:read",
    "patients:read",
    "professionals:read",
    "services:read",
    "schedule:read",
    "resources:read",
  ],
  readonly: [
    "clinic:read",
    "patients:read",
    "professionals:read",
    "services:read",
    "schedule:read",
    "resources:read",
  ],
} satisfies Record<ClinicRole, readonly ClinicPermission[]>;

export function isClinicRole(value: unknown): value is ClinicRole {
  return typeof value === "string" && clinicRoles.includes(value as ClinicRole);
}

export function hasAnyClinicRole(role: ClinicRole | null | undefined, allowedRoles: readonly ClinicRole[]) {
  return Boolean(role && allowedRoles.includes(role));
}

export function hasClinicPermission(role: ClinicRole | null | undefined, permission: ClinicPermission) {
  if (!role) {
    return false;
  }

  const permissions = clinicRolePermissions[role] as readonly ClinicPermission[];
  return permissions.includes(permission);
}

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
