export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLongDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(year, month - 1, day));
}

export function startOfLocalWeek(now = new Date()): Date {
  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - ((day + 6) % 7));
  return result;
}
