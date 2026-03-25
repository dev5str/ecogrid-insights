export interface IoTDevice {
  id: string;
  name: string;
  type: "electricity_meter" | "water_flow" | "water_leak" | "ultrasonic_bin" | "temperature" | "custom";
  protocol: "mqtt" | "http" | "websocket";
  endpoint: string;
  status: "online" | "offline" | "error";
  zone: string;
  lastSeen: Date;
  config: {
    threshold?: number;
    pollingInterval?: number;
    unit?: string;
  };
}

export interface DeviceReading {
  deviceId: string;
  timestamp: Date;
  value: number;
  unit: string;
  metadata?: Record<string, unknown>;
}

const API_BASE = "/api/v1";

export const deviceApi = {
  async getDevices(): Promise<IoTDevice[]> {
    try {
      const res = await fetch(`${API_BASE}/devices`);
      if (!res.ok) throw new Error("Failed to fetch devices");
      return res.json();
    } catch {
      return [];
    }
  },

  async addDevice(device: Omit<IoTDevice, "id" | "status" | "lastSeen">): Promise<IoTDevice | null> {
    try {
      const res = await fetch(`${API_BASE}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(device),
      });
      if (!res.ok) throw new Error("Failed to add device");
      return res.json();
    } catch {
      return null;
    }
  },

  async removeDevice(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/devices/${id}`, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getDeviceReadings(deviceId: string, limit = 50): Promise<DeviceReading[]> {
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}/readings?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch readings");
      return res.json();
    } catch {
      return [];
    }
  },

  async testConnection(endpoint: string, protocol: string): Promise<{ success: boolean; latency?: number }> {
    try {
      const res = await fetch(`${API_BASE}/devices/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, protocol }),
      });
      if (!res.ok) throw new Error("Connection test failed");
      return res.json();
    } catch {
      return { success: false };
    }
  },

  getWebSocketUrl(deviceId: string): string {
    const wsBase = window.location.origin.replace(/^http/, "ws");
    return `${wsBase}${API_BASE}/devices/${deviceId}/stream`;
  },

  async pushReading(deviceId: string, reading: Omit<DeviceReading, "deviceId" | "timestamp">): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reading),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateThresholds(deviceId: string, thresholds: Record<string, number>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}/thresholds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thresholds),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
