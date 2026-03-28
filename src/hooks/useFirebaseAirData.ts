import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

/** ESP8266 MQ135 on A0: 10-bit style 0–1023 (matches Arduino `analogRead`). */
export const MQ135_ADC_MAX = 1023;

/** Firmware `AIR_THRESHOLD` (BAD when adc >= this). */
export const MQ135_ADC_MODERATE_MIN = 250;

/** Above this ADC we show Dangerous (firmware only has BAD/GOOD; this extends the UI). */
export const MQ135_ADC_DANGEROUS_MIN = 500;

export type AirStatus = "Good" | "Moderate" | "Dangerous";

/** `mq135_adc`: raw ESP8266/Arduino ADC like firmware `airValue`. `ppm`: legacy scaled PPM fields. */
export type AirMetricKind = "mq135_adc" | "ppm";

export interface AirReading {
  gas: number;
  humidity: number;
  temperature: number;
  status: AirStatus;
  updatedAt: Date | null;
  metric: AirMetricKind;
}

const EMPTY_AIR_READING: AirReading = {
  gas: 0,
  humidity: 0,
  temperature: 0,
  status: "Good",
  updatedAt: null,
  metric: "ppm",
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

function getStatusLegacyPpm(gas: number): AirStatus {
  if (gas > 450) return "Dangerous";
  if (gas > 300) return "Moderate";
  return "Good";
}

/** ADC thresholds match ESP `AIR_THRESHOLD` (250) and UI dangerous band (500). Numeric only so alerts stay correct even if `airStatus` lags. */
function getStatusFromMq135Adc(adc: number, _airStatusRaw: unknown): AirStatus {
  if (adc >= MQ135_ADC_DANGEROUS_MIN) return "Dangerous";
  if (adc >= MQ135_ADC_MODERATE_MIN) return "Moderate";
  return "Good";
}

function normalizeAirReading(data: Record<string, unknown>): AirReading {
  const hasAirValue = data.airValue !== undefined && data.airValue !== null && asNumber(data.airValue) !== null;

  const gas = Math.max(
    0,
    Math.round(
      pickNumber(
        data,
        hasAirValue
          ? ["airValue", "gas", "gasPpm", "mq135", "ppm", "value"]
          : ["gas", "gasPpm", "mq135", "ppm", "value", "airValue"],
        0,
      ),
    ),
  );

  const humidity = Number(
    Math.max(0, Math.min(100, pickNumber(data, ["humidity", "hum", "rh", "dhtHumidity"], 0))).toFixed(1),
  );
  const temperature = Number(
    pickNumber(data, ["temperature", "temp", "temperatureC", "dhtTemperature"], 0).toFixed(1),
  );
  const updatedAt = parseTimestamp(data.updatedAt ?? data.timestamp ?? data.time ?? data.createdAt);

  const metric: AirMetricKind = hasAirValue ? "mq135_adc" : "ppm";
  const status = metric === "mq135_adc" ? getStatusFromMq135Adc(gas, data.airStatus) : getStatusLegacyPpm(gas);

  return {
    gas,
    humidity,
    temperature,
    status,
    updatedAt,
    metric,
  };
}

/**
 * Firestore sources (ESP8266 firmware):
 * - Document `environment/air`: `airValue` (int ADC), `airStatus` ("GOOD" | "BAD") — primary for your sketch.
 * - Collection `environment`: other docs, latest by timestamp.
 * - `airReadings`, collection `air`: fallbacks.
 */
export function useFirebaseAirData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;

  const [fromEnvironmentAirDoc, setFromEnvironmentAirDoc] = useState<AirReading | null>(null);
  const [fromEnvironmentCollection, setFromEnvironmentCollection] = useState<AirReading | null>(null);
  const [fromAirReadings, setFromAirReadings] = useState<AirReading | null>(null);
  const [fromAir, setFromAir] = useState<AirReading | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFromEnvironmentAirDoc(null);
      setFromEnvironmentCollection(null);
      setFromAirReadings(null);
      setFromAir(null);
      return;
    }

    const airDocRef = doc(db, "environment", "air");
    const unsubEnvironmentAir = onSnapshot(airDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        setFromEnvironmentAirDoc(null);
        return;
      }
      setFromEnvironmentAirDoc(normalizeAirReading(snapshot.data() as Record<string, unknown>));
    });

    const unsubEnvironment = onSnapshot(collection(db, "environment"), (snapshot) => {
      if (snapshot.empty) {
        setFromEnvironmentCollection(null);
        return;
      }

      const docs = snapshot.docs
        .filter((d) => d.id !== "air")
        .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
      if (docs.length === 0) {
        setFromEnvironmentCollection(null);
        return;
      }

      docs.sort((a, b) => {
        const aTime = parseTimestamp(a.data.updatedAt ?? a.data.timestamp ?? a.data.time ?? a.data.createdAt);
        const bTime = parseTimestamp(b.data.updatedAt ?? b.data.timestamp ?? b.data.time ?? b.data.createdAt);
        return (bTime?.getTime() ?? 0) - (aTime?.getTime() ?? 0);
      });

      setFromEnvironmentCollection(normalizeAirReading(docs[0].data));
    });

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

    const unsubAirCol = onSnapshot(collection(db, "air"), (snapshot) => {
      if (snapshot.empty) {
        setFromAir(null);
        return;
      }
      const sorted = [...snapshot.docs].sort((a, b) => a.id.localeCompare(b.id));
      const first = sorted[0]?.data() as Record<string, unknown> | undefined;
      setFromAir(first ? normalizeAirReading(first) : null);
    });

    return () => {
      unsubEnvironmentAir();
      unsubEnvironment();
      unsubAirReadings();
      unsubAirCol();
    };
  }, [enabled]);

  const reading = useMemo(() => {
    if (!enabled) return EMPTY_AIR_READING;
    return (
      fromEnvironmentAirDoc ??
      fromEnvironmentCollection ??
      fromAirReadings ??
      fromAir ??
      EMPTY_AIR_READING
    );
  }, [enabled, fromEnvironmentAirDoc, fromEnvironmentCollection, fromAirReadings, fromAir]);

  const isLive = Boolean(fromEnvironmentAirDoc || fromEnvironmentCollection || fromAirReadings || fromAir);

  const dataSource = useMemo(() => {
    if (fromEnvironmentAirDoc) return "environment/air";
    if (fromEnvironmentCollection) return "environment";
    if (fromAirReadings) return "airReadings";
    if (fromAir) return "air";
    return null;
  }, [fromEnvironmentAirDoc, fromEnvironmentCollection, fromAirReadings, fromAir]);

  const gasScaleMax = reading.metric === "mq135_adc" ? MQ135_ADC_MAX : 600;

  return { reading, isLive, dataSource, gasScaleMax };
}
