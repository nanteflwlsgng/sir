const dateTimeFormatter = new Intl.DateTimeFormat("fr-MG", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Indian/Antananarivo",
});

const dateFormatter = new Intl.DateTimeFormat("fr-MG", {
  dateStyle: "medium",
  timeZone: "Indian/Antananarivo",
});

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-MG").format(value);
}
