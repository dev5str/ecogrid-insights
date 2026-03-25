import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopBar } from "./TopBar";
import { Outlet } from "react-router-dom";
import { PlasmaPageBackground } from "@/components/ui/plasma-background";

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-background/30">
        <PlasmaPageBackground />
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <TopBar />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
