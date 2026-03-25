import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";

interface CircularGaugeProps {
  value: number;
  max?: number;
  label: string;
  size?: number;
}

export function CircularGauge({ value, max = 100, label }: CircularGaugeProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const primary = pct > 90 ? "#ef4444" : pct > 70 ? "#eab308" : "#22c55e";
  const secondary = pct > 90 ? "#ef444420" : pct > 70 ? "#eab30820" : "#22c55e20";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <AnimatedCircularProgressBar
        value={pct}
        gaugePrimaryColor={primary}
        gaugeSecondaryColor={secondary}
        className="size-20 text-base"
      />
      <span className="text-xs text-muted-foreground text-center truncate max-w-[90px]">{label}</span>
    </div>
  );
}
