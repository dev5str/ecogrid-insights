import * as React from "react";
import { cn } from "@/lib/utils";
import { PixelCanvas } from "@/components/ui/pixel-canvas";

/** Default palette tuned for dark cards (subtle slate + green). */
export const DEFAULT_PIXEL_CARD_COLORS = [
  "#0f172a",
  "#1e293b",
  "#334155",
  "#14532d",
];

export interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number;
  speed?: number;
  colors?: string[];
  variant?: "default" | "icon";
  noFocus?: boolean;
}

export const PixelCard = React.forwardRef<HTMLDivElement, PixelCardProps>(
  (
    {
      className,
      children,
      gap = 6,
      speed = 40,
      colors = DEFAULT_PIXEL_CARD_COLORS,
      variant = "default",
      noFocus,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
        <PixelCanvas gap={gap} speed={speed} colors={colors} variant={variant} noFocus={noFocus} />
        <div className="relative z-10">{children}</div>
      </div>
    );
  },
);
PixelCard.displayName = "PixelCard";
