/** Canonical campus zones for water, electricity, and air dashboards. */
export const CAMPUS_ZONES = [
  "Central Academic Block",
  "Engineering Wing A",
  "Library & Learning Centre",
  "Hostel Quadrangle",
  "Sports Arena",
  "Admin & Exam Wing",
] as const;

export type CampusZone = (typeof CAMPUS_ZONES)[number];
