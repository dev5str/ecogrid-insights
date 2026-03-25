import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Marquee } from "@/components/ui/marquee";
import { PixelCard } from "@/components/ui/pixel-card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { TECH_STACK } from "@/content/marketing";

export default function Landing() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative px-4 pb-24 pt-36 md:px-8">
        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <BlurFade delay={0.1} inView>
            <div className="mx-auto mb-8 w-fit">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm">
                <span className="h-2 w-2 animate-pulse-glow rounded-full bg-primary" />
                <AnimatedShinyText shimmerWidth={120}>
                  Live Environmental Monitoring
                </AnimatedShinyText>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
              Smart Campus
              <br />
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Environmental Intelligence
              </span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3} inView>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Real-time IoT monitoring for electricity consumption, water usage & leakage detection,
              and waste management. Built for institutional campuses with smart sensor integration.
            </p>
          </BlurFade>

          <BlurFade delay={0.4} inView>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
              <Link to="/login">
                <ShimmerButton
                  shimmerColor="#22c55e"
                  background="hsl(142 71% 45%)"
                  borderRadius="12px"
                  className="h-12 px-8 text-base font-semibold"
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </ShimmerButton>
              </Link>
              <Link to="/about">
                <button
                  type="button"
                  className="h-12 rounded-xl border border-border bg-card/50 px-8 text-sm font-medium transition-colors hover:bg-card"
                >
                  Learn More
                </button>
              </Link>
            </div>
          </BlurFade>

          {/* Stats */}
          <BlurFade delay={0.5} inView>
            <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Sensors Active", value: 1240, suffix: "+" },
                { label: "Zones Monitored", value: 5, suffix: "" },
                { label: "Data Points/Day", value: 50, suffix: "K+" },
                { label: "Uptime", value: 99.9, suffix: "%", decimal: 1 },
              ].map((s) => (
                <PixelCard key={s.label} className="rounded-xl border border-border/50 bg-card/50 p-5">
                  <p className="text-3xl font-bold text-primary">
                    <NumberTicker value={s.value} decimalPlaces={s.decimal || 0} className="text-primary" />
                    <span>{s.suffix}</span>
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{s.label}</p>
                </PixelCard>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Tech Marquee */}
      <section className="relative z-10 border-y border-border/30 py-8">
        <Marquee pauseOnHover className="[--duration:30s]">
          {TECH_STACK.map((tech) => (
            <div key={tech} className="mx-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
              {tech}
            </div>
          ))}
        </Marquee>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-border/30 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <BlurFade delay={0.1} inView>
            <h2 className="mb-4 text-4xl font-bold">Ready to Monitor Your Campus?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Connect your IoT sensors and start monitoring electricity, water, and waste in real-time.
            </p>
            <Link to="/login">
              <ShimmerButton
                shimmerColor="#22c55e"
                background="hsl(142 71% 45%)"
                borderRadius="12px"
                className="mx-auto h-12 px-10 text-base font-semibold"
              >
                Launch Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </ShimmerButton>
            </Link>
          </BlurFade>
        </div>
      </section>
    </MarketingLayout>
  );
}
