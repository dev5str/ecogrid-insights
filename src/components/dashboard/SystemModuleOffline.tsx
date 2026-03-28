import { Power } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface SystemModuleOfflineProps {
  title: string;
  description: string;
}

/** Shown when a module is powered off from the top bar. */
export function SystemModuleOffline({ title, description }: SystemModuleOfflineProps) {
  return (
    <BlurFade delay={0.05}>
      <div className="flex min-h-[min(420px,55vh)] flex-col items-center justify-center gap-4 rounded-xl border border-border/50 bg-card/40 px-6 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-secondary/30">
          <Power className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        <p className="text-xs text-muted-foreground/80">
          Turn this system <span className="font-medium text-foreground">on</span> using the Systems control next to the status in the top bar.
        </p>
      </div>
    </BlurFade>
  );
}
