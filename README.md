# EcoGrid : Real-Time IoT Environmental Monitoring

A real-time IoT-based environmental monitoring system for detecting and reducing resource wastage in institutions. Monitors electricity usage, water consumption, and garbage levels using smart sensors with a centralized web dashboard.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Magic UI
- **Charts**: Recharts
- **Routing**: React Router v6
- **State**: TanStack React Query

## Getting Started

```bash
pnpm install
pnpm dev
```

## Deploy on Vercel

This repo is configured for [Vercel](https://vercel.com): `pnpm` install, `vite build`, output `dist`, and SPA rewrites in `vercel.json`.

1. Push the repo to GitHub (see below).
2. In Vercel: **Add New Project** → import the repository.
3. Leave defaults (or confirm **Install Command** `pnpm install --frozen-lockfile`, **Build Command** `pnpm run build`, **Output Directory** `dist`).
4. Deploy.

    ## Documentation

**Full project documentation** : architecture, what is simulated vs real, API stubs, and a **detailed Arduino + ultrasonic waste-bin guide** : is in:

**[docs/ECOGRID-DOCUMENTATION.md](docs/ECOGRID-DOCUMENTATION.md)**

## IoT integration

The dashboard UI is wired to **client-side API stubs** (`src/lib/api.ts`) for future REST/WebSocket backends. The **Devices** page lists example endpoints. **Electricity and water** in the app are **simulations**; **waste fill levels** are **simulated** until you connect real hardware and a backend : see the doc above for hardware and calibration.
