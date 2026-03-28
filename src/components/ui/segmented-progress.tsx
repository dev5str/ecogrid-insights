import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedProgressProps {
  /** Target fill level 0–100 */
  value: number;
  segments?: number;
  label?: string;
  /** When set, shown on the right instead of a plain percentage */
  rightLabel?: string;
  showPercentage?: boolean;
  className?: string;
}

export function SegmentedProgress({
  value,
  segments = 20,
  label,
  rightLabel,
  showPercentage = true,
  className,
}: SegmentedProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const startTimeRef = useRef(0);

  const clampedTarget = Math.min(100, Math.max(0, value));
  const filledSegments = Math.round((displayValue / 100) * segments);

  useEffect(() => {
    if (!isInitialized) {
      const initTimeout = window.setTimeout(() => setIsInitialized(true), 50);
      return () => clearTimeout(initTimeout);
    }

    const duration = 800;
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      const newValue = startValueRef.current + (clampedTarget - startValueRef.current) * eased;
      setDisplayValue(newValue);

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clampedTarget, isInitialized]);

  const getSegmentStyle = (index: number) => {
    let scale = 1;
    const opacity = 1;
    let translateY = 0;

    if (hoveredSegment !== null) {
      const distance = Math.abs(hoveredSegment - index);
      if (distance === 0) {
        scale = 1.3;
        translateY = -1;
      } else if (distance <= 3) {
        const falloff = Math.cos((distance / 3) * (Math.PI / 2));
        scale = 1 + 0.2 * falloff;
        translateY = -0.5 * falloff;
      }
    }

    const delay = isInitialized ? index * 20 : 0;

    return {
      transform: `scaleY(${scale}) translateY(${translateY}px)`,
      transitionDelay: `${delay}ms`,
      opacity,
    };
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <span className="min-w-0 truncate text-sm font-medium tracking-wide text-muted-foreground">{label}</span>
        ) : (
          <span />
        )}
        {rightLabel ? (
          <span
            className="shrink-0 text-sm font-semibold tabular-nums tracking-tight text-foreground transition-all duration-300"
            style={{
              filter: hoveredSegment !== null ? "brightness(1.2)" : "brightness(1)",
            }}
          >
            {rightLabel}
          </span>
        ) : showPercentage ? (
          <span
            className="text-sm font-semibold tabular-nums tracking-tight text-foreground transition-all duration-300"
            style={{
              filter: hoveredSegment !== null ? "brightness(1.2)" : "brightness(1)",
            }}
          >
            {Math.round(displayValue)}%
          </span>
        ) : null}
      </div>

      <div
        className="flex gap-[3px] py-1"
        role="progressbar"
        aria-valuenow={Math.round(clampedTarget)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: segments }).map((_, index) => {
          const isFilled = index < filledSegments;
          const isHovered = hoveredSegment === index;

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
              className={cn(
                "h-3 flex-1 origin-center rounded-[4px]",
                "transition-all duration-500 ease-out",
                isFilled ? "bg-primary" : "bg-muted/60",
                isHovered && isFilled && "brightness-110 shadow-[0_0_16px_hsl(var(--primary)/0.5)]",
                isHovered && !isFilled && "bg-muted",
                hoveredSegment !== null && !isFilled && !isHovered && "bg-muted/40",
              )}
              style={getSegmentStyle(index)}
            />
          );
        })}
      </div>
    </div>
  );
}
