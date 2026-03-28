import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CircularGaugeTooltipDetails {
  zone: string;
  lastCollected: string;
  binId?: string;
}

interface CircularGaugeProps {
  value: number;
  max?: number;
  label: string;
  /** When set, hover or click opens a popup with larger bin details. */
  tooltipDetails?: CircularGaugeTooltipDetails;
}

export function CircularGauge({ value, max = 100, label, tooltipDetails }: CircularGaugeProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const primary = pct > 90 ? "#ef4444" : pct > 70 ? "#eab308" : "#22c55e";
  const secondary = pct > 90 ? "#ef444420" : pct > 70 ? "#eab30820" : "#22c55e20";

  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 150);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const gaugeBody = (
    <>
      <AnimatedCircularProgressBar
        value={pct}
        gaugePrimaryColor={primary}
        gaugeSecondaryColor={secondary}
        className="size-20 text-base"
      />
      <span className="text-[10px] leading-tight text-muted-foreground text-center line-clamp-2 max-w-[5.75rem] sm:max-w-[6.25rem] min-h-[2.25rem] px-0.5">
        {label}
      </span>
    </>
  );

  if (!tooltipDetails) {
    return <div className="flex flex-col items-center gap-0.5 outline-none">{gaugeBody}</div>;
  }

  const detailClass =
    "max-w-[min(20rem,calc(100vw-1.5rem))] border-border/80 bg-popover/95 px-4 py-3 text-popover-foreground shadow-lg backdrop-blur-sm";

  return (
    <Popover
      open={open}
      modal={false}
      onOpenChange={(next) => {
        clearCloseTimer();
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex flex-col items-center gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer border-0 bg-transparent p-0 text-inherit"
          onMouseEnter={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          {gaugeBody}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className={detailClass}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <p className="text-lg font-semibold leading-tight tracking-tight">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{pct}%</p>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground/90">Zone</span> · {tooltipDetails.zone}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground/90">Last collected</span> ·{" "}
          {tooltipDetails.lastCollected}
        </p>
        {tooltipDetails.binId ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground/80">{tooltipDetails.binId}</p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
