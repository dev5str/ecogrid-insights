import { useCallback, useEffect, useMemo, useState } from "react";
import { CAMPUS_ZONES } from "@/lib/campusZones";

export interface ChennaiInstitution {
  id: string;
  name: string;
  area: string;
  ecoScore: number;
}

export interface CarbonSnapshot {
  monthlyTonnesCo2e: number;
  nationalAvgTonnesCo2e: number;
  electricityPct: number;
  waterPct: number;
  wastePct: number;
  airQualityPct: number;
}

export interface ElectricityAnomaly {
  id: string;
  timestamp: Date;
  zone: string;
  loadKw: number;
  baselineKw: number;
  rootCauseTag: string;
}

const CHENNAI_SEED: Omit<ChennaiInstitution, "ecoScore">[] = [
  { id: "iitm", name: "Indian Institute of Technology Madras", area: "Adyar" },
  { id: "anna", name: "Anna University - CEG Campus", area: "Guindy" },
  { id: "ssn", name: "SSN College of Engineering", area: "Kalavakkam" },
  { id: "srm", name: "SRM Institute of Science and Technology", area: "Kattankulathur" },
  { id: "vit", name: "VIT Chennai", area: "Kelambakkam" },
  { id: "loyola", name: "Loyola College", area: "Nungambakkam" },
];

const ANOMALY_TAGS = [
  "Unoccupied zone + after hours",
  "HVAC schedule mismatch",
  "Lab equipment left on",
  "Weekend baseline drift",
  "Peak tariff window overload",
];

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function randAround(center: number, spread: number) {
  return center + (Math.random() * 2 - 1) * spread;
}

export function useChennaiLeaderboard(enabled = true) {
  const [institutions, setInstitutions] = useState<ChennaiInstitution[]>(() =>
    CHENNAI_SEED.map((s) => ({
      ...s,
      ecoScore: Math.round(clamp(68 + Math.random() * 28, 52, 99)),
    })),
  );

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setInstitutions((prev) =>
        prev.map((inst) => ({
          ...inst,
          ecoScore: Math.round(clamp(randAround(inst.ecoScore, 1.4), 48, 100)),
        })),
      );
    }, 4000);
    return () => clearInterval(id);
  }, [enabled]);

  const ranked = useMemo(
    () => [...institutions].sort((a, b) => b.ecoScore - a.ecoScore),
    [institutions],
  );

  return { institutions: ranked };
}

export function useCarbonFootprint(enabled = true) {
  const [snapshot, setSnapshot] = useState<CarbonSnapshot>(() => ({
    monthlyTonnesCo2e: 118.4,
    nationalAvgTonnesCo2e: 142.0,
    electricityPct: 46,
    waterPct: 18,
    wastePct: 22,
    airQualityPct: 14,
  }));

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      setSnapshot((s) => {
        const electricityPct = Math.round(clamp(randAround(s.electricityPct, 2), 35, 52));
        const waterPct = Math.round(clamp(randAround(s.waterPct, 2), 12, 26));
        const wastePct = Math.round(clamp(randAround(s.wastePct, 2), 16, 30));
        const airQualityPct = Math.max(10, 100 - electricityPct - waterPct - wastePct);
        return {
          ...s,
          monthlyTonnesCo2e: clamp(randAround(s.monthlyTonnesCo2e, 2.2), 85, 165),
          electricityPct,
          waterPct,
          wastePct,
          airQualityPct,
        };
      });
    }, 6000);
    return () => clearInterval(id);
  }, [enabled]);

  return snapshot;
}

export function useElectricityAnomalies(enabled = true, maxItems = 12) {
  const [anomalies, setAnomalies] = useState<ElectricityAnomaly[]>([]);

  const pushOne = useCallback(() => {
    const zone = CAMPUS_ZONES[Math.floor(Math.random() * CAMPUS_ZONES.length)];
    const baselineKw = 40 + Math.random() * 80;
    const spike = baselineKw * (1.35 + Math.random() * 0.85);
    const tag = ANOMALY_TAGS[Math.floor(Math.random() * ANOMALY_TAGS.length)];
    const row: ElectricityAnomaly = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      zone,
      loadKw: Math.round(spike),
      baselineKw: Math.round(baselineKw),
      rootCauseTag: tag,
    };
    setAnomalies((prev) => [row, ...prev].slice(0, maxItems));
  }, [maxItems]);

  useEffect(() => {
    if (!enabled) return;
    pushOne();
    const id = window.setInterval(() => {
      if (Math.random() > 0.45) pushOne();
    }, 11000);
    return () => clearInterval(id);
  }, [enabled, pushOne]);

  return { anomalies, pushOne };
}

export function buildUnifiedExportRows(now = new Date()) {
  const bins = ["bin1", "bin2", "bin3", "bin4", "bin5"];
  const rows: (string | number)[][] = [];
  for (let d = 0; d < 48; d++) {
    const t = new Date(now.getTime() - d * 3600000);
    const zone = CAMPUS_ZONES[d % CAMPUS_ZONES.length];
    const bin = bins[d % bins.length];
    rows.push([
      t.toISOString(),
      zone,
      bin,
      Math.round(20 + Math.random() * 75),
      Math.round(180 + Math.random() * 220),
      Math.round(15 + Math.random() * 55),
      Math.round(120 + Math.random() * 380),
      Math.round(200 + Math.random() * 120),
    ]);
  }
  return rows;
}

export const EXPORT_HEADERS = [
  "timestamp_iso",
  "zone",
  "bin_id",
  "waste_fill_pct",
  "electricity_kw",
  "water_flow_l_min",
  "air_gas_ppm",
  "baseline_kw",
] as const;
