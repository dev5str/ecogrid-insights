import { useElectricityData } from "@/hooks/useSimulatedData";
import { useSystemPower } from "@/contexts/SystemPowerContext";
import { useZoneTelemetry } from "@/hooks/useZoneTelemetry";
import { useElectricityAnomalies } from "@/hooks/useSustainabilitySimulation";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { SystemModuleOffline } from "@/components/dashboard/SystemModuleOffline";
import { ZoneBreakdown } from "@/components/dashboard/ZoneBreakdown";
import { Zap, TrendingUp, Activity, Gauge, Radar } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";

export default function ElectricityDashboard() {
  const { isOn } = useSystemPower();
  const powered = isOn("electricity");
  const { data, alerts, currentLoad, peakToday, avgConsumption } = useElectricityData({ enabled: powered });
  const zoneLoads = useZoneTelemetry("electricity", powered);
  const { anomalies } = useElectricityAnomalies(powered);

  const severity =
    currentLoad > 340 ? "critical" : currentLoad > 280 ? "warning" : "normal";

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            Electricity Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time power consumption across campus zones</p>
        </div>
      </BlurFade>

      {!powered ? (
        <SystemModuleOffline
          title="Electricity monitoring is off"
          description="Live meters, charts, and alerts for this module stay disabled until you turn the electricity system on in the top bar."
        />
      ) : (
        <>
      <BlurFade delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard title="Current Load" value={`${currentLoad} kW`} icon={Zap} severity={severity} subtitle="Live reading" />
          <StatusCard title="Peak Today" value={`${peakToday} kW`} icon={TrendingUp} severity={peakToday > 340 ? "critical" : "normal"} subtitle="Maximum recorded" />
          <StatusCard title="Average" value={`${avgConsumption} kW`} icon={Activity} subtitle="Rolling average" />
          <StatusCard title="Active Meters" value="48" icon={Gauge} subtitle="All zones online" />
        </div>
      </BlurFade>

      <BlurFade delay={0.12}>
        <ZoneBreakdown
          title="Load by campus zone"
          subtitle="University zones — live simulated kW per feeder (segmented load view)"
          unit="kW"
          accentClass="bg-yellow-400"
          mode="segmented"
          segmentScaleMax={200}
          zones={zoneLoads.map((z) => ({ zone: z.zone, value: z.value }))}
        />
      </BlurFade>

      <div className="grid lg:grid-cols-3 gap-6">
        <BlurFade delay={0.15} className="lg:col-span-2 space-y-6">
          <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
              Power Consumption : Time Series
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="elecGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 14%)" />
                <XAxis dataKey="time" stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} unit=" kW" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 20% 7%)",
                    border: "1px solid hsl(220 14% 14%)",
                    borderRadius: "10px",
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="consumption" stroke="#eab308" fill="url(#elecGradient)" strokeWidth={2} animationDuration={500} name="Consumption (kW)" />
              </AreaChart>
            </ResponsiveContainer>
          </PixelCard>

          <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <Radar className="h-4 w-4 text-amber-400" />
              Anomaly detection + root cause
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Electricity-only alert mode: spikes vs zone baseline with explainable tags (demo stream).
            </p>
            <ScrollArea className="h-[220px] min-w-0 pr-2">
              <div className="space-y-2">
                {anomalies.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{a.zone}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {a.loadKw} kW vs {a.baselineKw} kW
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-amber-200/90">{a.rootCauseTag}</p>
                    <p className="text-[10px] text-muted-foreground">{a.timestamp.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PixelCard>
        </BlurFade>

        <BlurFade delay={0.2}>
          <AlertFeed alerts={alerts} title="Electricity Alerts" />
        </BlurFade>
      </div>
        </>
      )}
    </div>
  );
}
