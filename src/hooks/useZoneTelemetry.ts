import { useEffect, useState } from "react";
import { CAMPUS_ZONES } from "@/lib/campusZones";

export type ZoneTelemetryKind = "electricity" | "water" | "air";

export interface ZoneReading {
  zone: string;
  value: number;
}

/** Simulated MQ135-style ADC (0–1023): most zones stay under 300; one “hot” zone can reach up to ~500. */
function generateAirZoneReadings(): ZoneReading[] {
  const zones = [...CAMPUS_ZONES];
  const hotIndex = Math.floor(Math.random() * zones.length);
  return zones.map((zone, i) => {
    if (i === hotIndex) {
      return { zone, value: Math.round(320 + Math.random() * 180) };
    }
    return { zone, value: Math.round(60 + Math.random() * 235) };
  });
}

function generate(kind: ZoneTelemetryKind): ZoneReading[] {
  if (kind === "air") return generateAirZoneReadings();
  return CAMPUS_ZONES.map((zone) => ({
    zone,
    value:
      kind === "electricity"
        ? Math.round(38 + Math.random() * 125)
        : Math.round(14 + Math.random() * 58),
  }));
}

export function useZoneTelemetry(kind: ZoneTelemetryKind, enabled: boolean) {
  const [readings, setReadings] = useState<ZoneReading[]>(() => generate(kind));

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setReadings(generate(kind)), 7000);
    return () => clearInterval(id);
  }, [kind, enabled]);

  return readings;
}
