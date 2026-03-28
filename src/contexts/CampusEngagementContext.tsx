import { createContext, useContext, type ReactNode } from "react";
import { useCampusEngagementState } from "@/hooks/useCampusEngagement";

type CampusEngagementApi = ReturnType<typeof useCampusEngagementState>;

const CampusEngagementContext = createContext<CampusEngagementApi | null>(null);

export function CampusEngagementProvider({ children }: { children: ReactNode }) {
  const value = useCampusEngagementState();
  return <CampusEngagementContext.Provider value={value}>{children}</CampusEngagementContext.Provider>;
}

export function useCampusEngagement() {
  const ctx = useContext(CampusEngagementContext);
  if (!ctx) throw new Error("useCampusEngagement must be used within CampusEngagementProvider");
  return ctx;
}
