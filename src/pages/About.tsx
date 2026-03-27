import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { FEATURE_CARDS } from "@/content/marketing";

export default function About() {
  const cards = FEATURE_CARDS.slice(0, 3);

  return (
    <MarketingLayout>
      <section className="relative z-10 px-4 pb-24 pt-32 md:px-8">
        <div className="mx-auto max-w-7xl">
          <BlurFade delay={0.1} inView>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-medium text-primary">ABOUT ECOGRID</p>
              <h1 className="text-4xl font-bold md:text-5xl">Intelligent Resource Management</h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                EcoGrid is an IoT-powered environmental monitoring platform designed for colleges and campuses,
                providing real-time visibility into resource consumption.
              </p>
            </div>
          </BlurFade>
          <div className="grid gap-5 md:grid-cols-3">
            {cards.map((f, i) => (
              <BlurFade key={f.title} delay={0.1 + i * 0.1} inView>
                <PixelCard className="group h-full rounded-xl border border-border/50 bg-card/50 p-7 transition-all hover:border-primary/30">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/20">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-2 text-lg font-semibold">{f.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </PixelCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
