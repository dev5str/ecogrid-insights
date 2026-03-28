import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCampusEngagement } from "@/contexts/CampusEngagementContext";
import type { CampusReportType } from "@/hooks/useCampusEngagement";
import { CAMPUS_ZONES } from "@/lib/campusZones";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Users, Shield, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function CampusEngagementPage() {
  const { user } = useAuth();
  const isHead = user?.role === "head";
  const { reports, leaderboard, submitReport, simulateValidation, notifyStaff, typeLabel } = useCampusEngagement();

  const [type, setType] = useState<CampusReportType>("untidy_room");
  const [zone, setZone] = useState<string>(CAMPUS_ZONES[0]);
  const [note, setNote] = useState("");
  const [photoAttached, setPhotoAttached] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    submitReport({
      type,
      zone,
      reporter: user.name,
      note: note.trim() || "(No description)",
    });
    setNote("");
    setPhotoAttached(false);
    toast.success("Report logged (demo). Facilities queue updated.");
  };

  const fakePhotoPick = () => {
    setPhotoAttached(true);
    toast.message("Photo attached (simulation - no file uploaded)");
  };

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-7 w-7 text-sky-400" />
            Campus engagement
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Students flag housekeeping gaps, leaks, and empty-room energy waste. Admins route tasks and award validation
            points (simulated).
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <Tabs defaultValue={isHead ? "admin" : "report"} className="w-full">
          <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
            {!isHead ? (
              <TabsTrigger value="report" className="gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                New report
              </TabsTrigger>
            ) : null}
            <TabsTrigger value="leaderboard" className="gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Leaderboard
            </TabsTrigger>
            {isHead ? (
              <TabsTrigger value="admin" className="gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Admin queue
              </TabsTrigger>
            ) : null}
          </TabsList>

          {!isHead ? (
            <TabsContent value="report" className="mt-4">
              <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
                  <div className="space-y-2">
                    <Label>Issue type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as CampusReportType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(typeLabel) as CampusReportType[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {typeLabel[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Zone</Label>
                    <Select value={zone} onValueChange={setZone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPUS_ZONES.map((z) => (
                          <SelectItem key={z} value={z}>
                            {z}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Details</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Room number, tap location, etc." rows={3} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={fakePhotoPick}>
                      <Camera className="h-4 w-4" />
                      {photoAttached ? "Photo added ✓" : "Attach photo (demo)"}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">
                    Submit campus report
                  </Button>
                </form>
              </PixelCard>
            </TabsContent>
          ) : null}

          <TabsContent value="leaderboard" className="mt-4">
            <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
              <h2 className="mb-1 text-base font-semibold">Green campus champions</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Points awarded when reports align with meter / occupancy signals (simulated validation button in admin).
              </p>
              <div className="space-y-2">
                {leaderboard.map((e, i) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2.5"
                  >
                    <span className="w-6 font-bold tabular-nums text-muted-foreground">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{e.displayName}</p>
                      <p className="text-xs text-muted-foreground">{e.reportsValidated} validated reports</p>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {e.points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </PixelCard>
          </TabsContent>

          {isHead ? (
            <TabsContent value="admin" className="mt-4">
              <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
                <h2 className="mb-1 text-base font-semibold">Operations queue</h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Notify housekeeping / engineering, then run simulated validation against live meters.
                </p>
                <ScrollArea className="h-[min(28rem,55vh)] pr-3">
                  <div className="space-y-3">
                    {reports.map((r) => (
                      <div key={r.id} className="rounded-lg border border-border/50 bg-background/30 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{typeLabel[r.type]}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.zone} · {r.reporter} · {r.submittedAt.toLocaleString()}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>
                          </div>
                          <Badge
                            variant={r.status === "pending" ? "destructive" : r.status === "notified" ? "secondary" : "outline"}
                          >
                            {r.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={r.status !== "pending"}
                            onClick={() => {
                              notifyStaff(r.id);
                              toast.success("Concerned staff alerted (demo)");
                            }}
                          >
                            Alert staff
                          </Button>
                          <Button
                            size="sm"
                            disabled={r.pointsAwarded > 0}
                            onClick={() => {
                              simulateValidation(r.id);
                              toast.success("Validated with telemetry - points issued (demo)");
                            }}
                          >
                            Validate &amp; credit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PixelCard>
            </TabsContent>
          ) : null}
        </Tabs>
      </BlurFade>
    </div>
  );
}
