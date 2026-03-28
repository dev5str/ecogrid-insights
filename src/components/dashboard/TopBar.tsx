import { useAuth } from "@/contexts/AuthContext";
import { SYSTEM_MODULES, useSystemPower, type SystemModule } from "@/contexts/SystemPowerContext";
import { LogOut, Clock, Activity, SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { EcoGridLogo } from "@/components/brand/EcoGridLogo";
import { useState, useEffect, useId } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function moduleForPath(pathname: string): SystemModule | null {
  if (pathname.includes("/dashboard/electricity")) return "electricity";
  if (pathname.includes("/dashboard/water")) return "water";
  if (pathname.includes("/dashboard/waste")) return "waste";
  if (pathname === "/air" || pathname.startsWith("/air/")) return "air";
  return null;
}

export function TopBar() {
  const { user, logout } = useAuth();
  const { isOn, setOn, labels } = useSystemPower();
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const systemsPopoverId = useId();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const homePath = user
    ? user.role === "air"
      ? "/air"
      : user.role === "student"
        ? "/dashboard/campus"
        : `/dashboard/${user.role}`
    : "/";

  const routeModule = moduleForPath(location.pathname);
  const anySystemLive = SYSTEM_MODULES.some((m) => isOn(m));
  const pageLive = routeModule != null ? isOn(routeModule) : anySystemLive;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/30 glass-strong px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <Link
        to={homePath}
        className="flex min-w-0 items-center gap-2 rounded-lg pr-2 transition-colors hover:bg-secondary/50"
      >
        <EcoGridLogo className="h-8 w-8 shrink-0 rounded-md" />
        <span className="hidden font-bold tracking-tight sm:inline">EcoGrid</span>
      </Link>
      <div className="flex-1" />

      {user?.role !== "student" ? (
        <Popover modal={false}>
          <PopoverTrigger
            type="button"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "h-8 gap-1.5 border-border/50 bg-card/40 px-2.5 text-xs [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            })}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Systems</span>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 space-y-3"
            onOpenAutoFocus={(e) => e.preventDefault()}
            aria-describedby={systemsPopoverId}
          >
            <p id={systemsPopoverId} className="text-xs font-medium text-muted-foreground">
              Power each monitoring system. Off stops live data for that module.
            </p>
            <div className="space-y-3">
              {SYSTEM_MODULES.map((m) => (
                <div key={m} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`pwr-${m}-${systemsPopoverId}`} className="text-sm font-normal cursor-pointer">
                    {labels[m]}
                  </Label>
                  <Switch id={`pwr-${m}-${systemsPopoverId}`} checked={isOn(m)} onCheckedChange={(c) => setOn(m, c)} />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Activity className={`h-3 w-3 ${pageLive ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <span className={pageLive ? "text-primary font-medium" : "text-muted-foreground font-medium"}>
          {pageLive ? "LIVE" : "OFF"}
        </span>
      </div>

      <div className="h-4 w-px bg-border/50" />

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="tabular-nums">{time.toLocaleTimeString()}</span>
      </div>

      <div className="h-4 w-px bg-border/50" />

      <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 border border-border/30">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
        <span className="text-xs font-medium">{user?.name}</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
