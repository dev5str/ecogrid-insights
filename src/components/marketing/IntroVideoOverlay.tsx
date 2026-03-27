import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/vdo/ecogrid.mp4";

/** True when we should skip motion-heavy intro (no persistence: refresh always replays otherwise). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function IntroVideoOverlay({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(() => !prefersReducedMotion());
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const finish = useCallback(() => {
    if (!visible || fading) return;
    setFading(true);
  }, [visible, fading]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !visible) return;
    el.play().catch(() => {});
  }, [visible]);

  const onOverlayTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "opacity" || !fading) return;
    setVisible(false);
    setFading(false);
  };

  return (
    <>
      {children}
      {visible && (
        <div
          role="presentation"
          aria-hidden={fading}
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-1000 ease-out",
            fading ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          onTransitionEnd={onOverlayTransitionEnd}
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={VIDEO_SRC}
            muted
            playsInline
            preload="auto"
            onEnded={finish}
            onError={finish}
          />
          <button
            type="button"
            className="absolute bottom-6 right-6 z-[101] rounded-md bg-black/40 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
            onClick={finish}
          >
            Skip
          </button>
        </div>
      )}
    </>
  );
}
