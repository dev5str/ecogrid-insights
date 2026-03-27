import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/vdo/ecogrid.mp4";
/** Start fade-out when playback reaches this timestamp (seconds). */
const FADE_AT_SECONDS = 22;

/** True when we should skip motion-heavy intro (no persistence: refresh always replays otherwise). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function IntroVideoOverlay({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(() => !prefersReducedMotion());
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const endTriggeredRef = useRef(false);

  const toggleAudio = useCallback(() => {
    const el = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (el) {
      el.muted = next;
      if (!next) {
        el.play().catch(() => {});
      }
    }
  }, [muted]);

  const finish = useCallback(() => {
    if (!visible || fading || endTriggeredRef.current) return;
    endTriggeredRef.current = true;
    videoRef.current?.pause();
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
    endTriggeredRef.current = false;
  };

  const onTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || endTriggeredRef.current) return;
    if (el.currentTime >= FADE_AT_SECONDS) {
      finish();
    }
  }, [finish]);

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
            muted={muted}
            playsInline
            preload="auto"
            onTimeUpdate={onTimeUpdate}
            onEnded={finish}
            onError={finish}
          />
          <div className="absolute bottom-6 right-6 z-[101] flex flex-col items-stretch gap-2">
            <button
              type="button"
              aria-label={muted ? "Unmute video" : "Mute video"}
              aria-pressed={!muted}
              className="inline-flex items-center justify-center rounded-md bg-black/40 px-4 py-2.5 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
              onClick={toggleAudio}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button
              type="button"
              className="rounded-md bg-black/40 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
              onClick={finish}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </>
  );
}
