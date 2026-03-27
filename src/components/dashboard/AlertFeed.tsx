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
    <div className={cn("flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm border", cfg.bg, cfg.border)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.color)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{alert.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {alert.zone} &middot; {alert.timestamp.toLocaleTimeString()}
        </p>
      </div>
      <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", cfg.color, cfg.bg)}>
        {cfg.label}
      </span>
    </div>
  );
}

export function AlertFeed({ alerts, maxItems = 20, title = "Alert Feed" }: AlertFeedProps) {
  const displayed = alerts.slice(0, maxItems);

  return (
    <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
      <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{displayed.length} alerts</span>
      </div>
      <ScrollArea className="h-[340px]">
        {displayed.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
            No alerts yet
          </div>
        ) : (
          <div className="p-2">
            <AnimatedList delay={800}>
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
