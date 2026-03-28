import { useMemo, useState } from "react";
import {
  useCarbonFootprint,
  useChennaiLeaderboard,
  useElectricityAnomalies,
  buildUnifiedExportRows,
  EXPORT_HEADERS,
} from "@/hooks/useSustainabilitySimulation";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCsv, rowsToCsv } from "@/lib/csvExport";
import { openComplianceReportWithGeminiNarrative } from "@/lib/compliancePrint";
import { fetchGeminiComplianceNarrative, type GeminiComplianceMetrics } from "@/lib/geminiComplianceReport";
import {
  clearOllamaBaseUrlOverride,
  getOllamaBaseUrlOverride,
  getOllamaEndpointDisplayBase,
  isValidOllamaBaseUrl,
  setOllamaBaseUrlOverride,
} from "@/lib/ollamaEndpointSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Trophy, FileDown, FileText, Zap, BarChart3, Loader2, Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { toast } from "sonner";

export default function SustainabilityInsightsPage() {
  const { institutions } = useChennaiLeaderboard(true);
  const carbon = useCarbonFootprint(true);
  const { anomalies } = useElectricityAnomalies(true);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [ollamaUrlDraft, setOllamaUrlDraft] = useState(() => getOllamaBaseUrlOverride());
  const [ollamaEndpointTick, setOllamaEndpointTick] = useState(0);
  const ollamaEffectiveBase = useMemo(() => {
    void ollamaEndpointTick;
    return getOllamaEndpointDisplayBase();
  }, [ollamaEndpointTick]);

  const saveOllamaEndpoint = () => {
    const t = ollamaUrlDraft.trim();
    if (t && !isValidOllamaBaseUrl(t)) {
      toast.error("Use a valid http(s) base URL (e.g. https://your-tunnel.example). No /api/chat path.");
      return;
    }
    setOllamaBaseUrlOverride(t);
    setOllamaEndpointTick((n) => n + 1);
    toast.success(t ? "Ollama base URL saved in this browser" : "Cleared: using default endpoint (env / dev proxy)");
  };

  const clearOllamaEndpoint = () => {
    setOllamaUrlDraft("");
    clearOllamaBaseUrlOverride();
    setOllamaEndpointTick((n) => n + 1);
    toast.message("Ollama URL cleared for this browser");
  };

  const carbonBreakdown = useMemo(
    () => [
      { name: "Electricity", value: carbon.electricityPct, fill: "#eab308" },
      { name: "Water", value: carbon.waterPct, fill: "#3b82f6" },
      { name: "Waste", value: carbon.wastePct, fill: "#22c55e" },
      { name: "Air / other", value: carbon.airQualityPct, fill: "#a855f7" },
    ],
    [carbon],
  );

  const comparisonBar = useMemo(
    () => [
      { label: "This campus (est.)", tonnes: Number(carbon.monthlyTonnesCo2e.toFixed(1)) },
      { label: "National avg. (benchmark)", tonnes: carbon.nationalAvgTonnesCo2e },
    ],
    [carbon],
  );

  const exportUnified = () => {
    const rows = buildUnifiedExportRows();
    const csv = rowsToCsv([...EXPORT_HEADERS], rows);
    downloadCsv(`ecogrid-unified-${Date.now()}.csv`, csv);
    toast.success("Unified telemetry CSV downloaded");
  };

  const exportAnomalies = () => {
    const headers = ["timestamp_iso", "zone", "load_kw", "baseline_kw", "root_cause_tag"];
    const rows = anomalies.map((a) => [
      a.timestamp.toISOString(),
      a.zone,
      a.loadKw,
      a.baselineKw,
      a.rootCauseTag,
    ]);
    const csv = rowsToCsv(headers, rows);
    downloadCsv(`ecogrid-electricity-anomalies-${Date.now()}.csv`, csv);
    toast.success("Electricity anomalies CSV downloaded");
  };

  const exportLeaderboard = () => {
    const headers = ["rank", "institution", "area", "ecogrid_health_score"];
    const rows = institutions.map((inst, i) => [i + 1, inst.name, inst.area, inst.ecoScore]);
    const csv = rowsToCsv(headers, rows);
    downloadCsv(`ecogrid-chennai-leaderboard-${Date.now()}.csv`, csv);
    toast.success("Leaderboard CSV downloaded");
  };

  const printCompliance = async () => {
    const reportMonth = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
    const institutionName = "Demo campus - EcoGrid pilot (Chennai)";
    const metrics: GeminiComplianceMetrics = {
      institutionName,
      reportPeriod: reportMonth,
      ecoScoreTopInstitutions: institutions.slice(0, 5).map((i) => ({
        name: i.name,
        area: i.area,
        score: i.ecoScore,
      })),
      carbon: {
        monthlyTonnesCo2e: Number(carbon.monthlyTonnesCo2e.toFixed(2)),
        nationalBenchmarkTonnes: carbon.nationalAvgTonnesCo2e,
        driversPct: {
          electricity: carbon.electricityPct,
          water: carbon.waterPct,
          waste: carbon.wastePct,
          air: carbon.airQualityPct,
        },
      },
      electricityAnomaliesSample: anomalies.slice(0, 6).map((a) => ({
        zone: a.zone,
        loadKw: a.loadKw,
        baselineKw: a.baselineKw,
        rootCauseTag: a.rootCauseTag,
      })),
      wasteBinsAvgFillPct: 42,
      waterFlowLMinAvg: 38,
      gridLoadKwAvg: 248,
    };

    setComplianceLoading(true);
    try {
      const narrative = await fetchGeminiComplianceNarrative(metrics);
      const ok = openComplianceReportWithGeminiNarrative({
        institutionName,
        reportMonth,
        narrative,
      });
      if (!ok) toast.error("Allow pop-ups to print or save as PDF");
      else toast.success("Report ready - use the print dialog to save as PDF");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate report");
    } finally {
      setComplianceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Leaf className="h-7 w-7 text-emerald-400" />
            Sustainability &amp; compliance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Unified EcoGrid Health Score (Chennai pilot), live CO₂e view, CSV exports, and one-click compliance drafts.
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <Tabs defaultValue="score" className="w-full">
          <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
            <TabsTrigger value="score" className="gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Eco score
            </TabsTrigger>
            <TabsTrigger value="carbon" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Carbon
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5">
              <FileDown className="h-3.5 w-3.5" />
              CSV export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="mt-4 space-y-4">
            <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Chennai institutions - live leaderboard</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Composite EcoGrid Health Score (0–100): waste fill pressure, indoor air proxy, water &amp; electricity
                    deviation from baseline - simulated for demo.
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 border-emerald-500/40 text-emerald-400">
                  Live simulation
                </Badge>
              </div>
              <div className="space-y-2">
                {institutions.map((inst, i) => (
                  <div
                    key={inst.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2.5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-bold tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{inst.name}</p>
                      <p className="text-xs text-muted-foreground">{inst.area}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted sm:w-40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                          style={{ width: `${inst.ecoScore}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-sm font-bold tabular-nums">{inst.ecoScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </PixelCard>
          </TabsContent>

          <TabsContent value="carbon" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
                <h2 className="mb-1 text-base font-semibold">Monthly CO₂e drivers (estimated split)</h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Electricity, water, waste, and air-quality burden shown as % of modeled campus footprint.
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={carbonBreakdown} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} unit="%" />
                    <YAxis type="category" dataKey="name" width={88} stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220 20% 7%)",
                        border: "1px solid hsl(220 14% 14%)",
                        borderRadius: "10px",
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v}%`, "Share"]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {carbonBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </PixelCard>

              <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
                <h2 className="mb-1 text-base font-semibold">Campus vs national benchmark</h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Tonnes CO₂e equivalent per month (dummy). National figure is a static benchmark for narrative.
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparisonBar} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                    <XAxis dataKey="label" stroke="hsl(215 15% 50%)" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={56} />
                    <YAxis stroke="hsl(215 15% 50%)" tick={{ fontSize: 11 }} unit=" t" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220 20% 7%)",
                        border: "1px solid hsl(220 14% 14%)",
                        borderRadius: "10px",
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine y={carbon.nationalAvgTonnesCo2e} stroke="#64748b" strokeDasharray="4 4" label={{ value: "Avg", fontSize: 10, fill: "#94a3b8" }} />
                    <Bar dataKey="tonnes" fill="#34d399" radius={[6, 6, 0, 0]} name="t CO₂e" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  ESG / NAAC narrative: automated monthly carbon story instead of consultant spreadsheets.
                </p>
              </PixelCard>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="mt-4">
            <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Automated compliance draft</h2>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    Sends simulated dashboard metrics to <strong>Ollama</strong> (default model <code className="text-xs">llava</code>), returns a draft narrative, then opens a
                    print-ready page. Save as PDF from the browser print dialog. Use the section below to point at a public tunnel (ngrok, cloudflared) so generation works from
                    any device.
                  </p>
                  <ul className="mt-3 list-inside list-disc text-xs text-muted-foreground">
                    <li>Uses live leaderboard, carbon split, and sample electricity anomalies from this page</li>
                    <li>Pair with CSV exports for auditors who want raw series</li>
                    <li>Human review required - model output is indicative only</li>
                  </ul>
                </div>
                <Button
                  type="button"
                  disabled={complianceLoading}
                  onClick={() => void printCompliance()}
                  className="shrink-0 gap-2"
                >
                  {complianceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {complianceLoading ? "Generating…" : "Generate printable report"}
                </Button>
              </div>

              <div className="mt-6 border-t border-border/40 pt-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Ollama API base URL
                </h3>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                  Optional. Paste the <strong>origin only</strong> for a tunnel to Ollama (port 11434), e.g.{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">https://abc123.ngrok-free.app</code>. Do <strong>not</strong> add{" "}
                  <code className="text-[11px]">/api/chat</code>. Stored in <code className="text-[11px]">localStorage</code>. When this is set, the app calls{" "}
                  <strong>same-origin</strong> <code className="text-[11px]">/api/ollama-forward</code> (Vite dev middleware or Vercel serverless), which forwards to your
                  tunnel, so the browser avoids CORS errors. Use <code className="text-[11px]">pnpm dev</code> locally (not <code className="text-[11px]">vite preview</code>) so
                  the dev proxy exists.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor="ollama-endpoint" className="text-xs">
                      Base URL (https://…)
                    </Label>
                    <Input
                      id="ollama-endpoint"
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      placeholder="https://your-tunnel.example or leave empty for default"
                      value={ollamaUrlDraft}
                      onChange={(e) => setOllamaUrlDraft(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={saveOllamaEndpoint}>
                      Save endpoint
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={clearOllamaEndpoint}>
                      Clear
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Tunnel target (forwarded server-side):</span>{" "}
                  <span className="break-all font-mono text-foreground/90">{ollamaEffectiveBase}</span>
                  <span className="font-mono text-muted-foreground">/api/chat</span>
                  {ollamaUrlDraft.trim() ? (
                    <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                      Browser → {typeof window !== "undefined" ? window.location.origin : ""}/api/ollama-forward → tunnel
                    </span>
                  ) : null}
                </p>
              </div>
            </PixelCard>
          </TabsContent>

          <TabsContent value="export" className="mt-4 space-y-4">
            <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
              <h2 className="mb-1 text-base font-semibold">Predictive data lake - CSV extracts</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Timestamp, zone, bin ids, usage, and baselines in one file; plus electricity-only anomaly context for
                your ML / BI pipeline.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button variant="secondary" className="gap-2" onClick={exportUnified}>
                  <Zap className="h-4 w-4" />
                  Unified telemetry CSV
                </Button>
                <Button variant="secondary" className="gap-2" onClick={exportAnomalies}>
                  <Zap className="h-4 w-4" />
                  Electricity anomalies CSV
                </Button>
                <Button variant="secondary" className="gap-2" onClick={exportLeaderboard}>
                  <Trophy className="h-4 w-4" />
                  Leaderboard snapshot CSV
                </Button>
              </div>
            </PixelCard>
          </TabsContent>
        </Tabs>
      </BlurFade>
    </div>
  );
}
