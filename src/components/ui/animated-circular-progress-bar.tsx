import { cn } from "@/lib/utils";

interface AnimatedCircularProgressBarProps {
  max?: number;
  min?: number;
  value: number;
  gaugePrimaryColor: string;
  gaugeSecondaryColor: string;
  className?: string;
}

export function AnimatedCircularProgressBar({
  max = 100, min = 0, value = 0,
  gaugePrimaryColor, gaugeSecondaryColor, className,
}: AnimatedCircularProgressBarProps) {
  const circumference = 2 * Math.PI * 45;
  const percentPx = circumference / 100;
  const currentPercent = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div
      className={cn("relative size-40 text-2xl font-semibold", className)}
      style={{
        "--circle-size": "100px",
        "--circumference": circumference,
        "--percent-to-px": `${percentPx}px`,
        "--gap-percent": "5",
        "--offset-factor": "0",
        "--transition-length": "1s",
        "--transition-step": "200ms",
        "--delay": "0s",
        "--percent-to-deg": "3.6deg",
        transform: "translateZ(0)",
      } as React.CSSProperties}
    >
      <svg fill="none" className="size-full" strokeWidth="2" viewBox="0 0 100 100">
        {currentPercent <= 90 && currentPercent >= 0 && (
          <circle
            cx="50" cy="50" r="45" strokeWidth="10"
            strokeDashoffset="0" strokeLinecap="round" strokeLinejoin="round"
            className="opacity-100"
            style={{
              stroke: gaugeSecondaryColor,
              strokeDasharray: `calc(${90 - currentPercent} * ${percentPx}px) ${circumference}`,
              transform: `rotate(calc(1turn - 90deg - (5 * 3.6deg * (1 - 0)))) scaleY(-1)`,
              transition: "all 1s ease 0s",
              transformOrigin: "50px 50px",
            }}
          />
        )}
        <circle
          cx="50" cy="50" r="45" strokeWidth="10"
          strokeDashoffset="0" strokeLinecap="round" strokeLinejoin="round"
          className="opacity-100"
          style={{
            stroke: gaugePrimaryColor,
            strokeDasharray: `calc(${currentPercent} * ${percentPx}px) ${circumference}`,
            transition: "stroke-dasharray 1s ease 0s, stroke 1s ease 0s",
            transform: `rotate(calc(-90deg + 5 * 0 * 3.6deg))`,
            transformOrigin: "50px 50px",
          }}
        />
      </svg>
      <span className="absolute inset-0 m-auto flex items-center justify-center w-fit h-fit">
        {currentPercent}
      </span>
    </div>
  );
}
