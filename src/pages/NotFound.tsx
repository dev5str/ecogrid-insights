import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PlasmaPageBackground } from "@/components/ui/plasma-background";
import { BlurFade } from "@/components/ui/blur-fade";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ArrowLeft } from "lucide-react";
import { EcoGridLogo } from "@/components/brand/EcoGridLogo";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background/30">
      <PlasmaPageBackground />
      <div className="text-center relative z-10">
        <BlurFade delay={0.05}>
          <div className="mx-auto mb-6 flex justify-center">
            <EcoGridLogo className="h-14 w-14 rounded-2xl" />
          </div>
        </BlurFade>
        <BlurFade delay={0.1}>
          <p className="text-8xl font-black text-primary/20">404</p>
        </BlurFade>
        <BlurFade delay={0.2}>
          <h1 className="text-2xl font-bold mt-2">Page Not Found</h1>
          <p className="text-muted-foreground mt-2 mb-8">The route you're looking for doesn't exist.</p>
        </BlurFade>
        <BlurFade delay={0.3}>
          <Link to="/">
            <ShimmerButton
              shimmerColor="#22c55e"
              background="hsl(142 71% 45%)"
              borderRadius="12px"
              className="h-11 px-6 text-sm font-medium mx-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </ShimmerButton>
          </Link>
        </BlurFade>
      </div>
    </div>
  );
}
