const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0).replace("KES", "KSh");
}

export function formatDate(value) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${String(value).slice(0, 10)}T00:00:00Z`));
}

export function formatPeriod(value) {
  const [year, month] = value.split("-");
  return new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)));
}

export function pluralize(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}
