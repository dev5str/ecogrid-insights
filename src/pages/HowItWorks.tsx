import { BlurFade } from "@/components/ui/blur-fade";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { HOW_IT_WORKS_STEPS } from "@/content/marketing";

export default function HowItWorks() {
  return (
    <MarketingLayout>
      <section className="relative z-10 px-4 pb-24 pt-32 md:px-8">
        <div className="mx-auto max-w-5xl">
          <BlurFade delay={0.1} inView>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-medium text-primary">WORKFLOW</p>
              <h1 className="text-4xl font-bold md:text-5xl">How It Works</h1>
              <p className="mt-4 text-lg text-muted-foreground">Sensor to cloud to dashboard : in real time.</p>
            </div>
          </BlurFade>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <BlurFade key={step.label} delay={0.15 + i * 0.1} inView>
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <h2 className="mb-2 text-lg font-semibold">{step.label}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
