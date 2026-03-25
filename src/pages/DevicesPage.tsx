import { useState } from "react";
import { useDevices } from "@/hooks/useDevices";
import type { IoTDevice } from "@/lib/api";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { PixelCard } from "@/components/ui/pixel-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Cpu, Plus, Wifi, WifiOff, Trash2, Settings, Zap, Droplets,
  Radio, Globe, Activity, Signal, Server,
} from "lucide-react";
import { toast } from "sonner";

const typeIcons: Record<IoTDevice["type"], typeof Zap> = {
  electricity_meter: Zap,
  water_flow: Droplets,
  water_leak: Droplets,
  ultrasonic_bin: Trash2,
  temperature: Activity,
  custom: Cpu,
};

const typeLabels: Record<IoTDevice["type"], string> = {
  electricity_meter: "Electricity Meter",
  water_flow: "Water Flow Sensor",
  water_leak: "Water Leak Detector",
  ultrasonic_bin: "Ultrasonic Bin Sensor",
  temperature: "Temperature Sensor",
  custom: "Custom Sensor",
};

const protocolIcons: Record<IoTDevice["protocol"], typeof Radio> = {
  mqtt: Radio,
  http: Globe,
  websocket: Signal,
};

function DeviceCard({
  device,
  onRemove,
  onToggle,
}: {
  device: IoTDevice;
  onRemove: () => void;
  onToggle: () => void;
}) {
  const Icon = typeIcons[device.type];
  const ProtocolIcon = protocolIcons[device.protocol];
  const isOnline = device.status === "online";

  return (
    <PixelCard
      className={cn(
        "h-full rounded-xl border border-border/50 bg-card/60",
        isOnline ? "border-primary/20" : "border-destructive/20",
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              isOnline ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{device.name}</p>
              <p className="text-xs text-muted-foreground">{device.zone}</p>
            </div>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"} className={cn(
            "text-[10px] font-bold uppercase",
            isOnline ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {isOnline ? <Wifi className="h-2.5 w-2.5 mr-1" /> : <WifiOff className="h-2.5 w-2.5 mr-1" />}
            {device.status}
          </Badge>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ProtocolIcon className="h-3 w-3" />
            <span className="uppercase font-medium">{device.protocol}</span>
            <span className="text-muted-foreground/50">|</span>
            <span className="truncate flex-1">{device.endpoint}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings className="h-3 w-3" />
            <span>Threshold: {device.config.threshold} {device.config.unit}</span>
            <span className="text-muted-foreground/50">|</span>
            <span>Poll: {(device.config.pollingInterval || 5000) / 1000}s</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>Last seen: {device.lastSeen.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-border/30">
          <Button variant="ghost" size="sm" className="flex-1 text-xs h-8 hover:bg-primary/10 hover:text-primary" onClick={onToggle}>
            {isOnline ? <WifiOff className="h-3 w-3 mr-1.5" /> : <Wifi className="h-3 w-3 mr-1.5" />}
            {isOnline ? "Disconnect" : "Connect"}
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-8 hover:bg-destructive/10 hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </PixelCard>
  );
}

export default function DevicesPage() {
  const { devices, addDevice, removeDevice, toggleDeviceStatus, onlineCount, offlineCount } = useDevices();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "electricity_meter" as IoTDevice["type"],
    protocol: "mqtt" as IoTDevice["protocol"],
    endpoint: "",
    zone: "Zone A",
    threshold: "",
    unit: "kW",
    pollingInterval: "5000",
  });

  const handleAdd = () => {
    if (!form.name || !form.endpoint) {
      toast.error("Name and endpoint are required");
      return;
    }
    addDevice({
      name: form.name,
      type: form.type,
      protocol: form.protocol,
      endpoint: form.endpoint,
      zone: form.zone,
      config: {
        threshold: Number(form.threshold) || undefined,
        unit: form.unit,
        pollingInterval: Number(form.pollingInterval) || 5000,
      },
    });
    toast.success(`Device "${form.name}" added successfully`);
    setOpen(false);
    setForm({ name: "", type: "electricity_meter", protocol: "mqtt", endpoint: "", zone: "Zone A", threshold: "", unit: "kW", pollingInterval: "5000" });
  };

  return (
    <div className="space-y-6">
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Cpu className="h-6 w-6 text-primary" />
              IoT Devices
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage connected sensors and endpoints</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Add Device
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card border-border/50">
              <DialogHeader>
                <DialogTitle>Connect New IoT Device</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Device Name</label>
                  <Input placeholder="e.g. Main Building Power Meter" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background/50 border-border/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Sensor Type</label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as IoTDevice["type"] })}>
                      <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Protocol</label>
                    <Select value={form.protocol} onValueChange={(v) => setForm({ ...form, protocol: v as IoTDevice["protocol"] })}>
                      <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mqtt">MQTT</SelectItem>
                        <SelectItem value="http">HTTP/REST</SelectItem>
                        <SelectItem value="websocket">WebSocket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Endpoint URL</label>
                  <Input placeholder="mqtt://host:port/topic or http://..." value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} className="bg-background/50 border-border/50 font-mono text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Zone</label>
                    <Select value={form.zone} onValueChange={(v) => setForm({ ...form, zone: v })}>
                      <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"].map((z) => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Polling Interval (ms)</label>
                    <Input type="number" value={form.pollingInterval} onChange={(e) => setForm({ ...form, pollingInterval: e.target.value })} className="bg-background/50 border-border/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Alert Threshold</label>
                    <Input type="number" placeholder="e.g. 340" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="bg-background/50 border-border/50" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Unit</label>
                    <Input placeholder="e.g. kW, L/min, %" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="bg-background/50 border-border/50" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">Connect Device</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard title="Total Devices" value={devices.length} icon={Cpu} subtitle="Registered sensors" />
          <StatusCard title="Online" value={onlineCount} icon={Wifi} subtitle="Active connections" />
          <StatusCard title="Offline" value={offlineCount} icon={WifiOff} severity={offlineCount > 0 ? "warning" : "normal"} subtitle="Disconnected" />
          <StatusCard title="Data Streams" value={onlineCount} icon={Server} subtitle="Active endpoints" />
        </div>
      </BlurFade>

      <BlurFade delay={0.15}>
        <PixelCard className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
          <BorderBeam size={100} duration={14} colorFrom="#22c55e" colorTo="#a855f7" />
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Connected Devices
            </h3>
            <p className="text-xs text-muted-foreground">{devices.length} devices registered</p>
          </div>
          <ScrollArea className="h-[calc(100vh-420px)] min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onRemove={() => {
                    removeDevice(device.id);
                    toast.success(`Device "${device.name}" removed`);
                  }}
                  onToggle={() => {
                    toggleDeviceStatus(device.id);
                    toast.info(`Device "${device.name}" ${device.status === "online" ? "disconnected" : "connected"}`);
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </PixelCard>
      </BlurFade>

      <BlurFade delay={0.2}>
        <PixelCard className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5">
          <h3 className="text-sm font-semibold mb-3">API Endpoints for IoT Integration</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Connect your ESP32/Arduino devices using these endpoints. All endpoints accept JSON payloads.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { method: "POST", path: "/api/v1/devices/:id/readings", desc: "Push sensor reading" },
              { method: "GET", path: "/api/v1/devices/:id/readings?limit=50", desc: "Get recent readings" },
              { method: "POST", path: "/api/v1/devices", desc: "Register new device" },
              { method: "PUT", path: "/api/v1/devices/:id/thresholds", desc: "Update alert thresholds" },
              { method: "WS", path: "/api/v1/devices/:id/stream", desc: "Real-time WebSocket stream" },
              { method: "POST", path: "/api/v1/devices/test-connection", desc: "Test device connection" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-3 rounded-lg bg-background/50 border border-border/30 px-4 py-3">
                <Badge variant="outline" className={cn(
                  "text-[10px] font-mono font-bold shrink-0",
                  ep.method === "POST" ? "text-green-400 border-green-400/30" :
                  ep.method === "GET" ? "text-blue-400 border-blue-400/30" :
                  ep.method === "PUT" ? "text-yellow-400 border-yellow-400/30" :
                  "text-purple-400 border-purple-400/30"
                )}>
                  {ep.method}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs truncate">{ep.path}</p>
                  <p className="text-[10px] text-muted-foreground">{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </PixelCard>
      </BlurFade>
    </div>
  );
}
