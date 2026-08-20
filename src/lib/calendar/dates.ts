export const calendarViews = ["day", "week", "month"] as const;

export type CalendarView = (typeof calendarViews)[number];

export type CalendarRange = {
  days: Date[];
  endsAt: string;
  label: string;
  startsAt: string;
  value: string;
  view: CalendarView;
};

function toUtcDateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function startOfIsoWeek(date: Date) {
  const dateOnly = toUtcDateOnly(date);
  const day = dateOnly.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(dateOnly, diff);
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfNextMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function parseDateValue(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return toUtcDateOnly(new Date());
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? toUtcDateOnly(new Date()) : date;
}

export function formatDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("es", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function getCalendarRange(view: CalendarView, dateValue: string | undefined): CalendarRange {
  const selectedDate = parseDateValue(dateValue);

  if (view === "day") {
    const startsAt = toUtcDateOnly(selectedDate);
    const endsAt = addDays(startsAt, 1);

    return {
      days: [startsAt],
      endsAt: endsAt.toISOString(),
      label: formatShortDate(startsAt),
      startsAt: startsAt.toISOString(),
      value: formatDateValue(startsAt),
      view,
    };
  }

  if (view === "month") {
    const startsAt = startOfMonth(selectedDate);
    const endsAt = startOfNextMonth(selectedDate);
    const days = [];

    for (let day = startsAt; day < endsAt; day = addDays(day, 1)) {
      days.push(day);
    }

    return {
      days,
      endsAt: endsAt.toISOString(),
      label: formatMonthLabel(startsAt),
      startsAt: startsAt.toISOString(),
      value: formatDateValue(startsAt),
      view,
    };
  }

  const startsAt = startOfIsoWeek(selectedDate);
  const endsAt = addDays(startsAt, 7);

  return {
    days: Array.from({ length: 7 }, (_, index) => addDays(startsAt, index)),
    endsAt: endsAt.toISOString(),
    label: `${formatShortDate(startsAt)} - ${formatShortDate(addDays(endsAt, -1))}`,
    startsAt: startsAt.toISOString(),
    value: formatDateValue(selectedDate),
    view,
  };
}

export function getAdjacentCalendarDate(range: CalendarRange, direction: -1 | 1) {
  const currentDate = new Date(`${range.value}T00:00:00.000Z`);

  if (range.view === "day") {
    return formatDateValue(addDays(currentDate, direction));
  }

  if (range.view === "month") {
    return formatDateValue(new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + direction, 1)));
  }

  return formatDateValue(addDays(currentDate, direction * 7));
}

export function formatAppointmentTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

export function formatDateValueInTimeZone(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}
