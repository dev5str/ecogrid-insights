import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import type { Alert, WasteBin } from "@/hooks/useSimulatedData";

/** Live Firestore bin always shown with this label. */
export const LIVE_WASTE_BIN_NAME = "MG Audi";

/** Simulated bins: school or college rooms plus a few transit hubs. */
const SIM_LOCATION_NAMES = [
  "Main Library",
  "Computer Lab",
  "Physics Lab",
  "Chemistry Lab",
  "Staff Room",
  "Cafeteria",
  "Auditorium",
  "Boys Hostel Mess",
  "Girls Hostel Foyer",
  "Sports Complex",
  "Admin Office",
  "North Campus Bus Stand",
  "City Railway Station",
  "International Airport T2",
] as const;

function randBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

/** Simulated bins `bin{startNumber}…` for UI padding (ESP sketch uses `bins/bin1`…`bin3`). */
function initialSimulatedBinsFrom(startBinNumber: number, count: number): WasteBin[] {
  return Array.from({ length: count }, (_, i) => {
    const binNum = startBinNumber + i;
    const nameIndex = Math.max(0, binNum - 2) % SIM_LOCATION_NAMES.length;
    const name = SIM_LOCATION_NAMES[nameIndex] ?? `Zone ${binNum}`;
    return {
      id: `bin${binNum}`,
      name,
      zone: name,
      fillLevel: randBetween(12, 55),
      lastCollected: new Date(Date.now() - randBetween(1, 48) * 3600000).toLocaleString(),
    };
  });
}

function initialSimulatedBins(): WasteBin[] {
  return initialSimulatedBinsFrom(2, SIM_LOCATION_NAMES.length);
}

function displayNameForBinDocId(id: string): string {
  if (id === "bin1") return LIVE_WASTE_BIN_NAME;
  const m = /^bin(\d+)$/i.exec(id);
  if (m) return `Bin ${m[1]}`;
  return id;
}

function wasteBinFromFirestoreDoc(docSnap: QueryDocumentSnapshot): WasteBin {
  const data = docSnap.data() as Record<string, unknown>;
  const id = docSnap.id;
  const zone = normalizeZone(data);
  return {
    id,
    name: displayNameForBinDocId(id),
    zone: zone !== "Unknown Zone" ? zone : displayNameForBinDocId(id),
    fillLevel: normalizeFillLevel(data),
    lastCollected:
      typeof data.lastCollected === "string"
        ? data.lastCollected
        : data.lastCollected instanceof Date
          ? data.lastCollected.toLocaleString()
          : "",
  };
}

function maxBinNumericId(bins: WasteBin[]): number {
  return bins.reduce((m, b) => {
    const n = /^bin(\d+)$/i.exec(b.id);
    return n ? Math.max(m, parseInt(n[1], 10)) : m;
  }, 0);
}

function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeSeverity(value: unknown): Alert["severity"] {
  const normalized = String(value ?? "normal").toLowerCase();
  if (["critical", "crit", "high"].includes(normalized)) return "critical";
  if (["warning", "warn", "medium", "med"].includes(normalized)) return "warning";
  if (["normal", "ok", "low"].includes(normalized)) return "normal";
  return "normal";
}

function normalizeModule(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

function normalizeFillLevel(data: Record<string, unknown>): number {
  return Number(data.fillLevel ?? data.level ?? data.value ?? data.percentage ?? 0);
}

function normalizeZone(data: Record<string, unknown>): string {
  return String(data.zone ?? data.location ?? data.area ?? data.site ?? "Unknown Zone");
}

function normalizeLocation(data: Record<string, unknown>): string {
  if (data.location) return String(data.location);
  if (data.zone) return String(data.zone);
  if (data.area) return String(data.area);
  if (data.site) return String(data.site);
  if (data.block && data.floor) return `${data.block}, ${data.floor}`;
  return "Unknown Location";
}

function buildWasteAlertMessage(
  data: Record<string, unknown>,
  location: string,
  fillLevel: number,
  severity: Alert["severity"],
): string {
  if (typeof data.message === "string" && data.message) return data.message;

  const binLabel = String(data.binId ?? data.binName ?? data.bin ?? data.id ?? "Bin");
  const roundedLevel = Number.isFinite(fillLevel) ? Math.round(fillLevel) : 0;

  if (severity === "critical") {
    return `${binLabel} at ${location} is critical at ${roundedLevel}%`;
  }
  if (severity === "warning") {
    return `${binLabel} at ${location} is MED at ${roundedLevel}%`;
  }
  return `${binLabel} at ${location} is LOW at ${roundedLevel}%`;
}

function isWasteAlert(data: Record<string, unknown>): boolean {
  const moduleName = normalizeModule(data.module);
  if (moduleName === "waste") return true;
  return Boolean(data.binId || data.binName || data.fillLevel || data.level || data.percentage);
}

/** Matches waste stat cards: critical > 90, warning 70-90, normal < 70 */
function wasteSeverityFromFill(fill: number): Alert["severity"] {
  if (fill > 90) return "critical";
  if (fill >= 70) return "warning";
  return "normal";
}

const SEV_RANK: Record<Alert["severity"], number> = { normal: 0, warning: 1, critical: 2 };

function syntheticWasteAlertMessage(bin: WasteBin, severity: Alert["severity"]): string {
  const v = Math.round(bin.fillLevel);
  if (severity === "critical") return `${bin.name} fill level CRITICAL: ${v}% (${bin.zone})`;
  return `${bin.name} fill level high (warning): ${v}% (${bin.zone})`;
}

const EMPTY_LIVE_BIN: WasteBin = {
  id: "bin1",
  name: LIVE_WASTE_BIN_NAME,
  zone: LIVE_WASTE_BIN_NAME,
  fillLevel: 0,
  lastCollected: "",
};

/**
 * Up to **15** bins: all Firestore `bins/*` docs (sorted by id, e.g. ESP8266 `bin1`…`bin3`), padded with simulated bins.
 * When Firestore is empty, **bin1** shows as MG Audi at 0% plus simulated **bin2**…**bin15**.
 */
export function useFirebaseWasteData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;

  const [realtimeBins, setRealtimeBins] = useState<WasteBin[]>([]);
  const [simBins, setSimBins] = useState<WasteBin[]>(() => (enabled ? initialSimulatedBins() : []));
  const [remoteAlerts, setRemoteAlerts] = useState<Alert[]>([]);
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);

  const prevSimSeverityRef = useRef<Map<string, Alert["severity"]>>(new Map());
  const simSeveritySeededRef = useRef(false);
  const prevLiveByIdRef = useRef<Map<string, Alert["severity"]>>(new Map());

  useEffect(() => {
    if (!enabled) {
      setRealtimeBins([]);
      setRemoteAlerts([]);
      setLocalAlerts([]);
      setSimBins([]);
      simSeveritySeededRef.current = false;
      prevSimSeverityRef.current.clear();
      prevLiveByIdRef.current.clear();
      return;
    }
    setRealtimeBins([]);
    setSimBins(initialSimulatedBins());
    simSeveritySeededRef.current = false;
    prevSimSeverityRef.current.clear();
    prevLiveByIdRef.current.clear();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const binsRef = collection(db, "bins");
    const alertsRef = collection(db, "alerts");

    const unsubscribeBins = onSnapshot(binsRef, (snapshot) => {
      if (snapshot.empty) {
        setRealtimeBins([]);
        return;
      }
      const sorted = [...snapshot.docs].sort((a, b) => a.id.localeCompare(b.id));
      setRealtimeBins(sorted.map((d) => wasteBinFromFirestoreDoc(d)));
    });

    const unsubscribeAlerts = onSnapshot(alertsRef, (snapshot) => {
      const formatted = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          if (!isWasteAlert(data)) return null;

          const moduleName = normalizeModule(data.module);
          const severity = normalizeSeverity(data.severity ?? data.status);
          const fillLevel = normalizeFillLevel(data);
          const zone = normalizeZone(data);
          const location = normalizeLocation(data);

          const alert: Alert = {
            id: docSnap.id,
            timestamp: toDate(data.timestamp),
            zone,
            module: (moduleName || "waste") as Alert["module"],
            severity,
            message: buildWasteAlertMessage(data, location, fillLevel, severity),
            value: fillLevel,
          };
          return alert;
        })
        .filter((a): a is Alert => a !== null)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setRemoteAlerts(formatted);
    });

    return () => {
      unsubscribeBins();
      unsubscribeAlerts();
    };
  }, [enabled]);

  /** Simulated bins (bin2-15): alert when fill severity worsens (fills empty feed when Firestore has no alerts). */
  useEffect(() => {
    if (!enabled) return;
    if (!simSeveritySeededRef.current) {
      for (const b of simBins) {
        prevSimSeverityRef.current.set(b.id, wasteSeverityFromFill(b.fillLevel));
      }
      simSeveritySeededRef.current = true;
      return;
    }
    const newOnes: Alert[] = [];
    for (const b of simBins) {
      const next = wasteSeverityFromFill(b.fillLevel);
      const prev = prevSimSeverityRef.current.get(b.id) ?? "normal";
      if (SEV_RANK[next] > SEV_RANK[prev]) {
        newOnes.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          zone: b.zone,
          module: "waste",
          severity: next,
          message: syntheticWasteAlertMessage(b, next),
          value: b.fillLevel,
        });
      }
      prevSimSeverityRef.current.set(b.id, next);
    }
    if (newOnes.length > 0) {
      setLocalAlerts((a) => [...newOnes, ...a].slice(0, 50));
    }
  }, [enabled, simBins]);

  /** Live Firestore bins: alert when any bin’s fill severity worsens (ESP `fillLevel` + CRITICAL/WARNING/NORMAL). */
  useEffect(() => {
    if (!enabled) return;
    const live = realtimeBins.length > 0 ? realtimeBins : [EMPTY_LIVE_BIN];
    for (const bin of live) {
      const next = wasteSeverityFromFill(bin.fillLevel);
      const prev = prevLiveByIdRef.current.get(bin.id) ?? "normal";
      if (SEV_RANK[next] > SEV_RANK[prev]) {
        setLocalAlerts((a) =>
          [
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              zone: bin.zone,
              module: "waste",
              severity: next,
              message: syntheticWasteAlertMessage(bin, next),
              value: bin.fillLevel,
            },
            ...a,
          ].slice(0, 50),
        );
      }
      prevLiveByIdRef.current.set(bin.id, next);
    }
    for (const id of prevLiveByIdRef.current.keys()) {
      if (!live.some((b) => b.id === id)) prevLiveByIdRef.current.delete(id);
    }
  }, [enabled, realtimeBins]);

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => {
      setSimBins((prev) =>
        prev.map((bin) => {
          const delta = randBetween(-2, 5);
          const newLevel = Math.min(100, Math.max(0, bin.fillLevel + delta));
          return { ...bin, fillLevel: Math.round(newLevel) };
        }),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [enabled]);

  const liveLayout = useMemo(() => {
    if (!enabled) return { live: [] as WasteBin[], simStart: 2, simCount: 0 };
    if (realtimeBins.length === 0) {
      return { live: [EMPTY_LIVE_BIN], simStart: 2, simCount: SIM_LOCATION_NAMES.length };
    }
    const maxN = maxBinNumericId(realtimeBins);
    return {
      live: realtimeBins,
      simStart: maxN + 1,
      simCount: Math.max(0, 15 - realtimeBins.length),
    };
  }, [enabled, realtimeBins]);

  useEffect(() => {
    if (!enabled) return;
    setSimBins(initialSimulatedBinsFrom(liveLayout.simStart, liveLayout.simCount));
    simSeveritySeededRef.current = false;
    prevSimSeverityRef.current.clear();
  }, [enabled, liveLayout.simStart, liveLayout.simCount]);

  const bins = useMemo(() => {
    if (!enabled) return [];
    return [...liveLayout.live, ...simBins];
  }, [enabled, liveLayout.live, simBins]);

  const criticalBins = bins.filter((b) => b.fillLevel > 90).length;
  const warningBins = bins.filter((b) => b.fillLevel >= 70 && b.fillLevel <= 90).length;
  const normalBins = bins.filter((b) => b.fillLevel < 70).length;

  const alerts = useMemo(() => {
    if (!enabled) return [];
    return [...remoteAlerts, ...localAlerts]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);
  }, [enabled, remoteAlerts, localAlerts]);

  return { bins, alerts, criticalBins, warningBins, normalBins };
}
