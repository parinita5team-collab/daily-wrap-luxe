// UAE national calendar: public holidays and official observances.
// Islamic (Hijri-based) dates are the expected Gregorian dates and may shift by
// a day or two with the official moon-sighting announcement.

export type UaeKind = "holiday" | "observance" | "religious";

export interface UaeDay {
  date: string; // yyyy-mm-dd
  name: string;
  kind: UaeKind;
  note?: string;
}

export const UAE_KIND_META: Record<UaeKind, { label: string; color: string }> = {
  holiday: { label: "Public Holiday", color: "#2FEA6A" },
  religious: { label: "Religious", color: "#8B7FE8" },
  observance: { label: "National Observance", color: "#38BDF8" },
};

export const UAE_CALENDAR: UaeDay[] = [
  // ---------- 2025 ----------
  { date: "2025-01-01", name: "New Year's Day", kind: "holiday" },
  { date: "2025-03-01", name: "Ramadan begins", kind: "religious", note: "Reduced working hours across the UAE" },
  { date: "2025-03-19", name: "Zayed Humanitarian Work Day", kind: "observance" },
  { date: "2025-03-30", name: "Eid Al Fitr Holiday", kind: "holiday" },
  { date: "2025-03-31", name: "Eid Al Fitr", kind: "holiday" },
  { date: "2025-04-01", name: "Eid Al Fitr Holiday", kind: "holiday" },
  { date: "2025-06-05", name: "Arafat Day", kind: "holiday" },
  { date: "2025-06-06", name: "Eid Al Adha", kind: "holiday" },
  { date: "2025-06-07", name: "Eid Al Adha Holiday", kind: "holiday" },
  { date: "2025-06-08", name: "Eid Al Adha Holiday", kind: "holiday" },
  { date: "2025-06-26", name: "Islamic New Year", kind: "holiday" },
  { date: "2025-08-28", name: "Emirati Women's Day", kind: "observance" },
  { date: "2025-09-05", name: "Prophet Muhammad's Birthday", kind: "holiday" },
  { date: "2025-11-01", name: "Union Pledge Day", kind: "observance" },
  { date: "2025-11-03", name: "UAE Flag Day", kind: "observance" },
  { date: "2025-12-01", name: "Commemoration Day", kind: "holiday" },
  { date: "2025-12-02", name: "UAE National Day", kind: "holiday" },
  { date: "2025-12-03", name: "UAE National Day Holiday", kind: "holiday" },

  // ---------- 2026 ----------
  { date: "2026-01-01", name: "New Year's Day", kind: "holiday" },
  { date: "2026-02-18", name: "Ramadan begins", kind: "religious", note: "Reduced working hours across the UAE" },
  { date: "2026-03-08", name: "Zayed Humanitarian Work Day", kind: "observance" },
  { date: "2026-03-19", name: "Eid Al Fitr Holiday", kind: "holiday" },
  { date: "2026-03-20", name: "Eid Al Fitr", kind: "holiday" },
  { date: "2026-03-21", name: "Eid Al Fitr Holiday", kind: "holiday" },
  { date: "2026-03-22", name: "Eid Al Fitr Holiday", kind: "holiday" },
  { date: "2026-05-26", name: "Arafat Day", kind: "holiday" },
  { date: "2026-05-27", name: "Eid Al Adha", kind: "holiday" },
  { date: "2026-05-28", name: "Eid Al Adha Holiday", kind: "holiday" },
  { date: "2026-05-29", name: "Eid Al Adha Holiday", kind: "holiday" },
  { date: "2026-06-16", name: "Islamic New Year", kind: "holiday" },
  { date: "2026-08-25", name: "Prophet Muhammad's Birthday", kind: "holiday" },
  { date: "2026-08-28", name: "Emirati Women's Day", kind: "observance" },
  { date: "2026-11-01", name: "Union Pledge Day", kind: "observance" },
  { date: "2026-11-03", name: "UAE Flag Day", kind: "observance" },
  { date: "2026-12-01", name: "Commemoration Day", kind: "holiday" },
  { date: "2026-12-02", name: "UAE National Day", kind: "holiday" },
  { date: "2026-12-03", name: "UAE National Day Holiday", kind: "holiday" },

  // ---------- 2027 ----------
  { date: "2027-01-01", name: "New Year's Day", kind: "holiday" },
  { date: "2027-02-08", name: "Ramadan begins", kind: "religious", note: "Reduced working hours across the UAE" },
  { date: "2027-02-26", name: "Zayed Humanitarian Work Day", kind: "observance" },
  { date: "2027-03-09", name: "Eid Al Fitr Holiday", kind: "holiday" },
  { date: "2027-03-10", name: "Eid Al Fitr", kind: "holiday" },
  { date: "2027-03-11", name: "Eid Al Fitr Holiday", kind: "holiday" },
  { date: "2027-03-12", name: "Eid Al Fitr Holiday", kind: "holiday" },
  { date: "2027-05-16", name: "Arafat Day", kind: "holiday" },
  { date: "2027-05-17", name: "Eid Al Adha", kind: "holiday" },
  { date: "2027-05-18", name: "Eid Al Adha Holiday", kind: "holiday" },
  { date: "2027-05-19", name: "Eid Al Adha Holiday", kind: "holiday" },
  { date: "2027-06-06", name: "Islamic New Year", kind: "holiday" },
  { date: "2027-08-15", name: "Prophet Muhammad's Birthday", kind: "holiday" },
  { date: "2027-08-28", name: "Emirati Women's Day", kind: "observance" },
  { date: "2027-11-01", name: "Union Pledge Day", kind: "observance" },
  { date: "2027-11-03", name: "UAE Flag Day", kind: "observance" },
  { date: "2027-12-01", name: "Commemoration Day", kind: "holiday" },
  { date: "2027-12-02", name: "UAE National Day", kind: "holiday" },
  { date: "2027-12-03", name: "UAE National Day Holiday", kind: "holiday" },
];

const BY_DATE = UAE_CALENDAR.reduce<Record<string, UaeDay[]>>((acc, d) => {
  (acc[d.date] ??= []).push(d);
  return acc;
}, {});

export function uaeDaysFor(date: string): UaeDay[] {
  return BY_DATE[date] ?? [];
}

export function isUaePublicHoliday(date: string): boolean {
  return uaeDaysFor(date).some((d) => d.kind === "holiday");
}

export function upcomingUaeDays(fromDate: string, count = 4): UaeDay[] {
  return UAE_CALENDAR.filter((d) => d.date >= fromDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count);
}
