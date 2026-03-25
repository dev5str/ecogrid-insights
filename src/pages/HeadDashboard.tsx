import { useElectricityData, useWaterData, useWasteData } from "@/hooks/useSimulatedData";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { Zap, Droplets, Trash2, Activity, Server, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

export default function HeadDashboard() {
  const elec = useElectricityData();
  const water = useWaterData();
  const waste = useWasteData();

  const allAlerts = [...elec.alerts, ...water.alerts, ...waste.alerts]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 50);

  const comparativeData = elec.data.slice(-10).map((d, i) => ({
    time: d.time,
    electricity: d.consumption,
    water: water.data[water.data.length - 10 + i]?.flowRate ?? 0,
    waste: waste.bins.reduce((s, b) => s + b.fillLevel, 0) / waste.bins.length,
  }));

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Master Control Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Consolidated overview of all environmental modules</p>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusCard title="Electricity : Current Load" value={`${elec.currentLoad} kW`} icon={Zap} severity={elec.currentLoad > 340 ? "critical" : elec.currentLoad > 280 ? "warning" : "normal"} subtitle={`Peak: ${elec.peakToday} kW`} />
          <StatusCard title="Water : Flow Rate" value={`${water.currentFlow} L/min`} icon={Droplets} severity={water.currentFlow > 75 ? "critical" : water.currentFlow > 60 ? "warning" : "normal"} subtitle={`${water.anomalyCount} anomalies`} />
          <StatusCard title="Waste : Critical Bins" value={waste.criticalBins} icon={Trash2} severity={waste.criticalBins > 3 ? "critical" : waste.criticalBins > 0 ? "warning" : "normal"} subtitle={`${waste.bins.length} total bins`} />
        </div>
      </BlurFade>

      <BlurFade delay={0.15}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard title="System Uptime" value="99.9%" icon={Server} subtitle="Last 30 days" />
          <StatusCard title="Active Sensors" value="128" icon={Wifi} subtitle="All connected" />
          <StatusCard title="Total Alerts Today" value={allAlerts.length} icon={Activity} severity={allAlerts.length > 20 ? "warning" : "normal"} subtitle="Across all modules" />

          <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Quick Access</p>
            <div className="flex flex-col gap-1.5 mt-1">
              <Link to="/dashboard/electricity"><Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs hover:bg-yellow-500/10 hover:text-yellow-400"><Zap className="h-3.5 w-3.5" /> Electricity</Button></Link>
              <Link to="/dashboard/water"><Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs hover:bg-blue-500/10 hover:text-blue-400"><Droplets className="h-3.5 w-3.5" /> Water</Button></Link>
              <Link to="/dashboard/waste"><Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs hover:bg-green-500/10 hover:text-green-400"><Trash2 className="h-3.5 w-3.5" /> Waste</Button></Link>
            </div>
          </PixelCard>
        </div>
      </BlurFade>

      <div className="grid lg:grid-cols-3 gap-6">
        <BlurFade delay={0.2} className="lg:col-span-2">
          <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Comparative Analytics
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comparativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                <XAxis dataKey="time" stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 20% 7%)",
                    border: "1px solid hsl(220 14% 14%)",
                    borderRadius: "10px",
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="electricity" fill="#eab308" name="Electricity (kW)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="water" fill="#3b82f6" name="Water (L/min)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="waste" fill="#22c55e" name="Waste Avg %" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </PixelCard>
        </BlurFade>

        <BlurFade delay={0.25}>
          <AlertFeed alerts={allAlerts} title="All Module Alerts" />
        </BlurFade>
      </div>
    </div>
  );
}
