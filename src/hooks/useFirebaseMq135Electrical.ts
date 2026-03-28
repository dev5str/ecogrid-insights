import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

/** Live electricity row label (matches waste/air “MG Audi” pattern). */
export const LIVE_ELECTRICITY_ZONE = "MG Audi";

function asNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const maybeTs = value as { toDate?: () => Date };
    if (typeof maybeTs.toDate === "function") return maybeTs.toDate();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * MQ135 / ESP payloads in `environment` often suffix fields with `MW` but send **milliwatts** (mW).
 * We keep firmware keys in the type names for easier field mapping.
 */
export interface Mq135ElectricalReading {
  currentMA: number;
  /** Stored as `loadPowerMW` in Firestore; numeric milliwatts. */
  loadPowerMw: number;
  loadResistanceKohm: number;
  /** Stored as `sensorPowerMW`; numeric milliwatts. */
  sensorPowerMw: number;
  supplyVoltage: number;
  /** Stored as `totalPowerMW`; numeric milliwatts. */
  totalPowerMw: number;
  updatedAt: Date | null;
}

const EMPTY: Mq135ElectricalReading = {
  currentMA: 0,
  loadPowerMw: 0,
  loadResistanceKohm: 0,
  sensorPowerMw: 0,
  supplyVoltage: 0,
  totalPowerMw: 0,
  updatedAt: null,
};

function parseElectrical(data: Record<string, unknown>): Mq135ElectricalReading | null {
  const currentMA = asNumber(data.currentMA);
  const totalPowerMW = asNumber(data.totalPowerMW);
  const loadPowerMW = asNumber(data.loadPowerMW);
  const sensorPowerMW = asNumber(data.sensorPowerMW);
  const supplyVoltage = asNumber(data.supplyVoltage);
  const loadResistanceKohm = asNumber(data.loadResistanceKohm);

  const hasAny =
    currentMA !== null ||
    totalPowerMW !== null ||
    loadPowerMW !== null ||
    sensorPowerMW !== null ||
    supplyVoltage !== null ||
    loadResistanceKohm !== null;
  if (!hasAny) return null;

  return {
    currentMA: currentMA ?? 0,
    loadPowerMw: loadPowerMW ?? 0,
    loadResistanceKohm: loadResistanceKohm ?? 0,
    sensorPowerMw: sensorPowerMW ?? 0,
    supplyVoltage: supplyVoltage ?? 0,
    totalPowerMw: totalPowerMW ?? 0,
    updatedAt: parseTimestamp(data.updatedAt ?? data.timestamp ?? data.time ?? data.createdAt),
  };
}

/**
 * Live MQ135 electrical rail from Firestore `environment` (same doc as air: usually `environment/air`).
 */
export function useFirebaseMq135Electrical(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const [fromAirDoc, setFromAirDoc] = useState<Mq135ElectricalReading | null>(null);
  const [fromOtherEnvDoc, setFromOtherEnvDoc] = useState<Mq135ElectricalReading | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFromAirDoc(null);
      setFromOtherEnvDoc(null);
      return;
    }

    const airRef = doc(db, "environment", "air");
    const unsubAir = onSnapshot(airRef, (snap) => {
      if (!snap.exists()) {
        setFromAirDoc(null);
        return;
      }
      setFromAirDoc(parseElectrical(snap.data() as Record<string, unknown>));
    });

    const unsubCol = onSnapshot(collection(db, "environment"), (snapshot) => {
      if (snapshot.empty) {
        setFromOtherEnvDoc(null);
        return;
      }
      const docs = snapshot.docs
        .filter((d) => d.id !== "air")
        .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
      if (docs.length === 0) {
        setFromOtherEnvDoc(null);
        return;
      }
      docs.sort((a, b) => {
        const aTime = parseTimestamp(a.data.updatedAt ?? a.data.timestamp ?? a.data.time ?? a.data.createdAt);
        const bTime = parseTimestamp(b.data.updatedAt ?? b.data.timestamp ?? b.data.time ?? b.data.createdAt);
        return (bTime?.getTime() ?? 0) - (aTime?.getTime() ?? 0);
      });
      let picked: Mq135ElectricalReading | null = null;
      for (const d of docs) {
        const p = parseElectrical(d.data);
        if (p) {
          picked = p;
          break;
        }
      }
      setFromOtherEnvDoc(picked);
    });

    return () => {
      unsubAir();
      unsubCol();
    };
  }, [enabled]);

  const reading = useMemo(() => {
    if (!enabled) return EMPTY;
    return fromAirDoc ?? fromOtherEnvDoc ?? EMPTY;
  }, [enabled, fromAirDoc, fromOtherEnvDoc]);

  const isLive = Boolean(enabled && (fromAirDoc || fromOtherEnvDoc));

  const dataSource = useMemo(() => {
    if (fromAirDoc) return "environment/air";
    if (fromOtherEnvDoc) return "environment";
    return null;
  }, [fromAirDoc, fromOtherEnvDoc]);

  return { reading, isLive, dataSource };
}
