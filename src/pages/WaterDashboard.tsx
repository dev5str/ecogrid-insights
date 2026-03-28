import { useWaterData } from "@/hooks/useSimulatedData";
import { useSystemPower } from "@/contexts/SystemPowerContext";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { SystemModuleOffline } from "@/components/dashboard/SystemModuleOffline";
import { Droplets, AlertTriangle, Activity, Waves } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

export default function WaterDashboard() {
  const { isOn } = useSystemPower();
  const powered = isOn("water");
  const { data, alerts, currentFlow, anomalyCount } = useWaterData({ enabled: powered });

  const severity =
    currentFlow > 75 || currentFlow < 18 ? "critical" : currentFlow > 60 ? "warning" : "normal";

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-400" />
            Water Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Flow rate trends and leak detection</p>
        </div>
      </BlurFade>

      {!powered ? (
        <SystemModuleOffline
          title="Water monitoring is off"
          description="Flow sensors, charts, and leak alerts stay disabled until you turn the water system on in the top bar."
        />
      ) : (
        <>
      <BlurFade delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard title="Current Flow Rate" value={`${currentFlow} L/min`} icon={Droplets} severity={severity} subtitle="Live reading" />
          <StatusCard title="Anomalies Detected" value={anomalyCount} icon={AlertTriangle} severity={anomalyCount > 5 ? "critical" : anomalyCount > 2 ? "warning" : "normal"} subtitle="In current window" />
          <StatusCard title="Active Sensors" value="32" icon={Activity} subtitle="All zones" />
          <StatusCard title="Daily Usage" value="12,450 L" icon={Waves} subtitle="Today's total" />
        </div>
      </BlurFade>

      <div className="grid lg:grid-cols-3 gap-6">
        <BlurFade delay={0.15} className="lg:col-span-2">
          <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Flow Rate Trend
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                <XAxis dataKey="time" stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} unit=" L/m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 20% 7%)",
                    border: "1px solid hsl(220 14% 14%)",
                    borderRadius: "10px",
                    fontSize: 12,
                  }}
                />
                <Legend />
                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Critical", fill: "#ef4444", fontSize: 10 }} />
                <ReferenceLine y={18} stroke="#eab308" strokeDasharray="4 4" label={{ value: "Low", fill: "#eab308", fontSize: 10 }} />
                <Area type="monotone" dataKey="flowRate" stroke="#3b82f6" fill="url(#waterGradient)" strokeWidth={2} animationDuration={500} name="Flow Rate (L/min)" />
              </AreaChart>
            </ResponsiveContainer>
          </PixelCard>
        </BlurFade>

        <BlurFade delay={0.2}>
          <AlertFeed alerts={alerts} title="Water Alerts" />
        </BlurFade>
      </div>
        </>
      )}
    </div>
  );
}
