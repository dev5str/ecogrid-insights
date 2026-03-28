import { PixelCard } from "@/components/ui/pixel-card";
import { SegmentedProgress } from "@/components/ui/segmented-progress";

export type ZoneBreakdownRow = {
  zone: string;
  value: number;
  /** Bar fill uses `min(100, (value / segmentMax) * 100)`; defaults to card `segmentScale`. */
  segmentMax?: number;
  /** Overrides the right-hand value text (e.g. mixed units). */
  rightLabel?: string;
};

interface ZoneBreakdownProps {
  title: string;
  subtitle?: string;
  unit: string;
  accentClass?: string;
  zones: ZoneBreakdownRow[];
  /** Segmented animated bars (same pattern as electricity). Omit for compact metric tiles. */
  mode?: "compact" | "segmented";
  /** When mode is segmented, this value maps to 100% fill (e.g. kW, L/min). */
  segmentScaleMax?: number;
  /** @deprecated Prefer segmentScaleMax */
  segmentScaleKw?: number;
}

export function ZoneBreakdown({
  title,
  subtitle,
  unit,
  accentClass = "bg-primary",
  zones,
  mode = "compact",
  segmentScaleMax,
  segmentScaleKw = 200,
}: ZoneBreakdownProps) {
  const segmentScale = segmentScaleMax ?? segmentScaleKw;
  return (
    <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <span className={`h-2 w-2 shrink-0 rounded-full ${accentClass} animate-pulse`} />
        {title}
      </h3>
      {subtitle ? <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p> : <div className="mb-4" />}
      {mode === "segmented" ? (
        <div className="flex flex-col gap-5">
          {zones.map(({ zone, value, segmentMax: rowScale, rightLabel }) => {
            const scale = rowScale ?? segmentScale;
            const pct = Math.min(100, Math.max(0, (value / scale) * 100));
            return (
              <div key={zone} className="rounded-lg border border-border/40 bg-background/20 px-3 py-3">
                <SegmentedProgress
                  value={pct}
                  segments={20}
                  label={zone}
                  rightLabel={rightLabel ?? `${value} ${unit}`}
                  showPercentage={false}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map(({ zone, value, rightLabel }) => (
            <div
              key={zone}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2.5"
            >
              <span className="min-w-0 truncate text-xs text-muted-foreground">{zone}</span>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                {rightLabel ?? (
                  <>
                    {value}
                    <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{unit}</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </PixelCard>
  );
}
