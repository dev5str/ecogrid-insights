import { Link, useLocation } from "react-router-dom";
import { PlasmaPageBackground } from "@/components/ui/plasma-background";
import PillNav from "@/components/ui/PillNav";
import { EcoGridLogo } from "@/components/brand/EcoGridLogo";
import { ECOGRID_LOGO_ALT, ECOGRID_LOGO_SRC } from "@/lib/branding";
import { MARKETING_NAV_ITEMS } from "@/content/marketing";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const activeHref = location.pathname;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background/30">
      <PlasmaPageBackground />

      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto relative w-full max-w-[min(100vw-2rem,1280px)] min-h-[3.5rem] px-4">
          <PillNav
            logo={ECOGRID_LOGO_SRC}
            logoAlt={ECOGRID_LOGO_ALT}
            items={[...MARKETING_NAV_ITEMS]}
            activeHref={activeHref}
            ease="power2.out"
            baseColor="#000000"
            pillColor="#ffffff"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#000000"
            hoverFillColor="#22c55e"
            theme="light"
            initialLoadAnimation={false}
          />
        </div>
      </div>

      {children}

      <footer className="relative z-10 border-t border-border/30 py-10 px-4 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <EcoGridLogo className="h-7 w-7 rounded-md" />
            <span>EcoGrid &copy; {new Date().getFullYear()} &mdash; Smart Environmental Monitoring</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/modules" className="hover:text-foreground transition-colors">
              Modules
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
