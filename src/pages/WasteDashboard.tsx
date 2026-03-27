import { useFirebaseWasteData } from "@/hooks/useFirebaseWasteData";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { CircularGauge } from "@/components/dashboard/CircularGauge";
import { Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";

export default function WasteDashboard() {
  const { bins, alerts, criticalBins, warningBins, normalBins } = useFirebaseWasteData();

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-green-400" />
            Waste Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Smart bin fill levels and collection status</p>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard title="Total Bins" value={bins.length} icon={Trash2} subtitle="Across all zones" />
          <StatusCard title="Critical" value={criticalBins} icon={XCircle} severity="critical" subtitle="> 90% full" />
          <StatusCard title="Warning" value={warningBins} icon={AlertTriangle} severity="warning" subtitle="70-90% full" />
          <StatusCard title="Normal" value={normalBins} icon={CheckCircle} subtitle="< 70% full" />
        </div>
      </BlurFade>

      <div className="grid lg:grid-cols-3 gap-6">
        <BlurFade delay={0.15} className="lg:col-span-2">
          <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Bin Fill Levels
            </h3>
            <ScrollArea className="h-[340px]">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5 p-1">
                {bins.map((bin) => (
                  <CircularGauge key={bin.id} value={bin.fillLevel} label={bin.id} size={90} />
                ))}
              </div>
            </ScrollArea>
          </PixelCard>
        </BlurFade>

        <BlurFade delay={0.2}>
          <AlertFeed alerts={alerts} title="Waste Alerts" />
        </BlurFade>
      </div>
    </div>
  );
}
