import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { EcoGridLogo } from "@/components/brand/EcoGridLogo";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const homePath = user ? `/dashboard/${user.role}` : "/";

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

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Activity className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-primary font-medium">LIVE</span>
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
