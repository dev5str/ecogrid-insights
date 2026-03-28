import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { Alert } from "@/hooks/useSimulatedData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatedList } from "@/components/ui/animated-list";
import { PixelCard } from "@/components/ui/pixel-card";

interface AlertFeedProps {
  alerts: Alert[];
  maxItems?: number;
  title?: string;
}

const severityConfig = {
  normal: { icon: CheckCircle, color: "text-status-normal", bg: "bg-status-normal/10", border: "border-status-normal/20", label: "OK" },
  warning: { icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning/10", border: "border-status-warning/20", label: "WARN" },
  critical: { icon: XCircle, color: "text-status-critical", bg: "bg-status-critical/10", border: "border-status-critical/20", label: "CRIT" },
};

function AlertItem({ alert }: { alert: Alert }) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  return (
    <div className={cn("flex w-full min-w-0 items-start gap-2.5 rounded-md px-2.5 py-2 text-sm border", cfg.bg, cfg.border)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.color)} />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="break-words font-medium leading-snug">{alert.message}</p>
        <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">
          {alert.zone} &middot; {alert.timestamp.toLocaleTimeString()}
        </p>
      </div>
      <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.color, cfg.bg)}>
        {cfg.label}
      </span>
    </div>
  );
}

export function AlertFeed({ alerts, maxItems = 20, title = "Alert Feed" }: AlertFeedProps) {
  const displayed = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return sorted.slice(0, maxItems);
  }, [alerts, maxItems]);

  return (
    <PixelCard className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
      <div className="border-b border-border/50 px-3 py-2 flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <span className="text-sm text-muted-foreground">{displayed.length} alerts</span>
      </div>
      {/* ~4 full alert rows visible; pb on inner wrapper adds space at bottom when scrolling */}
      <ScrollArea className="h-[23rem] min-w-0">
        {displayed.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center px-4 py-6 text-sm text-muted-foreground">
            No alerts yet
          </div>
        ) : (
          <div className="box-border w-full min-w-0 max-w-full p-1.5 pb-4">
            <AnimatedList className="w-full min-w-0" delay={800}>
              {displayed.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </AnimatedList>
          </div>
        )}
      </ScrollArea>
    </PixelCard>
  );
}
