import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

function toDate(value) {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeSeverity(value) {
  const normalized = String(value || "normal").toLowerCase();
  if (["critical", "crit", "high"].includes(normalized)) return "critical";
  if (["warning", "warn", "medium", "med"].includes(normalized)) return "warning";
  if (["normal", "ok", "low"].includes(normalized)) return "normal";
  return "normal";
}

function normalizeModule(value) {
  return String(value || "").toLowerCase();
}

function normalizeFillLevel(data) {
  return Number(data.fillLevel ?? data.level ?? data.value ?? data.percentage ?? 0);
}

function normalizeZone(data) {
  return data.zone || data.location || data.area || data.site || "Unknown Zone";
}

function normalizeLocation(data) {
  if (data.location) return data.location;
  if (data.zone) return data.zone;
  if (data.area) return data.area;
  if (data.site) return data.site;
  if (data.block && data.floor) return `${data.block}, ${data.floor}`;
  return "Unknown Location";
}

function buildWasteAlertMessage(data, location, fillLevel, severity) {
  if (data.message) return data.message;

  const binLabel = data.binId || data.binName || data.bin || data.id || "Bin";
  const roundedLevel = Number.isFinite(fillLevel) ? Math.round(fillLevel) : 0;

  if (severity === "critical") {
    return `${binLabel} at ${location} is critical at ${roundedLevel}%`;
  }

  if (severity === "warning") {
    return `${binLabel} at ${location} is MED at ${roundedLevel}%`;
  }

  return `${binLabel} at ${location} is LOW at ${roundedLevel}%`;
}

function isWasteAlert(data) {
  const moduleName = normalizeModule(data.module);
  if (moduleName === "waste") return true;

  // Some docs omit module but still carry bin/waste-specific fields.
  return Boolean(data.binId || data.binName || data.fillLevel || data.level || data.percentage);
}

export function useWasteData() {
  const [bins, setBins] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const binsRef = collection(db, "bins");
    const alertsRef = collection(db, "alerts");

    const unsubscribeBins = onSnapshot(binsRef, (snapshot) => {
      const formatted = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          name: data.name || data.binName || data.binId || doc.id,
          fillLevel: normalizeFillLevel(data),
          status: data.status || "NORMAL",
          zone: normalizeZone(data),
          location: normalizeLocation(data),
          lastCollected: data.lastCollected || "",
        };
      });

      setBins(formatted);
    });

    const unsubscribeAlerts = onSnapshot(alertsRef, (snapshot) => {
  const formatted = snapshot.docs
    .map((doc) => {
      const data = doc.data();

      // 🔥 Filter early (correct way)
      if (!isWasteAlert(data)) return null;

      const moduleName = normalizeModule(data.module);
      const severity = normalizeSeverity(data.severity || data.status);
      const fillLevel = normalizeFillLevel(data);
      const zone = normalizeZone(data);
      const location = normalizeLocation(data);

      return {
        id: doc.id,
        timestamp: toDate(data.timestamp),
        zone,
        location,
        module: moduleName || "waste",
        severity,
        message: buildWasteAlertMessage(data, location, fillLevel, severity),
        value: fillLevel,
      };
    })
    .filter(Boolean) // remove nulls safely
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