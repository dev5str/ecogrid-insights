import Plasma from "@/components/ui/Plasma";

/** Full-viewport WebGL plasma (EcoGrid green). Pointer-events disabled so UI stays clickable. */
export function PlasmaPageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full"
      aria-hidden
    >
      <Plasma
        color="#22c55e"
        speed={1}
        direction="forward"
        scale={1.2}
        opacity={0.8}
        mouseInteractive={false}
        maxDpr={1}
        resolutionScale={0.5}
      />
    </div>
  );
}
