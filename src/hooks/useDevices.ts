import { useState, useCallback } from "react";
import type { IoTDevice } from "@/lib/api";

const DEMO_DEVICES: IoTDevice[] = [
  {
    id: "dev-001",
    name: "Main Building Power Meter",
    type: "electricity_meter",
    protocol: "mqtt",
    endpoint: "mqtt://campus-iot.local:1883/sensors/elec/main",
    status: "online",
    zone: "Zone A",
    lastSeen: new Date(),
    config: { threshold: 340, pollingInterval: 5000, unit: "kW" },
  },
  {
    id: "dev-002",
    name: "Library Flow Sensor",
    type: "water_flow",
    protocol: "http",
    endpoint: "http://192.168.1.45/api/reading",
    status: "online",
    zone: "Zone B",
    lastSeen: new Date(),
    config: { threshold: 75, pollingInterval: 5000, unit: "L/min" },
  },
  {
    id: "dev-003",
    name: "Cafeteria Bin Sensor",
    type: "ultrasonic_bin",
    protocol: "mqtt",
    endpoint: "mqtt://campus-iot.local:1883/sensors/waste/caf-01",
    status: "online",
    zone: "Zone C",
    lastSeen: new Date(),
    config: { threshold: 90, pollingInterval: 10000, unit: "%" },
  },
  {
    id: "dev-004",
    name: "Hostel Water Leak Detector",
    type: "water_leak",
    protocol: "websocket",
    endpoint: "ws://192.168.1.80:8080/leak-sensor",
    status: "offline",
    zone: "Zone D",
    lastSeen: new Date(Date.now() - 3600000),
    config: { threshold: 1, pollingInterval: 2000, unit: "boolean" },
  },
  {
    id: "dev-005",
    name: "Lab Building Sub-Meter",
    type: "electricity_meter",
    protocol: "http",
    endpoint: "http://192.168.1.60/api/v1/meter",
    status: "online",
    zone: "Zone E",
    lastSeen: new Date(),
    config: { threshold: 280, pollingInterval: 5000, unit: "kW" },
  },
];

export function useDevices() {
  const [devices, setDevices] = useState<IoTDevice[]>(DEMO_DEVICES);
  const [isAdding, setIsAdding] = useState(false);

  const addDevice = useCallback((device: Omit<IoTDevice, "id" | "status" | "lastSeen">) => {
    const newDevice: IoTDevice = {
      ...device,
      id: `dev-${String(Date.now()).slice(-6)}`,
      status: "online",
      lastSeen: new Date(),
    };
    setDevices((prev) => [...prev, newDevice]);
    return newDevice;
  }, []);

  const removeDevice = useCallback((id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const toggleDeviceStatus = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: d.status === "online" ? "offline" : "online", lastSeen: new Date() }
          : d
      )
    );
  }, []);

  const updateDeviceConfig = useCallback((id: string, config: Partial<IoTDevice["config"]>) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, config: { ...d.config, ...config } } : d
      )
    );
  }, []);

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status !== "online").length;

  return {
    devices,
    addDevice,
    removeDevice,
    toggleDeviceStatus,
    updateDeviceConfig,
    isAdding,
    setIsAdding,
    onlineCount,
    offlineCount,
  };
}
