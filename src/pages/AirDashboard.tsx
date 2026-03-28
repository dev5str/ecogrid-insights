import { useEffect, useMemo, useRef } from "react";
import { useSystemPower } from "@/contexts/SystemPowerContext";
import { SystemModuleOffline } from "@/components/dashboard/SystemModuleOffline";
import { Wind, Droplets, Thermometer, ShieldAlert, Gauge, AlertTriangle } from "lucide-react";
import GaugeComponent from "react-gauge-component";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelCard } from "@/components/ui/pixel-card";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { ZoneBreakdown } from "@/components/dashboard/ZoneBreakdown";
import { useZoneTelemetry } from "@/hooks/useZoneTelemetry";
import {
  useFirebaseAirData,
  type AirStatus,
  MQ135_ADC_MAX,
  MQ135_ADC_DANGEROUS_MIN,
  MQ135_ADC_MODERATE_MIN,
} from "@/hooks/useFirebaseAirData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

function describeStatus(status: AirStatus) {
  if (status === "Dangerous") return "critical";
  if (status === "Moderate") return "warning";
  return "normal";
}

function statusFromAdc(adc: number): AirStatus {
  if (adc >= MQ135_ADC_DANGEROUS_MIN) return "Dangerous";
  if (adc >= MQ135_ADC_MODERATE_MIN) return "Moderate";
  return "Good";
}

function statusFromPpm(ppm: number): AirStatus {
  if (ppm > 450) return "Dangerous";
  if (ppm > 300) return "Moderate";
  return "Good";
}

const STATUS_RANK: Record<AirStatus, number> = { Good: 0, Moderate: 1, Dangerous: 2 };

function maxAirStatus(a: AirStatus, b: AirStatus): AirStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

export default function AirDashboard() {
  const { isOn } = useSystemPower();
  const powered = isOn("air");
  const { reading, isLive, dataSource, gasScaleMax } = useFirebaseAirData({ enabled: powered });
  const gasUnit = reading.metric === "mq135_adc" ? "ADC" : "PPM";

  const zoneAir = useZoneTelemetry("air", powered);

  const airZonesWithLiveMgAudi = useMemo(() => {
    const simRows =
      reading.metric === "mq135_adc"
        ? zoneAir.map((z) => ({
            zone: z.zone,
            value: Math.min(MQ135_ADC_MAX, Math.round(z.value)),
          }))
        : zoneAir.map((z) => ({
            zone: z.zone,
            value: Math.min(600, Math.round((z.value / MQ135_ADC_MAX) * 600)),
          }));
    return [{ zone: "MG Audi", value: reading.gas }, ...simRows];
  }, [reading.gas, reading.metric, zoneAir]);

  const zoneMaxAdc = useMemo(
    () => (zoneAir.length ? Math.max(...zoneAir.map((z) => z.value)) : 0),
    [zoneAir],
  );

  const worstSimZone = useMemo(
    () =>
      zoneAir.length
        ? zoneAir.reduce((best, z) => (z.value > best.value ? z : best), zoneAir[0])
        : { zone: "", value: 0 },
    [zoneAir],
  );

  const readingAirStatus = useMemo((): AirStatus => {
    if (reading.metric === "mq135_adc") return statusFromAdc(reading.gas);
    return statusFromPpm(reading.gas);
  }, [reading.metric, reading.gas]);

  const simulatedAirStatus = useMemo(() => statusFromAdc(zoneMaxAdc), [zoneMaxAdc]);

  const bannerSev = useMemo(
    () => maxAirStatus(readingAirStatus, simulatedAirStatus),
    [readingAirStatus, simulatedAirStatus],
  );

  const prevBannerSevRef = useRef<AirStatus | null>(null);
  useEffect(() => {
    if (!powered) {
      prevBannerSevRef.current = null;
      return;
    }
    const prev = prevBannerSevRef.current;
    if (bannerSev === "Dangerous" && prev !== "Dangerous") {
      toast.error(
        `Dangerous air (live or simulated): check banner. Worst ADC ≥ ${MQ135_ADC_DANGEROUS_MIN}.`,
      );
    } else if (bannerSev === "Moderate" && prev === "Good") {
      toast.warning(`Air warning (live or simulated): ADC ≥ ${MQ135_ADC_MODERATE_MIN} in at least one zone.`);
    }
    prevBannerSevRef.current = bannerSev;
  }, [powered, bannerSev]);

  const overallSeverity = useMemo(() => describeStatus(bannerSev), [bannerSev]);
  const normalizedGaugeValue = useMemo(
    () => clamp(reading.gas / gasScaleMax, 0, 1),
    [reading.gas, gasScaleMax],
  );
  const airGaugeProps: any = {
    value: normalizedGaugeValue,
    type: "semicircle",
    minValue: 0,
    maxValue: 1,
    arc: {
      width: 1,
      cornerRadius: 44,
      nbSubArcs: 9,
      colorArray: ["#5BE12C", "#F5CD19", "#EA4228"],
      padding: 0.03,
      subArcsStrokeWidth: 1,
      subArcsStrokeColor: "#5e5c64",
      effects: {
        glow: true,
        glowSpread: 0.6,
        glowBlur: 11,
        dropShadow: { dy: 2, blur: 9, opacity: 0.6 },
      },
      subArcs: [],
      gradient: false,
    },
    pointer: {
      type: "needle",
      baseColor: "#000000",
      strokeWidth: 1,
      strokeColor: "#5e5c64",
      maxFps: 30,
      color: "#000000",
      length: 0.7,
      width: 27,
      animationDuration: 2700,
      animationDelay: 200,
    },
    labels: {
      valueLabel: {
        matchColorWithArc: false,
        style: { fontSize: "12px", fontWeight: "bold" },
        hide: true,
        animateValue: true,
      },
      tickLabels: {
        type: "outer",
        ticks: [],
        hideMinMax: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <BlurFade delay={0.05} className="min-w-0 flex-1">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Wind className="h-6 w-6 text-primary" />
              Air Purifier Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time MQ135 from Firebase (`environment/air` · ESP8266). Humidity/temperature when present in the
              same doc.
            </p>
          </div>
        </BlurFade>
        {powered && bannerSev !== "Good" ? (
          <BlurFade delay={0.06} className="w-full shrink-0 sm:ml-4 sm:w-auto sm:max-w-sm">
            <div
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm shadow-lg backdrop-blur-sm",
                bannerSev === "Dangerous"
                  ? "border-red-500/70 bg-red-950/90 text-red-50"
                  : "border-amber-500/70 bg-amber-950/90 text-amber-50",
              )}
              role="alert"
            >
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {bannerSev === "Dangerous" ? "Dangerous air" : "Air quality warning"}
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs opacity-95">
                {reading.metric === "mq135_adc" && readingAirStatus !== "Good" ? (
                  <li>
                    Live (MG Audi): {reading.gas} ADC — {readingAirStatus}
                  </li>
                ) : null}
                {reading.metric !== "mq135_adc" && readingAirStatus !== "Good" ? (
                  <li>
                    Live (MG Audi): {reading.gas} PPM — {readingAirStatus}
                  </li>
                ) : null}
                {simulatedAirStatus !== "Good" && worstSimZone.zone ? (
                  <li>
                    Simulated: {worstSimZone.zone} peak {Math.round(worstSimZone.value)} ADC — {simulatedAirStatus}
                  </li>
                ) : null}
              </ul>
            </div>
          </BlurFade>
        ) : null}
      </div>

      {!powered ? (
        <SystemModuleOffline
          title="Air purifier monitoring is off"
          description="Gas gauge, humidity, temperature, and air-quality alerts stay frozen until you turn the air purifier system on in the top bar."
        />
      ) : (
        <>
      <BlurFade delay={0.1}>
        <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Gas Concentration Gauge
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Source:{" "}
            {isLive && dataSource
              ? `Live Firebase · collection /${dataSource}`
              : "Waiting for Firebase (`environment/air` with `airValue` / `airStatus`)"}
          </p>
          <div className="relative mx-auto w-full max-w-[420px]">
            <GaugeComponent {...airGaugeProps} />
          </div>
          <div className="mt-2 text-center">
            <p className="text-2xl font-bold text-foreground">
              {reading.gas} {gasUnit}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {reading.metric === "mq135_adc" ? "MQ135 raw (A0 · matches ESP sketch)" : "MQ135 scaled reading"}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>0 {gasUnit}</span>
            {reading.metric === "mq135_adc" ? (
              <>
                <span className="rounded-full bg-secondary px-2 py-1">Moderate ≥ {MQ135_ADC_MODERATE_MIN}</span>
                <span className="rounded-full bg-secondary px-2 py-1">Dangerous ≥ {MQ135_ADC_DANGEROUS_MIN}</span>
              </>
            ) : (
              <>
                <span className="rounded-full bg-secondary px-2 py-1">Moderate {">"} 300</span>
                <span className="rounded-full bg-secondary px-2 py-1">Dangerous {">"} 450</span>
              </>
            )}
            <span>
              {gasScaleMax} {gasUnit}
            </span>
          </div>
        </PixelCard>
      </BlurFade>

      <BlurFade delay={0.14}>
        <ZoneBreakdown
          title="Air quality by zone"
          subtitle={`MG Audi: live Firebase (${gasUnit}). Other rows: simulated campus zones.`}
          unit={reading.metric === "mq135_adc" ? "adc" : "ppm"}
          accentClass="bg-sky-400"
          mode="segmented"
          segmentScaleMax={gasScaleMax}
          zones={airZonesWithLiveMgAudi}
        />
      </BlurFade>

      <BlurFade delay={0.15}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            title="Gas Level"
            value={`${reading.gas} ${gasUnit}`}
            icon={Gauge}
            severity={overallSeverity}
            subtitle={reading.metric === "mq135_adc" ? "airValue · ESP8266 patch" : "MQ135 / PPM fields"}
          />
          <StatusCard title="Humidity" value={`${reading.humidity}%`} icon={Droplets} subtitle="Optional in Firestore" />
          <StatusCard title="Temperature" value={`${reading.temperature}°C`} icon={Thermometer} subtitle="Optional in Firestore" />
          <StatusCard
            title="Air Status"
            value={bannerSev}
            icon={ShieldAlert}
            severity={overallSeverity}
            subtitle="Worst of live MG Audi + simulated campus ADC"
          />
        </div>
      </BlurFade>

      <BlurFade delay={0.2}>
        <PixelCard className="rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-semibold">Alerts</h3>
          {bannerSev === "Dangerous" ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-medium text-red-400">Dangerous air quality detected</p>
              <p className="mt-1 text-sm text-red-200/80">
                Combined view: live MG Audi and simulated campus zones. Thresholds: ADC ≥ {MQ135_ADC_DANGEROUS_MIN}{" "}
                (danger) or PPM {">"} 450 when not in ADC mode.
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-red-200/80">
                {readingAirStatus === "Dangerous" ? (
                  <li>
                    Live: {reading.gas} {gasUnit}
                  </li>
                ) : null}
                {simulatedAirStatus === "Dangerous" && worstSimZone.zone ? (
                  <li>
                    Simulated peak: {worstSimZone.zone} at {Math.round(worstSimZone.value)} ADC
                  </li>
                ) : null}
              </ul>
              <p className="mt-2 text-sm text-red-200/80">Increase ventilation and inspect purifier filters immediately.</p>
            </div>
          ) : bannerSev === "Moderate" ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="font-medium text-amber-400">Moderate pollution warning</p>
              <p className="mt-1 text-sm text-amber-100/80">
                At least one source is in the warning band (ADC ≥ {MQ135_ADC_MODERATE_MIN}, or PPM {">"} 300 for live
                non-ADC fields).
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-amber-100/80">
                {readingAirStatus !== "Good" ? (
                  <li>
                    Live: {reading.gas} {gasUnit} — {readingAirStatus}
                  </li>
                ) : null}
                {simulatedAirStatus !== "Good" && worstSimZone.zone ? (
                  <li>
                    Simulated: {worstSimZone.zone} {Math.round(worstSimZone.value)} ADC — {simulatedAirStatus}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <p className="font-medium text-green-400">Air quality is good</p>
              <p className="mt-1 text-sm text-green-100/80">
                Live {reading.gas} {gasUnit}; simulated campus peak {Math.round(zoneMaxAdc)} ADC. Neither crosses
                warning thresholds.
              </p>
            </div>
          )}
        </PixelCard>
      </BlurFade>
        </>
      )}
    </div>
  );
}
