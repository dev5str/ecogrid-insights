# EcoGrid : Project documentation

This document describes the **EcoGrid Insights** web application: what it does, how it is built, what is **real** versus **simulated**, and how to connect **Arduino + ultrasonic sensors** for **waste bin fill level** monitoring. Use it as the single reference for developers and field hardware setup.

---

## 1. What is EcoGrid?

**EcoGrid** is a **frontend-only** institutional dashboard for **environmental IoT monitoring**. It presents:

- **Electricity** : power load trends and alerts  
- **Water** : flow rates and anomaly-style alerts  
- **Waste** : per-bin **fill level** (0–100%) and status  

The product narrative targets **campuses, hospitals, and large facilities** that want one place to see resource usage and alerts.

**Important:** This repository ships a **React (Vite) SPA**. There is **no production backend** bundled here. Charts, gauges, alerts, and most “live” numbers are driven by **client-side simulations** so the UI can be demonstrated without hardware.

---

## 2. Repository layout (high level)

| Area | Role |
|------|------|
| `src/App.tsx` | Routes: marketing pages, login, dashboards under `/dashboard/*` |
| `src/pages/` | Landing, About, Contact, Login, module dashboards (`Electricity`, `Water`, `Waste`, `Head`), Devices |
| `src/components/dashboard/` | Shared dashboard UI: `StatusCard`, `AlertFeed`, `TopBar`, `DashboardSidebar` |
| `src/hooks/useSimulatedData.ts` | **Simulated** electricity, water, waste data and alerts |
| `src/hooks/useDevices.ts` | **Demo** device list (local state); not persisted to a server |
| `src/lib/api.ts` | **API client stubs** : `fetch` calls to `/api/v1/...` that return empty/fail until a real API exists |
| `src/contexts/AuthContext.tsx` | **Demo auth** : “login” picks a role; no passwords or JWT |
| `vercel.json` | Static build output + SPA rewrites for hosting |

---

## 3. What is simulated vs what is designed for real hardware?

### 3.1 Fully simulated in this app (no live sensors)

These modules use **`useSimulatedData`** (`src/hooks/useSimulatedData.ts`):

| Module | What you see | Reality in this repo |
|--------|----------------|----------------------|
| **Electricity** | Time series, kW, peaks, alerts | Randomized / interval-updated **fake** data |
| **Water** | Flow (L/min), “anomalies”, charts | Same : **simulation** |
| **Waste (dashboard view)** | Bin IDs, zones, fill %, gauges | **Random fill levels** per render interval : **not** from ultrasonic hardware |

**Alerts** on these modules are generated from **simulated thresholds** (e.g. electricity kW, water L/min, waste fill %), not from a database or MQTT.

### 3.2 “Devices” page and `deviceApi`

- **`useDevices`** seeds a **fixed demo list** of fake devices (MQTT/HTTP/WebSocket endpoints as strings). You can add/remove rows in the UI; state lives **in memory** until refresh.
- **`deviceApi`** in `src/lib/api.ts` is written as if a backend existed at **`/api/v1/*`**. In a static deploy, those requests **fail or return empty** unless you add a **reverse proxy + API server** or serverless functions.

So: **the UI is ready for integration**, but **telemetry is not wired end-to-end** in this project.

### 3.3 Authentication

- Login is **role selection only** (Electricity / Water / Waste / Head).  
- There are **no real credentials**, sessions, or OAuth.

---

## 4. Intended API contract (for a future backend)

When you implement a backend, these shapes match the frontend stubs in `src/lib/api.ts`:

- `GET /api/v1/devices` : list devices  
- `POST /api/v1/devices` : register device  
- `POST /api/v1/devices/:id/readings` : **push a reading** (JSON body includes `value`, `unit`, optional `metadata`)  
- `GET /api/v1/devices/:id/readings?limit=50` : history  
- `WebSocket` `/api/v1/devices/:id/stream` : optional live stream  

**Waste bin fill** should use **`unit: "%"`** and **`value` between 0 and 100** for the dashboard concept to align.

---

## 5. Waste bins: Arduino + ultrasonic sensor (hardware guide)

This is the **only module** this document describes in **hardware detail**, because it is the most straightforward to build with common parts. **Electricity and water** in the current app remain **simulations** until you connect real meters and pipe that data through your API.

### 5.1 Principle

An **ultrasonic sensor** (e.g. **HC-SR04**) measures **time-of-flight** of a sound pulse and converts it to **distance** (cm). Mount the sensor **above the bin opening**, pointing **downward** toward the waste surface.

- **Bin more empty** → trash surface is **farther** → **larger** distance reading.  
- **Bin more full** → surface **closer** → **smaller** distance.

You map that distance to **fill percentage (0–100%)** using calibration (empty vs full).

### 5.2 Parts (example)

| Item | Notes |
|------|--------|
| Arduino Uno / Nano / **ESP32** | ESP32 adds **Wi‑Fi** for HTTP/MQTT without extra shields |
| HC-SR04 ultrasonic | 5V logic; 3.3V on ESP32 often needs voltage divider on **Echo** |
| Power | USB or 5V supply; keep sensor within rated range |
| Enclosure | Protect sensor from moisture and direct trash contact |

### 5.3 Wiring (HC-SR04 → Arduino 5V boards)

- **VCC** → 5V  
- **GND** → GND  
- **Trig** → digital pin (e.g. D12)  
- **Echo** → digital pin (e.g. D11)  

On **ESP32 (3.3V GPIO)**, use level shifting or a divider on **Echo** to avoid damaging the pin.

### 5.4 Calibration concept

1. Measure **distance** when the bin is **known empty** → `d_empty` (cm).  
2. Measure **distance** when the bin is **known full** (or as full as policy allows) → `d_full` (cm).  

Typically `d_full < d_empty` (surface rises when full).

Linear mapping (clamp to 0–100):

```text
fillPercent = 100 * (d_empty - d) / (d_empty - d_full)
```

- If `d >= d_empty` → 0%  
- If `d <= d_full` → 100%  
- Values in between interpolate  

Store `d_empty` and `d_full` in **EEPROM** or config after a calibration routine on site.

### 5.5 Software flow on the microcontroller

1. Read ultrasonic distance **every N seconds** (e.g. 10–60 s) to avoid noise and save power.  
2. **Median filter** (e.g. 5 samples) to reject spikes.  
3. Convert distance → **fill %** with the formula above.  
4. Optional: treat readings outside `[d_full - margin, d_empty + margin]` as errors.  
5. Send JSON to your backend, e.g.:

```json
{
  "value": 72.5,
  "unit": "%",
  "metadata": { "rawCm": 42.3, "binId": "caf-01" }
}
```

POST to `POST /api/v1/devices/<deviceId>/readings` once your API exists.

### 5.6 Example: minimal Arduino-style loop (illustrative)

This is **pseudocode** for clarity; adapt pins, libraries, and Wi‑Fi for your board.

```cpp
// Illustrative only : not a complete production sketch.
const float dEmpty = 55.0;  // cm, calibrated
const float dFull  = 15.0;  // cm, calibrated

float readDistanceCm() {
  // Trigger pulse, measure echo duration, convert to cm
  // return distance;
  return 30.0f; // placeholder
}

float toFillPercent(float d) {
  if (d >= dEmpty) return 0.f;
  if (d <= dFull) return 100.f;
  return 100.f * (dEmpty - d) / (dEmpty - dFull);
}

void loop() {
  float d = readDistanceCm();
  float fill = toFillPercent(d);
  // send fill to API/MQTT when you add networking
  delay(30000);
}
```

For **ESP32**, use **WiFiClient** or **PubSubClient** (MQTT) or **HTTPClient** to forward `fill` to your server.

### 5.7 Reliability notes (field deployment)

- **Lid geometry:** stray echoes from walls can skew readings; test mounting height and angle.  
- **Soft waste:** surface uneven → average multiple samples.  
- **Steam / high humidity:** can affect ultrasonics; consider enclosure or different sensing technology for harsh environments.  
- **Safety:** electronics outside the waste stream; avoid contact with liquids unless IP-rated.

### 5.8 Connecting this UI to real waste data

**Waste dashboard (`/dashboard/waste`)** uses **`useFirebaseWasteData`** (`src/hooks/useFirebaseWasteData.ts`) with **Firestore**:

- The UI shows **15 bins** with fixed display names: **`bin1`** is labeled **MG Audi** and driven by the **first** Firestore document (sorted by document id); **`bin2` through `bin15`** are **simulated** with campus-style names (library, labs, hostel, cafeteria, etc.) plus **North Campus Bus Stand**, **City Railway Station**, and **International Airport T2**. If there are no `bins` docs, **MG Audi** shows **0%** as a placeholder.  
- Collection **`bins`**: documents with fill fields such as `fillLevel`, `level`, `value`, or `percentage`; optional `zone`, `location`, `name`, `lastCollected`, etc.  
- Collection **`alerts`**: waste-related docs (`module: "waste"` or bin-style fields) are merged into the feed with **locally generated alerts** when simulated bins (or live `bin1`) cross from normal into warning or critical, so the panel is not empty if Firestore has no alert documents yet.

Firebase is initialized in **`src/lib/firebase.ts`** (same project as branch `origin/bin`).

**Head dashboard** still uses **`useWasteData`** from **`useSimulatedData.ts`** for a consolidated **simulated** waste summary alongside electricity and water.

---

## 6. Electricity and water (simulation only in this repo)

- **Electricity:** simulated kW series and alerts : **not** tied to Modbus/Smart meters.  
- **Water:** simulated L/min and “anomaly” flags : **not** tied to flow meters.  

Integrating real devices would require the same pattern: **physical sensor → gateway → your API** → frontend polling or streaming.

### 6.1 System power switches

The dashboard **top bar** has a **Systems** control (next to the status text) with toggles for **Electricity**, **Water**, **Waste**, and **Air purifier**. When a system is **off**, that module **stops updating** (no simulation ticks, no Firestore listeners for waste), and its page shows an **offline** placeholder. The **LIVE / OFF** label reflects the current route’s module, or any module on for the **Head** overview. Choices are saved in **localStorage** under `ecogrid-systems-on`.

---

## 7. Local development

```bash
pnpm install
pnpm dev
```

Default Vite port is defined in `vite.config.ts` (often `8080`).

```bash
pnpm run build   # production bundle in dist/
pnpm run lint
pnpm test        # vitest
```

---

## 8. Deployment

The project is **Vercel-oriented** (`vercel.json`): static **`dist`** output and SPA **rewrites** so `/dashboard/...` routes work on refresh.

Environment variables are **not required** for the demo app. If you add a real API, use `VITE_*` prefixed variables and `import.meta.env` in Vite.

---

## 9. Summary table

| Feature | In this repo |
|---------|----------------|
| Marketing site, login UI, dashboards | Yes |
| Real electricity / water telemetry | **No** : simulated |
| Real waste telemetry | **No** : simulated; **hardware section above** describes how *you* can build it |
| Backend API | **Stubs only** : implement separately |
| Auth | **Demo role picker** |

---

## 10. Document history

This file is maintained alongside the application. When you add a real backend or replace simulations with API calls, update **§3**, **§5.8**, and **§9** accordingly.
