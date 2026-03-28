import { useEffect, useState } from "react";
import { CAMPUS_ZONES } from "@/lib/campusZones";

export type ZoneTelemetryKind = "electricity" | "water" | "air";

export interface ZoneReading {
  zone: string;
  value: number;
}

function generate(kind: ZoneTelemetryKind): ZoneReading[] {
  return CAMPUS_ZONES.map((zone) => ({
    zone,
    value:
      kind === "electricity"
        ? Math.round(38 + Math.random() * 125)
        : kind === "water"
          ? Math.round(14 + Math.random() * 58)
          : Math.round(160 + Math.random() * 340),
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
