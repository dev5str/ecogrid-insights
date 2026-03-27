import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Alert, WasteBin } from "@/hooks/useSimulatedData";

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

/**
 * Live waste bins + alerts from Firestore (`bins`, `alerts`), ported from `origin/bin`.
 * Head dashboard keeps simulated `useWasteData` from `useSimulatedData`.
 */
export function useFirebaseWasteData() {
  const [bins, setBins] = useState<WasteBin[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const binsRef = collection(db, "bins");
    const alertsRef = collection(db, "alerts");

    const unsubscribeBins = onSnapshot(binsRef, (snapshot) => {
      const formatted: WasteBin[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          zone: normalizeZone(data),
          fillLevel: normalizeFillLevel(data),
          lastCollected:
            typeof data.lastCollected === "string"
              ? data.lastCollected
              : data.lastCollected instanceof Date
                ? data.lastCollected.toLocaleString()
                : "",
        };
      });
      setBins(formatted);
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

      setAlerts(formatted);
    });

    return () => {
      unsubscribeBins();
      unsubscribeAlerts();
    };
  }, []);

  const criticalBins = bins.filter((b) => b.fillLevel > 90).length;
  const warningBins = bins.filter((b) => b.fillLevel >= 70 && b.fillLevel <= 90).length;
  const normalBins = bins.filter((b) => b.fillLevel < 70).length;

  return { bins, alerts, criticalBins, warningBins, normalBins };
}
