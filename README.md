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

## IoT Integration

The dashboard exposes REST and WebSocket endpoints for connecting ESP32/Arduino devices. See the **Devices** page in the dashboard for full API documentation.
