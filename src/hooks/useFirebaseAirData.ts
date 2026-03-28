import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

export type AirStatus = "Good" | "Moderate" | "Dangerous";

export interface AirReading {
  gas: number;
  humidity: number;
  temperature: number;
  status: AirStatus;
  updatedAt: Date | null;
}

const EMPTY_AIR_READING: AirReading = {
  gas: 0,
  humidity: 0,
  temperature: 0,
  status: "Good",
  updatedAt: null,
};

function asNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function pickNumber(data: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const found = asNumber(data[key]);
    if (found !== null) return found;
  }
  return fallback;
}

function parseTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const maybeTs = value as { toDate?: () => Date };
    if (typeof maybeTs.toDate === "function") {
      return maybeTs.toDate();
    }
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getStatus(gas: number): AirStatus {
  if (gas > 450) return "Dangerous";
  if (gas > 300) return "Moderate";
  return "Good";
}

function normalizeAirReading(data: Record<string, unknown>): AirReading {
  const gas = Math.max(0, Math.round(pickNumber(data, ["gas", "gasPpm", "mq135", "ppm", "value"], 0)));
  const humidity = Number(
    Math.max(0, Math.min(100, pickNumber(data, ["humidity", "hum", "rh", "dhtHumidity"], 0))).toFixed(1),
  );
  const temperature = Number(
    pickNumber(data, ["temperature", "temp", "temperatureC", "dhtTemperature"], 0).toFixed(1),
  );
  const updatedAt = parseTimestamp(data.updatedAt ?? data.timestamp ?? data.time ?? data.createdAt);

  return {
    gas,
    humidity,
    temperature,
    status: getStatus(gas),
    updatedAt,
  };
}

/**
 * Reads one latest air purifier reading from Firestore.
 * Supports either collection names: `airReadings` or `air`.
 */
export function useFirebaseAirData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;

  const [fromAirReadings, setFromAirReadings] = useState<AirReading | null>(null);
  const [fromAir, setFromAir] = useState<AirReading | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFromAirReadings(null);
      setFromAir(null);
      return;
    }

    const unsubAirReadings = onSnapshot(collection(db, "airReadings"), (snapshot) => {
      if (snapshot.empty) {
        setFromAirReadings(null);
        return;
      }

      const docs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
      docs.sort((a, b) => {
        const aTime = parseTimestamp(a.data.updatedAt ?? a.data.timestamp ?? a.data.time ?? a.data.createdAt);
        const bTime = parseTimestamp(b.data.updatedAt ?? b.data.timestamp ?? b.data.time ?? b.data.createdAt);
        return (bTime?.getTime() ?? 0) - (aTime?.getTime() ?? 0);
      });

      setFromAirReadings(normalizeAirReading(docs[0].data));
    });

    const unsubAir = onSnapshot(collection(db, "air"), (snapshot) => {
      if (snapshot.empty) {
        setFromAir(null);
        return;
      }
      const sorted = [...snapshot.docs].sort((a, b) => a.id.localeCompare(b.id));
      const first = sorted[0]?.data() as Record<string, unknown> | undefined;
      setFromAir(first ? normalizeAirReading(first) : null);
    });

    return () => {
      unsubAirReadings();
      unsubAir();
    };
  }, [enabled]);

  const reading = useMemo(() => {
    if (!enabled) return EMPTY_AIR_READING;
    return fromAirReadings ?? fromAir ?? EMPTY_AIR_READING;
  }, [enabled, fromAirReadings, fromAir]);

  const isLive = Boolean(fromAirReadings || fromAir);

  return { reading, isLive };
}