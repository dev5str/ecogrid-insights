import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SystemModule = "electricity" | "water" | "waste" | "air";

export const SYSTEM_MODULES: SystemModule[] = ["electricity", "water", "waste", "air"];

const STORAGE_KEY = "ecogrid-systems-on";

const MODULE_LABELS: Record<SystemModule, string> = {
  electricity: "Electricity",
  water: "Water",
  waste: "Waste",
  air: "Air purifier",
};

const DEFAULT_ON: Record<SystemModule, boolean> = {
  electricity: true,
  water: true,
  waste: true,
  air: true,
};

function loadStored(): Record<SystemModule, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ON };
    const parsed = JSON.parse(raw) as Partial<Record<SystemModule, boolean>>;
    return {
      electricity: parsed.electricity !== false,
      water: parsed.water !== false,
      waste: parsed.waste !== false,
      air: parsed.air !== false,
    };
  } catch {
    return { ...DEFAULT_ON };
  }
}

interface SystemPowerContextValue {
  isOn: (module: SystemModule) => boolean;
  setOn: (module: SystemModule, on: boolean) => void;
  labels: typeof MODULE_LABELS;
}

const SystemPowerContext = createContext<SystemPowerContextValue | null>(null);

export function SystemPowerProvider({ children }: { children: React.ReactNode }) {
  const [power, setPower] = useState<Record<SystemModule, boolean>>(loadStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(power));
  }, [power]);

  const setOn = useCallback((module: SystemModule, on: boolean) => {
    setPower((p) => ({ ...p, [module]: on }));
  }, []);

  const isOn = useCallback((module: SystemModule) => power[module], [power]);

  const value = useMemo(
    () => ({ isOn, setOn, labels: MODULE_LABELS }),
    [isOn, setOn],
  );

  return <SystemPowerContext.Provider value={value}>{children}</SystemPowerContext.Provider>;
}

export function useSystemPower() {
  const ctx = useContext(SystemPowerContext);
  if (!ctx) throw new Error("useSystemPower must be used within SystemPowerProvider");
  return ctx;
}

export { MODULE_LABELS };
