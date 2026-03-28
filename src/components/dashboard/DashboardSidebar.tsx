import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Zap, Droplets, Trash2, LayoutDashboard, Cpu, Wind, Leaf, Users } from "lucide-react";
import { EcoGridLogo } from "@/components/brand/EcoGridLogo";

const roleMenus: Record<UserRole, { title: string; url: string; icon: typeof Zap }[]> = {
  electricity: [
    { title: "Dashboard", url: "/dashboard/electricity", icon: Zap },
    { title: "Eco Score", url: "/dashboard/sustainability", icon: Leaf },
    { title: "Campus", url: "/dashboard/campus", icon: Users },
    { title: "Air Purifier", url: "/air", icon: Wind },
    { title: "Devices", url: "/dashboard/devices", icon: Cpu },
  ],
  water: [
    { title: "Dashboard", url: "/dashboard/water", icon: Droplets },
    { title: "Eco Score", url: "/dashboard/sustainability", icon: Leaf },
    { title: "Campus", url: "/dashboard/campus", icon: Users },
    { title: "Air Purifier", url: "/air", icon: Wind },
    { title: "Devices", url: "/dashboard/devices", icon: Cpu },
  ],
  waste: [
    { title: "Dashboard", url: "/dashboard/waste", icon: Trash2 },
    { title: "Eco Score", url: "/dashboard/sustainability", icon: Leaf },
    { title: "Campus", url: "/dashboard/campus", icon: Users },
    { title: "Air Purifier", url: "/air", icon: Wind },
    { title: "Devices", url: "/dashboard/devices", icon: Cpu },
  ],
  air: [
    { title: "Dashboard", url: "/air", icon: Wind },
    { title: "Eco Score", url: "/dashboard/sustainability", icon: Leaf },
    { title: "Campus", url: "/dashboard/campus", icon: Users },
    { title: "Devices", url: "/dashboard/devices", icon: Cpu },
  ],
  head: [
    { title: "Overview", url: "/dashboard/head", icon: LayoutDashboard },
    { title: "Eco Score", url: "/dashboard/sustainability", icon: Leaf },
    { title: "Campus", url: "/dashboard/campus", icon: Users },
    { title: "Electricity", url: "/dashboard/electricity", icon: Zap },
    { title: "Water", url: "/dashboard/water", icon: Droplets },
    { title: "Waste", url: "/dashboard/waste", icon: Trash2 },
    { title: "Air Purifier", url: "/air", icon: Wind },
    { title: "Devices", url: "/dashboard/devices", icon: Cpu },
  ],
  student: [{ title: "Campus", url: "/dashboard/campus", icon: Users }],
};

export function DashboardSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (!user) return null;

  const items = roleMenus[user.role];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <SidebarHeader className="border-b border-border/30 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-lg shadow-primary/20 ring-1 ring-primary/25">
            <EcoGridLogo className="h-full w-full" />
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight">EcoGrid</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground/60 uppercase tracking-widest">Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium border border-primary/20"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
