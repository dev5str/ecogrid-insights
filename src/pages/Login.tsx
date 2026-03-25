import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Zap, Droplets, Trash2, Crown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlasmaPageBackground } from "@/components/ui/plasma-background";
import { PixelCard } from "@/components/ui/pixel-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { EcoGridLogo } from "@/components/brand/EcoGridLogo";

const roles: {
  role: UserRole;
  label: string;
  icon: typeof Zap;
  desc: string;
  pixelColors: string[];
}[] = [
  { role: "electricity", label: "Electricity Admin", icon: Zap, desc: "Monitor power consumption across campus", pixelColors: ["#422006", "#713f12", "#ca8a04", "#f97316"] },
  { role: "water", label: "Water Admin", icon: Droplets, desc: "Track water usage and detect leaks", pixelColors: ["#172554", "#1e40af", "#2563eb", "#06b6d4"] },
  { role: "waste", label: "Waste Admin", icon: Trash2, desc: "Manage waste bins and collection", pixelColors: ["#052e16", "#14532d", "#22c55e", "#10b981"] },
  { role: "head", label: "Head User", icon: Crown, desc: "Master control panel : all modules", pixelColors: ["#3b0764", "#6b21a8", "#a855f7", "#ec4899"] },
];

const dashboardRoutes: Record<UserRole, string> = {
  electricity: "/dashboard/electricity",
  water: "/dashboard/water",
  waste: "/dashboard/waste",
  head: "/dashboard/head",
};

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!selectedRole) return;
    login(selectedRole);
    navigate(dashboardRoutes[selectedRole]);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background/30 p-4">
      <PlasmaPageBackground />

      <div className="w-full max-w-lg relative z-10">
        <BlurFade delay={0.1}>
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </BlurFade>

        <BlurFade delay={0.2}>
          <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-primary/25 shadow-lg shadow-primary/10">
                  <EcoGridLogo className="h-full w-full" />
                </div>
                <h1 className="text-2xl font-bold">Sign in to EcoGrid</h1>
                <p className="text-sm text-muted-foreground mt-1.5">Select your role to access the dashboard</p>
              </div>

              <div className="space-y-3">
                {roles.map((r, i) => (
                  <BlurFade key={r.role} delay={0.3 + i * 0.08}>
                    <PixelCard
                      colors={r.pixelColors}
                      className={cn(
                        "cursor-pointer rounded-xl border border-border/50 bg-card/60 transition-all",
                        selectedRole === r.role ? "ring-1 ring-primary/50" : ""
                      )}
                    >
                      <button
                        onClick={() => setSelectedRole(r.role)}
                        className="flex w-full items-center gap-4 p-4 text-left"
                      >
                        <div className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                          selectedRole === r.role
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-secondary text-muted-foreground"
                        )}>
                          <r.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                        <div className={cn(
                          "h-4 w-4 rounded-full border-2 transition-all",
                          selectedRole === r.role
                            ? "border-primary bg-primary shadow-lg shadow-primary/30"
                            : "border-muted-foreground/30"
                        )} />
                      </button>
                    </PixelCard>
                  </BlurFade>
                ))}
              </div>

              <BlurFade delay={0.7}>
                <div className="mt-6">
                  <ShimmerButton
                    shimmerColor="#22c55e"
                    background={selectedRole ? "hsl(142 71% 45%)" : "hsl(220 14% 14%)"}
                    borderRadius="12px"
                    className={cn(
                      "w-full h-12 text-sm font-semibold transition-all",
                      !selectedRole && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!selectedRole}
                    onClick={handleLogin}
                  >
                    Enter Dashboard
                  </ShimmerButton>
                </div>
              </BlurFade>
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
