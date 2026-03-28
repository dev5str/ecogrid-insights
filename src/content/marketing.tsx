import {
  Zap,
  Droplets,
  Trash2,
  Leaf,
  BarChart3,
  Shield,
  Wifi,
  Cloud,
  Monitor,
  type LucideIcon,
} from "lucide-react";

export const MARKETING_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Modules", href: "/modules" },
  { label: "Contact", href: "/contact" },
  { label: "Dashboard", href: "/login" },
] as const;

export type MarketingNavItem = (typeof MARKETING_NAV_ITEMS)[number];

export const FEATURE_CARDS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Zap,
    title: "Electricity Monitoring",
    desc: "Real-time power consumption tracking with zone-wise breakdown, peak detection, and anomaly alerts across all campus buildings.",
  },
  {
    icon: Droplets,
    title: "Water Management",
    desc: "Flow rate monitoring, automated leak detection, and usage analytics across all campus water systems and pipelines.",
  },
  {
    icon: Trash2,
    title: "Waste Intelligence",
    desc: "Smart bin fill-level monitoring with optimized collection scheduling and overflow prevention alerts.",
  },
  {
    icon: BarChart3,
    title: "Analytics Engine",
    desc: "Transform raw sensor data into actionable intelligence with real-time trend analysis and predictive insights.",
  },
  {
    icon: Shield,
    title: "Threshold Alerts",
    desc: "Automatic multi-channel alerts when consumption exceeds safe limits, enabling rapid response to anomalies.",
  },
  {
    icon: Leaf,
    title: "Sustainability Score",
    desc: "Track your campus sustainability metrics, reduce carbon footprint, and promote green practices institution-wide.",
  },
];

export const HOW_IT_WORKS_STEPS: {
  icon: LucideIcon;
  label: string;
  desc: string;
}[] = [
  {
    icon: Wifi,
    label: "IoT Sensors",
    desc: "ESP32/Arduino sensors deployed across campus zones collect electricity, water, and waste data continuously.",
  },
  {
    icon: Cloud,
    label: "Cloud Processing",
    desc: "Data is transmitted via MQTT/HTTP to Firebase cloud, where it's processed, analyzed, and stored securely.",
  },
  {
    icon: Monitor,
    label: "Live Dashboard",
    desc: "Role-based web dashboard visualizes data in real-time with charts, alerts, and actionable insights.",
  },
];

/** Fictional institutions & sites for the trust marquee (not real endorsements). */
export const CLIENT_MARQUEE_NAMES = [
  "Riverside State University",
  "Greenfield Polytechnic",
  "Pacific Coast Medical Campus",
  "Summit Business Park",
  "Harborview Community College",
  "Northlake Research Institute",
  "Metro Civic Facilities",
  "Evergreen Agricultural College",
  "Lakeside Innovation District",
  "Central Hospital Network",
  "Oakwood Smart Campus",
  "Skyline Energy Hub",
];
