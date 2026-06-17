import type { ElementType } from "react";
import { motion } from "framer-motion";
import {
  Globe, Cog, Database, Layers, Zap, HardDrive,
} from "lucide-react";

/** The six services this very app is built from — reused across guide steps. */
export interface ServiceInfo {
  name: string;
  tech: string;
  host: string;
  icon: ElementType;
  kind: "runtime" | "data" | "messaging";
  managed: boolean;
}

export const SERVICES: ServiceInfo[] = [
  { name: "Frontend + API", tech: "Bun + Hono + React", host: "app", icon: Globe, kind: "runtime", managed: false },
  { name: "Worker", tech: "Python + Pillow", host: "worker", icon: Cog, kind: "runtime", managed: false },
  { name: "PostgreSQL", tech: "Database", host: "db", icon: Database, kind: "data", managed: true },
  { name: "Valkey", tech: "Cache", host: "redis", icon: Layers, kind: "data", managed: true },
  { name: "NATS", tech: "Message broker", host: "queue", icon: Zap, kind: "messaging", managed: true },
  { name: "Object Storage", tech: "S3-compatible", host: "storage", icon: HardDrive, kind: "data", managed: true },
];

const kindStyle: Record<ServiceInfo["kind"], { icon: string; chip: string }> = {
  runtime: { icon: "text-emerald-600 bg-emerald-50", chip: "text-emerald-600" },
  data: { icon: "text-blue-600 bg-blue-50", chip: "text-blue-600" },
  messaging: { icon: "text-amber-600 bg-amber-50", chip: "text-amber-600" },
};

export function ServiceCard({
  service,
  dimmed = false,
  badge,
}: {
  service: ServiceInfo;
  dimmed?: boolean;
  badge?: string;
}) {
  const Icon = service.icon;
  const style = kindStyle[service.kind];

  return (
    <div
      className={[
        "relative rounded-xl border-2 bg-white px-4 py-3 shadow-sm transition-all duration-300",
        dimmed ? "border-zinc-200 opacity-40" : "border-zinc-200",
      ].join(" ")}
    >
      {badge && (
        <span className="absolute -top-2 left-3 rounded-full bg-zinc-900 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <div className={`rounded-lg p-1.5 ${style.icon}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight text-zinc-900">{service.name}</div>
          <div className="text-[11px] leading-tight text-zinc-400">{service.tech}</div>
        </div>
      </div>
      <code className={`mt-2 inline-block rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] ${style.chip}`}>
        {service.host}
      </code>
    </div>
  );
}

/** A line of code; comments and ${...} references get colorized. */
type Tone = "comment" | "key" | "ref" | "section";
export interface CodeLine {
  text: string;
  tone?: Tone;
  /** Highlight the whole line (e.g. the active phase being explained). */
  highlight?: boolean;
}

const toneClass: Record<Tone, string> = {
  comment: "text-zinc-500",
  key: "text-sky-300",
  ref: "text-amber-300",
  section: "text-emerald-300",
};

export function CodeBlock({ lines }: { lines: CodeLine[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-zinc-800 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 font-mono text-[10px] text-zinc-500">zerops.yaml</span>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.03 * i, duration: 0.2 }}
            className={[
              "-mx-2 rounded px-2",
              line.highlight ? "bg-emerald-500/10" : "",
            ].join(" ")}
          >
            <code className={line.tone ? toneClass[line.tone] : "text-zinc-200"}>
              {line.text || " "}
            </code>
          </motion.div>
        ))}
      </pre>
    </div>
  );
}
