import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { PixelCard } from "@/components/ui/pixel-card";

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
  severity?: "normal" | "warning" | "critical";
}

const severityStyles = {
  normal: {
    border: "border-border/50",
    glow: "",
    icon: "bg-primary/10 text-primary",
    beamFrom: "#22c55e",
    beamTo: "#06b6d4",
  },
  warning: {
    border: "border-status-warning/30",
    glow: "glow-yellow",
    icon: "bg-status-warning/10 text-status-warning",
    beamFrom: "#eab308",
    beamTo: "#f97316",
  },
  critical: {
    border: "border-status-critical/30",
    glow: "glow-red",
    icon: "bg-status-critical/10 text-status-critical",
    beamFrom: "#ef4444",
    beamTo: "#dc2626",
  },
};

export function StatusCard({ title, value, subtitle, icon: Icon, severity = "normal" }: StatusCardProps) {
  const s = severityStyles[severity];
  return (
    <PixelCard
      className={cn(
        "rounded-xl bg-card/60 backdrop-blur-sm p-5 transition-all hover:scale-[1.02] border",
        s.border,
        s.glow,
      )}
    >
      {severity !== "normal" && (
        <BorderBeam size={60} duration={4} colorFrom={s.beamFrom} colorTo={s.beamTo} />
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={cn("rounded-lg p-2", s.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </PixelCard>
  );
}
