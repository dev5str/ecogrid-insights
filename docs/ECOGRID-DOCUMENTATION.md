# EcoGrid Insights: Complete Project Documentation

Single reference for **developers**, **operators**, and **hardware integrators**. It covers architecture, features, simulation vs live data, local AI (Ollama), Firebase waste bins, environment configuration, deployment, and Arduino-style waste sensing.

---

## Table of contents

1. [What is EcoGrid Insights?](#1-what-is-ecogrid-insights)
2. [Feature overview](#2-feature-overview)
3. [Technology stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Repository layout](#5-repository-layout)
6. [Routing](#6-routing)
7. [Authentication and roles](#7-authentication-and-roles)
8. [Data sources: simulated, Firestore, and future API](#8-data-sources-simulated-firestore-and-future-api)
9. [System power toggles](#9-system-power-toggles)
10. [Sustainability, CSV exports, and Ollama compliance drafts](#10-sustainability-csv-exports-and-ollama-compliance-drafts)
11. [Campus engagement](#11-campus-engagement)
12. [Zone telemetry and dashboards](#12-zone-telemetry-and-dashboards)
13. [Environment variables](#13-environment-variables)
14. [Local development](#14-local-development)
15. [Build, test, and lint](#15-build-test-and-lint)
16. [Deployment](#16-deployment)
17. [Future backend API contract](#17-future-backend-api-contract)
18. [Waste bins: Firestore integration](#18-waste-bins-firestore-integration)
19. [Waste bins: Arduino and ultrasonic sensor (hardware)](#19-waste-bins-arduino-and-ultrasonic-sensor-hardware)
20. [Security and privacy notes](#20-security-and-privacy-notes)
21. [Maintaining this document](#21-maintaining-this-document)

---

## 1. What is EcoGrid Insights?

**EcoGrid Insights** is a **React single-page application (SPA)** for **institutional environmental monitoring**. It presents electricity load, water flow, waste fill levels, indoor air proxies, sustainability scoring, and campus engagement in one branded dashboard experience.

**Important:** The repository ships **no production backend**. Most telemetry is **client-side simulation** so demos work without hardware. **Waste** can optionally read **Firebase Firestore**. **Compliance narrative** generation uses **local Ollama** (default model `llava`) via HTTP.

Target users: **campuses, hospitals, and large facilities** consolidating resource metrics and alerts.

---

## 2. Feature overview

| Area | Description |
|------|-------------|
| **Marketing** | Landing, About, How it works, Modules, Contact |
| **Login** | Role selection (no real passwords) |
| **Electricity / Water / Waste** | Per-module dashboards with charts, status cards, alerts, zone-style breakdowns (where implemented) |
| **Head** | Consolidated overview, comparative analytics, cross-module alerts |
| **Air** | Separate layout route `/air` for air-quality / purifier style dashboard |
| **Devices** | Demo device registry (in-memory); prepared for future REST/WebSocket backends |
| **Sustainability** | Eco score views, charts, CSV exports, **Generate printable report** (Ollama draft + browser print / PDF) |
| **Campus** | Student-oriented engagement UI (simulated validations, points, notes) |
| **System controls** | Top bar **Systems** popover: enable/disable electricity, water, waste, air updates |

---

## 3. Technology stack

| Layer | Choices |
|-------|---------|
| **Runtime** | TypeScript, ES modules (`"type": "module"`) |
| **Framework** | React 18, Vite 5 |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS, `tailwindcss-animate`, `@tailwindcss/typography` |
| **UI components** | shadcn/ui (Radix primitives), custom dashboard components |
| **Charts** | Recharts |
| **Motion** | `motion` (Motion for React) |
| **Forms / validation** | `react-hook-form`, `zod`, `@hookform/resolvers` |
| **Icons** | `lucide-react` |
| **Firebase** | Firestore for optional live waste bin documents |
| **Local LLM** | Ollama HTTP API (`/api/chat`) |
| **Dev tooling** | ESLint 9, Vitest, Playwright (config present), optional `@21st-extension/toolbar` in dev |

**Note:** **TanStack React Query** is **not** used in the current app tree; state is React context and hooks.

---

## 4. Architecture

```
Browser (React SPA)
  ├── Marketing routes (public)
  ├── /login → AuthContext (in-memory user + role)
  └── Protected /dashboard/* and /air
        ├── SystemPowerContext (which modules are "on")
        ├── DashboardLayout + TopBar + Sidebar
        └── Page-level hooks:
              useSimulatedData (electricity, water, simulated waste for Head)
              useFirebaseWasteData (waste dashboard live bins)
              useZoneTelemetry / useSustainabilitySimulation / useCampusEngagement (feature hooks)
```

- **No global server** in-repo: `fetch` to Ollama in production hits the browser origin or configured `VITE_OLLAMA_URL`; in **development**, Vite proxies `/api/ollama/*` to Ollama to reduce CORS friction.
- **Firebase** initializes from `src/firebase.js`; waste listener lives in `useFirebaseWasteData`.

---

## 5. Repository layout

| Path | Role |
|------|------|
| `src/App.tsx` | Route table |
| `src/main.tsx` | React root; optional Stagewise toolbar in dev |
| `src/pages/` | Page components (dashboards, marketing, login) |
| `src/components/dashboard/` | `DashboardLayout`, `TopBar`, `DashboardSidebar`, `StatusCard`, `AlertFeed`, `ZoneBreakdown`, etc. |
| `src/components/ui/` | shadcn-style primitives, charts, motion helpers |
| `src/components/brand/` | Logo component |
| `src/contexts/` | `AuthContext`, `SystemPowerContext`, `CampusEngagementContext` |
| `src/hooks/` | `useSimulatedData`, `useFirebaseWasteData`, `useDevices`, `useZoneTelemetry`, `useSustainabilitySimulation`, `useCampusEngagement`, etc. |
| `src/lib/` | `utils`, `api` stubs, `csvExport`, `geminiComplianceReport` (Ollama compliance narrative), `compliancePrint`, `campusZones`, etc. |
| `src/firebase.js` | Firebase app, Firestore `db`, Analytics |
| `public/` | Static assets (favicon, fonts, logo) |
| `vite.config.ts` | Aliases, dev server, **Ollama dev proxy** |
| `vercel.json` | SPA rewrites for static hosting |
| `docs/ECOGRID-DOCUMENTATION.md` | This file |

---

## 6. Routing

| Path | Access | Purpose |
|------|--------|---------|
| `/` | Public | Landing |
| `/about`, `/how-it-works`, `/modules`, `/contact` | Public | Marketing |
| `/login` | Public | Role picker |
| `/dashboard/electricity` | Protected | Electricity dashboard |
| `/dashboard/water` | Protected | Water dashboard |
| `/dashboard/waste` | Protected | Waste dashboard (Firestore + simulated mix) |
| `/dashboard/head` | Protected | Head overview |
| `/dashboard/devices` | Protected | Devices page |
| `/dashboard/sustainability` | Protected | Sustainability / eco score / exports / compliance tab |
| `/dashboard/campus` | Protected | Campus engagement |
| `/air` | Protected | Air dashboard (nested layout) |
| `*` | Public | Not found |

**Redirects after login** are role-based (see `Login.tsx`: e.g. student → `/dashboard/campus`, air → `/air`).

---

## 7. Authentication and roles

- **Implementation:** `src/contexts/AuthContext.tsx`
- **Behavior:** Choosing a role sets a **synthetic user** (name + role). There is **no password**, **no JWT**, **no persistence** by default beyond the session.
- **Roles:** `electricity`, `water`, `waste`, `air`, `head`, `student`

**Sidebar menus** are defined in `DashboardSidebar.tsx` per role. **Student** currently sees **Campus** only (no Sustainability link in the sidebar; other roles include Eco Score, Devices, etc., as configured).

**Top bar:** Branding link to home was removed from the top bar in favor of sidebar + controls; user chip and logout remain.

---

## 8. Data sources: simulated, Firestore, and future API

### 8.1 Simulated modules (`useSimulatedData`)

Used for **electricity**, **water**, and **waste** in contexts that do not use Firestore (e.g. Head overview waste summary). Data updates on timers when the module is **on** in `SystemPowerContext`.

### 8.2 Waste dashboard (`useFirebaseWasteData`)

`/dashboard/waste` uses **Firestore** for live bin documents plus **synthetic** bins for demo completeness. See [§18](#18-waste-bins-firestore-integration).

### 8.3 Devices (`useDevices` + `src/lib/api.ts`)

Devices are **demo state** in memory. `deviceApi` targets `/api/v1/...` and returns empty or fails until a real API or proxy exists.

---

## 9. System power toggles

- **Context:** `SystemPowerContext`
- **UI:** Top bar **Systems** popover (hidden for **student** role)
- **Behavior:** When a module is **off**, its simulation/listeners stop and the module page can show an offline state. Preferences are stored in **localStorage** (`ecogrid-systems-on`).
- **LIVE / OFF** indicator reflects the current route module or aggregate state on Head.

---

## 10. Sustainability, CSV exports, and Ollama compliance drafts

- **Page:** `src/pages/SustainabilityInsightsPage.tsx`
- **Metrics:** Driven by sustainability simulation hooks and UI state (leaderboard, carbon story, etc.).
- **CSV:** `src/lib/csvExport.ts` (and related helpers) for downloadable extracts where exposed in the UI.
- **Compliance narrative:** `src/lib/geminiComplianceReport.ts` (name is historical) calls **Ollama**:
  - **Development:** `POST /api/ollama/api/chat` → Vite proxy → `OLLAMA_HOST` or `VITE_OLLAMA_URL` or `http://127.0.0.1:11434`
  - **Production build:** `POST {VITE_OLLAMA_URL}/api/chat` (default base `http://127.0.0.1:11434` if unset)
  - **Model:** `VITE_OLLAMA_MODEL` or default **`llava`**
- **Print / PDF:** `src/lib/compliancePrint.ts` opens a print window with escaped HTML. The **Source** line was removed from the AI-assisted template; narrative text is passed through `stripNarrativeForPrint` to remove leading `## ` and `- ` prefixes per line for cleaner print output.

**Prerequisites for compliance generation:**

```bash
ollama pull llava   # or set VITE_OLLAMA_MODEL to another tag
ollama serve        # if not running as a service
```

For long **text-only** drafts, a text-focused model (e.g. `llama3.2`) may behave better than `llava`.

---

## 11. Campus engagement

- **Page:** `src/pages/CampusEngagementPage.tsx`
- **State:** `CampusEngagementContext` / `useCampusEngagement` for demo flows (reports, points, simulated photo attach, etc.).
- **Copy:** `src/hooks/useCampusEngagement.ts` includes preset report types and messages.

---

## 12. Zone telemetry and dashboards

Several dashboards use **zone breakdown** components and hooks such as `useZoneTelemetry` and `ZoneBreakdown` / `SegmentedProgress` for multi-zone views (electricity, water, air). Values remain **simulated** unless wired to a backend.

---

## 13. Environment variables

Vite exposes only variables prefixed with **`VITE_`** to client code (except values read only in `vite.config.ts` / Node).

| Variable | Used for |
|----------|----------|
| `VITE_OLLAMA_URL` | Ollama base URL in production builds (e.g. `http://127.0.0.1:11434`) |
| `VITE_OLLAMA_MODEL` | Ollama model tag (default in code: `llava`) |
| `OLLAMA_HOST` | Dev proxy target override (read in Node via `loadEnv` in `vite.config.ts`) |

Create **`.env.local`** in the project root (gitignored via `*.local`). **Never commit secrets**; this project does not require cloud API keys for Ollama.

**CORS:** If the browser talks to Ollama directly (preview/production without proxy), configure Ollama **`OLLAMA_ORIGINS`** to include your app origin.

---

## 14. Local development

```bash
pnpm install
pnpm dev
```

Default dev server: **`vite.config.ts`** sets host `::` and port **8080**.

Optional **Stagewise / 21st toolbar** runs only when `import.meta.env.DEV` is true (see `src/main.tsx`).

---

## 15. Build, test, and lint

```bash
pnpm run build      # output: dist/
pnpm run preview    # serve dist locally
pnpm run lint       # eslint
pnpm test           # vitest
```

---

## 16. Deployment

- **Vercel:** `vercel.json` rewrites all routes to `index.html` for SPA behavior. Build: `pnpm run build`, output **`dist`**.
- **Ollama:** Not available on Vercel’s static workers. For hosted demos, either disable compliance generation or add a **backend** that calls Ollama server-side.

---

## 17. Future backend API contract

`src/lib/api.ts` documents the intended REST shapes:

- `GET /api/v1/devices` – list devices  
- `POST /api/v1/devices` – register device  
- `DELETE /api/v1/devices/:id` – remove  
- `GET /api/v1/devices/:id/readings?limit=50` – history  
- `POST /api/v1/devices/:id/readings` – push reading (`value`, `unit`, optional `metadata`)  
- `POST /api/v1/devices/test-connection` – connectivity check  
- WebSocket URL helper for optional streaming  

**Waste fill** should use **`unit: "%"`** and **`value` in 0–100** to align with dashboard semantics.

---

## 18. Waste bins: Firestore integration

**Hook:** `src/hooks/useFirebaseWasteData.ts`  
**Config:** `src/firebase.js`

- Collection **`bins`**: documents with fill fields such as `fillLevel`, `level`, `value`, or `percentage`; optional `zone`, `location`, `name`, etc.
- The UI presents **15** logical bins: **`bin1`** maps to the **first** Firestore document (sorted by id) and is labeled **MG Audi** in the UI; **`bin2`–`bin15`** may be **synthetic** with campus-style names when Firestore does not supply enough documents.
- Collection **`alerts`**: waste-related documents merge into the feed; local thresholds can still generate alerts when fill crosses warning/critical bands.

If **no** `bins` documents exist, live **MG Audi** can show **0%** as a placeholder.

**Head dashboard** may still show **simulated** waste aggregates via `useSimulatedData` for a unified demo.

---

## 19. Waste bins: Arduino and ultrasonic sensor (hardware)

This section is the **field guide** for turning physical fill level into **percentage** suitable for APIs and dashboards.

### 19.1 Principle

An **ultrasonic** sensor (e.g. **HC-SR04**) measures **time-of-flight** and thus **distance** (cm) from the sensor to the waste surface. Mount the sensor **above** the opening, pointing **down**.

- **Emptier bin** → surface **farther** → **larger** distance.  
- **Fuller bin** → surface **closer** → **smaller** distance.

Map distance to **0–100%** with two-point calibration (empty vs full).

### 19.2 Parts (example)

| Item | Notes |
|------|-------|
| Arduino Uno / Nano / **ESP32** | ESP32 adds Wi‑Fi for HTTP/MQTT |
| HC-SR04 | 5V logic; on **ESP32 3.3V GPIO**, level-shift or divide **Echo** |
| Power / enclosure | Keep within ratings; protect from moisture |

### 19.3 Wiring (HC-SR04, 5V Arduino-class)

- **VCC** → 5V  
- **GND** → GND  
- **Trig** → digital out (e.g. D12)  
- **Echo** → digital in (e.g. D11)  

### 19.4 Calibration

1. **Empty** bin: measure distance `d_empty` (cm).  
2. **Full** (policy max): measure `d_full` (cm).  
Usually `d_full < d_empty`.

Linear fill (clamp 0–100):

```text
fillPercent = 100 * (d_empty - d) / (d_empty - d_full)
```

Persist `d_empty` / `d_full` in EEPROM or config after on-site calibration.

### 19.5 Firmware flow

1. Sample every **10–60 s** (power and noise).  
2. **Median** filter across several pings.  
3. Map distance → **fill %**.  
4. POST JSON to your backend when ready, e.g.:

```json
{
  "value": 72.5,
  "unit": "%",
  "metadata": { "rawCm": 42.3, "binId": "caf-01" }
}
```

Use **`POST /api/v1/devices/:id/readings`** once the API exists, or write directly to **Firestore** with the schema your listener expects.

### 19.6 Field notes

- Lid shape and sidewalls can cause **multipath** echoes.  
- Soft waste → uneven surface; average samples.  
- Humidity can affect ultrasonics; consider sealed enclosures or alternate sensing in harsh sites.

---

## 20. Security and privacy notes

- **Demo auth** is not suitable for production.  
- **Firebase** web keys in client bundles are normal for Firestore but must be **locked down** with Firebase security rules and App Check for real deployments.  
- **Ollama** on `localhost` is appropriate for lab use; exposing Ollama on a network requires network controls.  
- **Compliance text** is **machine-generated** from **simulated** metrics: always label as draft and require human review before regulatory submission.

---

## 21. Maintaining this document

When you:

- replace simulations with real APIs, update **§8**, **§17**, and **§9** as needed;  
- change Firestore schema, update **§18**;  
- change Ollama routes or env names, update **§10** and **§13**;  
- add roles or routes, update **§6** and **§7**.

---

*Last consolidated: March 2026 (EcoGrid Insights SPA, Vite + React, Ollama compliance path).*
