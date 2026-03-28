import { useState, useEffect, useCallback, useRef } from "react";

export interface Alert {
  id: string;
  timestamp: Date;
  zone: string;
  module: "electricity" | "water" | "waste";
  severity: "normal" | "warning" | "critical";
  message: string;
  value: number;
}

export interface ElectricityReading {
  time: string;
  consumption: number;
  zone: string;
}

export interface WaterReading {
  time: string;
  flowRate: number;
  zone: string;
  anomaly: boolean;
}

export interface WasteBin {
  id: string;
  /** Short label for UI (gauges, alerts). */
  name: string;
  zone: string;
  fillLevel: number;
  lastCollected: string;
}

const ZONES = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"];

function randBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function timeLabel(offsetMinutes: number): string {
  const d = new Date(Date.now() - offsetMinutes * 60000);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function generateElectricityHistory(): ElectricityReading[] {
  const data: ElectricityReading[] = [];
  for (let i = 29; i >= 0; i--) {
    data.push({
      time: timeLabel(i * 5),
      consumption: randBetween(120, 380),
      zone: ZONES[Math.floor(Math.random() * ZONES.length)],
    });
  }
  return data;
}

function generateWaterHistory(): WaterReading[] {
  const data: WaterReading[] = [];
  for (let i = 29; i >= 0; i--) {
    const flowRate = randBetween(15, 85);
    data.push({
      time: timeLabel(i * 5),
      flowRate,
      zone: ZONES[Math.floor(Math.random() * ZONES.length)],
      anomaly: flowRate > 75 || flowRate < 20,
    });
  }
  return data;
}

function generateWasteBins(): WasteBin[] {
  return ZONES.flatMap((zone) =>
    Array.from({ length: 3 }, (_, i) => {
      const id = `${zone}-Bin-${i + 1}`;
      return {
        id,
        name: id,
        zone,
        fillLevel: randBetween(10, 98),
        lastCollected: new Date(Date.now() - randBetween(1, 48) * 3600000).toLocaleString(),
      };
    }),
  );
}

function getSeverity(module: string, value: number): "normal" | "warning" | "critical" {
  if (module === "electricity") {
    if (value > 340) return "critical";
    if (value > 280) return "warning";
    return "normal";
  }
  if (module === "water") {
    if (value > 75 || value < 18) return "critical";
    if (value > 60 || value < 22) return "warning";
    return "normal";
  }
  // waste
  if (value > 90) return "critical";
  if (value > 70) return "warning";
  return "normal";
}

export function useElectricityData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const [data, setData] = useState<ElectricityReading[]>(() => (enabled ? generateElectricityHistory() : []));
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setAlerts([]);
      return;
    }
    setData(generateElectricityHistory());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setData((prev) => {
        const newReading: ElectricityReading = {
          time: timeLabel(0),
          consumption: randBetween(120, 400),
          zone: ZONES[Math.floor(Math.random() * ZONES.length)],
        };
        const severity = getSeverity("electricity", newReading.consumption);
        if (severity !== "normal") {
          setAlerts((a) => [
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              zone: newReading.zone,
              module: "electricity",
              severity,
              message: `Power consumption ${severity === "critical" ? "CRITICAL" : "high"}: ${newReading.consumption} kW in ${newReading.zone}`,
              value: newReading.consumption,
            },
            ...a.slice(0, 49),
          ]);
        }
        return [...prev.slice(1), newReading];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [enabled]);

  const currentLoad = data[data.length - 1]?.consumption ?? 0;
  const peakToday = data.length ? Math.max(...data.map((d) => d.consumption)) : 0;
  const avgConsumption = data.length ? Math.round(data.reduce((s, d) => s + d.consumption, 0) / data.length) : 0;

  return { data, alerts, currentLoad, peakToday, avgConsumption };
}

export function useWaterData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const [data, setData] = useState<WaterReading[]>(() => (enabled ? generateWaterHistory() : []));
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setAlerts([]);
      return;
    }
    setData(generateWaterHistory());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setData((prev) => {
        const flowRate = randBetween(12, 90);
        const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
        const newReading: WaterReading = {
          time: timeLabel(0),
          flowRate,
          zone,
          anomaly: flowRate > 75 || flowRate < 18,
        };
        const severity = getSeverity("water", flowRate);
        if (severity !== "normal") {
          setAlerts((a) => [
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              zone,
              module: "water",
              severity,
              message: newReading.anomaly
                ? `Leak detected! Flow rate ${flowRate} L/min in ${zone}`
                : `Flow rate ${severity}: ${flowRate} L/min in ${zone}`,
              value: flowRate,
            },
            ...a.slice(0, 49),
          ]);
        }
        return [...prev.slice(1), newReading];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [enabled]);

  const currentFlow = data[data.length - 1]?.flowRate ?? 0;
  const anomalyCount = data.filter((d) => d.anomaly).length;

  return { data, alerts, currentFlow, anomalyCount };
}

export function useWasteData(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const [bins, setBins] = useState<WasteBin[]>(() => (enabled ? generateWasteBins() : []));
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!enabled) {
      setBins([]);
      setAlerts([]);
      return;
    }
    setBins(generateWasteBins());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setBins((prev) =>
        prev.map((bin) => {
          const delta = randBetween(-2, 5);
          const newLevel = Math.min(100, Math.max(0, bin.fillLevel + delta));
          const severity = getSeverity("waste", newLevel);
          if (severity !== "normal" && getSeverity("waste", bin.fillLevel) === "normal") {
            setAlerts((a) => [
              {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                zone: bin.zone,
                module: "waste",
                severity,
                message: `${bin.name} fill level ${severity === "critical" ? "CRITICAL" : "high"}: ${Math.round(newLevel)}%`,
                value: newLevel,
              },
              ...a.slice(0, 49),
            ]);
          }
          return { ...bin, fillLevel: Math.round(newLevel) };
        }),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [enabled]);

  const criticalBins = bins.filter((b) => b.fillLevel > 90).length;
  const warningBins = bins.filter((b) => b.fillLevel > 70 && b.fillLevel <= 90).length;
  const normalBins = bins.filter((b) => b.fillLevel <= 70).length;

  return { bins, alerts, criticalBins, warningBins, normalBins };
}
