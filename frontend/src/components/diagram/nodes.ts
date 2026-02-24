import type { Node, Edge } from "@xyflow/react";
import type { ServiceNodeData } from "./types";

export const serviceNodes: Node<ServiceNodeData>[] = [
  {
    id: "app",
    type: "service",
    position: { x: 310, y: 0 },
    data: {
      label: "Frontend",
      sublabel: "Bun + React",
      hostname: "app",
      port: "8080",
      icon: "globe",
      category: "runtime",
    },
  },
  {
    id: "api",
    type: "service",
    position: { x: 310, y: 120 },
    data: {
      label: "API",
      sublabel: "Bun + Hono",
      hostname: "api",
      port: "3000",
      icon: "server",
      category: "runtime",
    },
  },
  {
    id: "nats",
    type: "service",
    position: { x: 570, y: 120 },
    data: {
      label: "NATS",
      sublabel: "Message Broker",
      hostname: "queue",
      port: "4222",
      icon: "zap",
      category: "messaging",
    },
  },
  {
    id: "db",
    type: "service",
    position: { x: 100, y: 280 },
    data: {
      label: "PostgreSQL",
      sublabel: "Database",
      hostname: "db",
      port: "5432",
      icon: "database",
      category: "data",
    },
  },
  {
    id: "valkey",
    type: "service",
    position: { x: 310, y: 280 },
    data: {
      label: "Valkey",
      sublabel: "Cache",
      hostname: "redis",
      port: "6379",
      icon: "layers",
      category: "data",
    },
  },
  {
    id: "worker",
    type: "service",
    position: { x: 570, y: 280 },
    data: {
      label: "Worker",
      sublabel: "Python + Pillow",
      hostname: "worker",
      port: "—",
      icon: "cog",
      category: "runtime",
    },
  },
  {
    id: "storage",
    type: "service",
    position: { x: 440, y: 420 },
    data: {
      label: "Object Storage",
      sublabel: "S3-compatible",
      hostname: "storage",
      port: "443",
      icon: "hard-drive",
      category: "data",
    },
  },
];

export const serviceEdges: Edge[] = [
  { id: "app-api", source: "app", target: "api", type: "animated" },
  { id: "api-db", source: "api", target: "db", type: "animated" },
  { id: "api-valkey", source: "api", target: "valkey", type: "animated" },
  { id: "api-storage", source: "api", target: "storage", type: "animated" },
  { id: "api-nats", source: "api", target: "nats", type: "animated" },
  { id: "nats-worker", source: "nats", target: "worker", type: "animated" },
  { id: "worker-db", source: "worker", target: "db", type: "animated" },
  { id: "worker-valkey", source: "worker", target: "valkey", type: "animated" },
  { id: "worker-storage", source: "worker", target: "storage", type: "animated" },
];
