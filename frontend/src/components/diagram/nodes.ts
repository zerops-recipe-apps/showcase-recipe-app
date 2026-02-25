import type { Node, Edge } from "@xyflow/react";
import type { ServiceNodeData } from "./types";

type CoreMode = "lightweight" | "serious";

// --- Layout constants (fitView auto-scales to container) ---
const LEFT = 0;
const CENTER_LEFT = 230;
const CENTER_RIGHT = 460;
const RIGHT = 690;

// --- Lightweight core ---
function lightweightInfraNodes(): Node[] {
  return [
    {
      id: "core",
      type: "infra",
      position: { x: CENTER_LEFT, y: 0 },
      data: {
        label: "Zerops Core",
        sublabel: "L3 + L7 balancer, firewall, stats, logger",
        icon: "shield",
        variant: "core",
      },
    },
  ];
}

function lightweightInfraEdges(): Edge[] {
  return [
    { id: "core-app", source: "core", target: "app", type: "animated" },
  ];
}

// --- Serious / dedicated core ---
function seriousInfraNodes(): Node[] {
  return [
    {
      id: "core",
      type: "infra",
      position: { x: CENTER_LEFT + 5, y: 0 },
      data: {
        label: "Project Core",
        sublabel: "Dedicated infrastructure service",
        icon: "shield",
        variant: "core",
        processes: ["L3 ctrl", "firewall", "stats", "logger"],
      },
    },
    {
      id: "l7",
      type: "infra",
      position: { x: CENTER_LEFT + 30, y: 150 },
      data: {
        label: "L7 HTTP Balancer",
        sublabel: "Dedicated routing service",
        icon: "network",
        variant: "balancer",
      },
    },
  ];
}

function seriousInfraEdges(): Edge[] {
  return [
    { id: "core-l7", source: "core", target: "l7", type: "animated" },
    { id: "l7-app", source: "l7", target: "app", type: "animated" },
  ];
}

// --- Build nodes/edges for a given mode ---
export function buildNodes(mode: CoreMode): Node[] {
  const appY = mode === "serious" ? 320 : 220;
  const dataY = appY + 180;

  const infraNodes = mode === "serious" ? seriousInfraNodes() : lightweightInfraNodes();

  const appServiceNodes: Node[] = [
    // --- Runtime row ---
    {
      id: "app",
      type: "service",
      position: { x: CENTER_LEFT, y: appY },
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
      id: "worker",
      type: "service",
      position: { x: CENTER_RIGHT, y: appY },
      data: {
        label: "Worker",
        sublabel: "Python + Pillow",
        hostname: "worker",
        port: "—",
        icon: "cog",
        category: "runtime",
      } satisfies ServiceNodeData,
    },
    // --- Data / managed row ---
    {
      id: "db",
      type: "service",
      position: { x: LEFT, y: dataY },
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
      position: { x: CENTER_LEFT, y: dataY },
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
      id: "nats",
      type: "service",
      position: { x: CENTER_RIGHT, y: dataY },
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
      id: "storage",
      type: "service",
      position: { x: RIGHT, y: dataY },
      data: {
        label: "Object Storage",
        sublabel: "S3-compatible",
        hostname: "storage",
        port: "—",
        icon: "hard-drive",
        category: "data",
      } satisfies ServiceNodeData,
    },
  ];

  return [...infraNodes, ...appServiceNodes];
}

export function buildEdges(mode: CoreMode): Edge[] {
  const infraEdges = mode === "serious" ? seriousInfraEdges() : lightweightInfraEdges();

  const appServiceEdges: Edge[] = [
    // App connections
    { id: "app-db", source: "app", target: "db", type: "animated" },
    { id: "app-valkey", source: "app", target: "valkey", type: "animated" },
    { id: "app-nats", source: "app", target: "nats", type: "animated" },
    { id: "app-storage", source: "app", target: "storage", type: "animated" },
    // Worker connections
    { id: "worker-nats", source: "worker", target: "nats", type: "animated" },
    { id: "worker-db", source: "worker", target: "db", type: "animated" },
    { id: "worker-valkey", source: "worker", target: "valkey", type: "animated" },
    { id: "worker-storage", source: "worker", target: "storage", type: "animated" },
  ];

  return [...infraEdges, ...appServiceEdges];
}

// Default exports for backward compat
export const serviceNodes = buildNodes("lightweight");
export const serviceEdges = buildEdges("lightweight");
