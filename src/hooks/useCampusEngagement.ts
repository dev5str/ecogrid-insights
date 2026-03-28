import { useCallback, useMemo, useState } from "react";
import { CAMPUS_ZONES } from "@/lib/campusZones";

export type CampusReportType = "untidy_room" | "water_leak" | "lights_empty_room";

export interface CampusReport {
  id: string;
  type: CampusReportType;
  zone: string;
  reporter: string;
  submittedAt: Date;
  status: "pending" | "notified" | "resolved";
  note: string;
  pointsAwarded: number;
}

export interface StudentLeaderEntry {
  id: string;
  displayName: string;
  points: number;
  reportsValidated: number;
}

const TYPE_LABEL: Record<CampusReportType, string> = {
  untidy_room: "Untidy classroom / needs housekeeping",
  water_leak: "Open tap or water leakage",
  lights_empty_room: "Lights/fans on - room appears empty",
};

function seedReports(): CampusReport[] {
  const reporters = ["A. Meera", "R. Karthik", "S. Divya", "V. Arun", "K. Priya"];
  const types: CampusReportType[] = ["untidy_room", "water_leak", "lights_empty_room"];
  return Array.from({ length: 6 }, (_, i) => {
    const t = types[i % types.length];
    return {
      id: `seed-${i}`,
      type: t,
      zone: CAMPUS_ZONES[i % CAMPUS_ZONES.length],
      reporter: reporters[i % reporters.length],
      submittedAt: new Date(Date.now() - (i + 1) * 7200000),
      status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "notified" : "resolved",
      note: `${TYPE_LABEL[t]} (simulated #${i + 1})`,
      pointsAwarded: i % 3 === 2 ? 12 + i : 0,
    };
  });
}

function seedLeaderboard(): StudentLeaderEntry[] {
  return [
    { id: "1", displayName: "A. Meera", points: 184, reportsValidated: 14 },
    { id: "2", displayName: "R. Karthik", points: 162, reportsValidated: 11 },
    { id: "3", displayName: "S. Divya", points: 141, reportsValidated: 10 },
    { id: "4", displayName: "V. Arun", points: 118, reportsValidated: 8 },
    { id: "5", displayName: "K. Priya", points: 96, reportsValidated: 7 },
  ];
}

/** Internal state factory - prefer `useCampusEngagement` from `@/contexts/CampusEngagementContext` in the dashboard. */
export function useCampusEngagementState() {
  const [reports, setReports] = useState<CampusReport[]>(seedReports);
  const [leaderboard, setLeaderboard] = useState<StudentLeaderEntry[]>(seedLeaderboard);

  const submitReport = useCallback((input: { type: CampusReportType; zone: string; reporter: string; note: string }) => {
    const newReport: CampusReport = {
      id: crypto.randomUUID(),
      type: input.type,
      zone: input.zone,
      reporter: input.reporter,
      submittedAt: new Date(),
      status: "pending",
      note: input.note,
      pointsAwarded: 0,
    };
    setReports((r) => [newReport, ...r]);
    return newReport;
  }, []);

  /** Simulates meter cross-check + credit (dummy). */
  const simulateValidation = useCallback((reportId: string) => {
    setReports((prev) => {
      const target = prev.find((r) => r.id === reportId);
      if (!target || target.pointsAwarded > 0) return prev;
      const pts = 8 + Math.floor(Math.random() * 9);
      const name = target.reporter;
      setLeaderboard((lb) => {
        const idx = lb.findIndex((e) => e.displayName === name);
        if (idx >= 0) {
          const next = [...lb];
          next[idx] = {
            ...next[idx],
            points: next[idx].points + pts,
            reportsValidated: next[idx].reportsValidated + 1,
          };
          return [...next].sort((a, b) => b.points - a.points);
        }
        return [{ id: crypto.randomUUID(), displayName: name, points: pts, reportsValidated: 1 }, ...lb].sort(
          (a, b) => b.points - a.points,
        );
      });
      return prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" as const, pointsAwarded: pts } : r));
    });
  }, []);

  const notifyStaff = useCallback((reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId && r.status === "pending" ? { ...r, status: "notified" as const } : r)),
    );
  }, []);

  const typeLabel = TYPE_LABEL;

  const sortedLeaders = useMemo(() => [...leaderboard].sort((a, b) => b.points - a.points), [leaderboard]);

  return {
    reports,
    leaderboard: sortedLeaders,
    submitReport,
    simulateValidation,
    notifyStaff,
    typeLabel,
  };
}
