import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopBar } from "./TopBar";
import { Outlet } from "react-router-dom";
import { PlasmaPageBackground } from "@/components/ui/plasma-background";
import { CampusEngagementProvider } from "@/contexts/CampusEngagementContext";

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <CampusEngagementProvider>
        <div className="relative flex min-h-screen w-full bg-background/30">
          <PlasmaPageBackground />
          <DashboardSidebar />
          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </CampusEngagementProvider>
    </SidebarProvider>
  );
}
