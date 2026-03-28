import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SystemPowerProvider } from "@/contexts/SystemPowerContext";

import Landing from "./pages/Landing";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Modules from "./pages/Modules";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import ElectricityDashboard from "./pages/ElectricityDashboard";
import WaterDashboard from "./pages/WaterDashboard";
import WasteDashboard from "./pages/WasteDashboard";
import HeadDashboard from "./pages/HeadDashboard";
import DevicesPage from "./pages/DevicesPage";
import AirDashboard from "./pages/AirDashboard";
import SustainabilityInsightsPage from "./pages/SustainabilityInsightsPage";
import CampusEngagementPage from "./pages/CampusEngagementPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <AuthProvider>
    <SystemPowerProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="electricity" element={<ElectricityDashboard />} />
              <Route path="water" element={<WaterDashboard />} />
              <Route path="waste" element={<WasteDashboard />} />
              <Route path="head" element={<HeadDashboard />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="sustainability" element={<SustainabilityInsightsPage />} />
              <Route path="campus" element={<CampusEngagementPage />} />
            </Route>
            <Route
              path="/air"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AirDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SystemPowerProvider>
  </AuthProvider>
);

export default App;
