import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Globe, Wifi, Server, Cpu } from "lucide-react";
import { toast } from "sonner";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";
import { EcoGridLogo } from "@/components/brand/EcoGridLogo";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you shortly.");
  };

  return (
    <MarketingLayout>
      <section className="relative z-10 px-4 pb-24 pt-32 md:px-8">
        <div className="mx-auto max-w-5xl">
          <BlurFade delay={0.1}>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start">
            <EcoGridLogo className="h-14 w-14 shrink-0 rounded-2xl" />
            <div>
              <p className="text-sm font-medium text-white mb-2">CONTACT US</p>
              <h1 className="text-4xl font-bold mb-2">Contact & Admin Setup</h1>
              <p className="text-muted-foreground text-lg">Get in touch or configure your EcoGrid deployment.</p>
            </div>
          </div>
          </BlurFade>

          <div className="grid md:grid-cols-2 gap-8">
            <BlurFade delay={0.15}>
            <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-1">Send a Message</h2>
                <p className="text-sm text-muted-foreground mb-6">We'll respond within 24 hours.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input placeholder="Your Name" required className="bg-background/50 border-border/50" />
                  <Input type="email" placeholder="Email Address" required className="bg-background/50 border-border/50" />
                  <Input placeholder="Subject" required className="bg-background/50 border-border/50" />
                  <Textarea placeholder="Your message..." rows={4} required className="bg-background/50 border-border/50" />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Send Message</Button>
                </form>
              </div>
            </PixelCard>
            </BlurFade>

            <div className="space-y-6">
            <BlurFade delay={0.2}>
              <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
                <div className="p-6 space-y-5">
                  {[
                    { icon: Mail, label: "Email", value: "hello@gebsill.com" },
                    { icon: Phone, label: "Phone", value: "+91 7010306243" },
                    { icon: MapPin, label: "Location", value: "Campus IoT Lab, Building 7" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                        <c.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                        <p className="text-sm font-medium">{c.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PixelCard>
              </BlurFade>

              <BlurFade delay={0.25}>
              <PixelCard className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">System Requirements</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      { icon: Server, text: "IoT gateway with MQTT/HTTP support" },
                      { icon: Wifi, text: "Campus WiFi or LoRaWAN connectivity" },
                      { icon: Cpu, text: "Compatible sensor modules (ESP32/Arduino)" },
                      { icon: Globe, text: "Modern web browser for dashboard access" },
                    ].map((item) => (
                      <li key={item.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <item.icon className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </PixelCard>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
