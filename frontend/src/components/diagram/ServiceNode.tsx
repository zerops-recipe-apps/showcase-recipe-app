import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  Globe, Server, Zap, Database, Layers, Cog, HardDrive,
} from "lucide-react";
import { usePipelineStore } from "../../store/pipeline";
import type { ServiceNodeData } from "./types";

const iconMap: Record<string, React.ElementType> = {
  globe: Globe,
  server: Server,
  zap: Zap,
  database: Database,
  layers: Layers,
  cog: Cog,
  "hard-drive": HardDrive,
};

const categoryColors: Record<string, { active: string; ring: string; bg: string }> = {
  runtime: {
    active: "border-emerald-500",
    ring: "ring-emerald-500/20",
    bg: "bg-emerald-50",
  },
  data: {
    active: "border-blue-500",
    ring: "ring-blue-500/20",
    bg: "bg-blue-50",
  },
  messaging: {
    active: "border-amber-500",
    ring: "ring-amber-500/20",
    bg: "bg-amber-50",
  },
};

function ServiceNodeComponent({ data, id }: NodeProps) {
  const nodeData = data as unknown as ServiceNodeData;
  const isActive = usePipelineStore((s) => s.active.nodes.has(id));
  const Icon = iconMap[nodeData.icon] || Server;
  const colors = categoryColors[nodeData.category];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />

      <motion.div
        className={[
          "relative rounded-xl border-2 px-4 py-3 min-w-[150px] select-none",
          "bg-white shadow-sm transition-shadow duration-300",
          isActive ? `${colors.active} shadow-lg ${colors.ring} ring-4` : "border-zinc-200",
        ].join(" ")}
        animate={{
          scale: isActive ? 1.04 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {isActive && (
          <motion.div
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${colors.active.replace("border-", "bg-")}`}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}

        <div className="flex items-center gap-2.5">
          <div className={[
            "p-1.5 rounded-lg",
            isActive ? colors.bg : "bg-zinc-100",
          ].join(" ")}>
            <Icon size={18} className={isActive ? colors.active.replace("border-", "text-") : "text-zinc-500"} />
          </div>
          <div>
            <div className="font-semibold text-sm text-zinc-900 leading-tight">
              {nodeData.label}
            </div>
            <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              {nodeData.sublabel}
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <code className="text-[10px] font-mono bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
            {nodeData.hostname}:{nodeData.port}
          </code>
        </div>
      </motion.div>
    </>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
