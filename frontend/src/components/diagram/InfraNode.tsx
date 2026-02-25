import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Shield, Network, Server,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  network: Network,
  server: Server,
};

const variantStyles: Record<string, { bg: string; border: string; text: string }> = {
  core: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-600",
  },
  balancer: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-600",
  },
};

interface InfraNodeData {
  label: string;
  sublabel: string;
  icon: string;
  variant: "core" | "balancer";
  /** Internal containers/processes within this service */
  processes?: string[];
}

function InfraNodeComponent({ data }: NodeProps) {
  const d = data as unknown as InfraNodeData;
  const Icon = iconMap[d.icon] || Shield;
  const style = variantStyles[d.variant] || variantStyles.core;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />

      <div
        className={[
          "rounded-lg border px-3 py-2 select-none",
          style.bg,
          style.border,
          d.processes ? "min-w-[220px]" : "min-w-[120px]",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className={style.text} />
          <div>
            <div className={`font-medium text-xs leading-tight ${style.text}`}>
              {d.label}
            </div>
            <div className="text-[10px] text-zinc-400 leading-tight">
              {d.sublabel}
            </div>
          </div>
        </div>

        {d.processes && d.processes.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {d.processes.map((p) => (
              <span
                key={p}
                className="text-[9px] bg-white/60 border border-teal-100 text-teal-500 px-1.5 py-0.5 rounded font-mono"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export const InfraNode = memo(InfraNodeComponent);
