import type { Node, Edge } from "@xyflow/react";
import type { ServiceNodeData } from "./types";

// Read core mode from env at build time
// "serious" = dedicated infrastructure (separate L3, L7, stats, logger nodes)
// "lightweight" = single core container with all processes
const CORE_MODE = (import.meta as any).env?.VITE_CORE_MODE || "lightweight";

// --- Layout constants ---
const CENTER = 270;
const RIGHT = 500;

// --- Lightweight core (default) ---
function lightweightNodes(): Node[] {
  return [
    {
      id: "core",
      type: "infra",
      position: { x: CENTER, y: 30 },
      data: {
        label: "Zerops Core",
        sublabel: "L3 + L7 balancer, firewall, stats, logger",
        icon: "shield",
        variant: "core",
      },
    },
  ];
}

function lightweightEdges(): Edge[] {
  return [
    { id: "core-app", source: "core", target: "app", type: "animated" },
  ];
}

// --- Serious / dedicated core ---
function seriousNodes(): Node[] {
  return [
    {
      id: "core",
      type: "infra",
      position: { x: CENTER - 40, y: 10 },
      data: {
        label: "Project Core",
        sublabel: "L3 balancer + firewall",
        icon: "shield",
        variant: "core",
      },
    },
    {
      id: "stats",
      type: "infra",
      position: { x: RIGHT, y: 10 },
      data: {
        label: "Stats",
        sublabel: "Metrics",
        icon: "activity",
        variant: "infra",
      },
    },
    {
      id: "logger",
      type: "infra",
      position: { x: RIGHT + 130, y: 10 },
      data: {
        label: "Logger",
        sublabel: "Logs",
        icon: "file-text",
        variant: "infra",
      },
    },
    {
      id: "l7",
      type: "infra",
      position: { x: CENTER, y: 90 },
      data: {
        label: "L7 HTTP Balancer",
        sublabel: "Routing & TLS",
        icon: "network",
        variant: "balancer",
      },
    },
  ];
}

function seriousEdges(): Edge[] {
  return [
    { id: "core-l7", source: "core", target: "l7", type: "animated" },
    { id: "core-stats", source: "core", target: "stats", type: "animated" },
    { id: "core-logger", source: "core", target: "logger", type: "animated" },
    { id: "l7-app", source: "l7", target: "app", type: "animated" },
  ];
}

// --- Shared application services ---
const APP_Y_LIGHT = 160;
const APP_Y_SERIOUS = 210;
const appY = CORE_MODE === "serious" ? APP_Y_SERIOUS : APP_Y_LIGHT;
const managedY = appY + 130;
const storageY = managedY + 110;

const appServiceNodes: Node[] = [
  {
    id: "app",
    type: "service",
    position: { x: CENTER, y: appY },
    data: {
      label: "Frontend + API",
      sublabel: "Bun + Hono + React",
      hostname: "app",
      port: "3000",
      icon: "globe",
      category: "runtime",
    } satisfies ServiceNodeData,
  },
  {
    id: "nats",
    type: "service",
    position: { x: RIGHT, y: appY },
    data: {
      label: "NATS",
      sublabel: "Message Broker",
      hostname: "queue",
      port: "4222",
      icon: "zap",
      category: "messaging",
    } satisfies ServiceNodeData,
  },
  {
    id: "db",
    type: "service",
    position: { x: 50, y: managedY },
    data: {
      label: "PostgreSQL",
      sublabel: "Database",
      hostname: "db",
      port: "5432",
      icon: "database",
      category: "data",
    } satisfies ServiceNodeData,
  },
  {
    id: "valkey",
    type: "service",
    position: { x: CENTER, y: managedY },
    data: {
      label: "Valkey",
      sublabel: "Cache",
      hostname: "redis",
      port: "6379",
      icon: "layers",
      category: "data",
    } satisfies ServiceNodeData,
  },
  {
    id: "worker",
    type: "service",
    position: { x: RIGHT, y: managedY },
    data: {
      label: "Worker",
      sublabel: "Python + Pillow",
      hostname: "worker",
      port: "—",
      icon: "cog",
      category: "runtime",
    } satisfies ServiceNodeData,
  },
  {
    id: "storage",
    type: "service",
    position: { x: CENTER + 30, y: storageY },
    data: {
      label: "Object Storage",
      sublabel: "S3-compatible",
      hostname: "storage",
      port: "443",
      icon: "hard-drive",
      category: "data",
    } satisfies ServiceNodeData,
  },
];

const appServiceEdges: Edge[] = [
  { id: "app-nats", source: "app", target: "nats", type: "animated" },
  { id: "app-db", source: "app", target: "db", type: "animated" },
  { id: "app-valkey", source: "app", target: "valkey", type: "animated" },
  { id: "app-storage", source: "app", target: "storage", type: "animated" },
  { id: "nats-worker", source: "nats", target: "worker", type: "animated" },
  { id: "worker-db", source: "worker", target: "db", type: "animated" },
  { id: "worker-valkey", source: "worker", target: "valkey", type: "animated" },
  { id: "worker-storage", source: "worker", target: "storage", type: "animated" },
];

// --- Compose based on mode ---
const infraNodes = CORE_MODE === "serious" ? seriousNodes() : lightweightNodes();
const infraEdges = CORE_MODE === "serious" ? seriousEdges() : lightweightEdges();

export const serviceNodes: Node[] = [...infraNodes, ...appServiceNodes];
export const serviceEdges: Edge[] = [...infraEdges, ...appServiceEdges];
