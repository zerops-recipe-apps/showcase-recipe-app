import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Shield, Activity, FileText, Network,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  activity: Activity,
  "file-text": FileText,
  network: Network,
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
  infra: {
    bg: "bg-zinc-50",
    border: "border-zinc-200",
    text: "text-zinc-500",
  },
};

interface InfraNodeData {
  label: string;
  sublabel: string;
  icon: string;
  variant: "core" | "balancer" | "infra";
}

function InfraNodeComponent({ data }: NodeProps) {
  const d = data as unknown as InfraNodeData;
  const Icon = iconMap[d.icon] || Shield;
  const style = variantStyles[d.variant] || variantStyles.infra;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />

      <div
        className={[
          "rounded-lg border px-3 py-2 min-w-[120px] select-none",
          style.bg,
          style.border,
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
      </div>
    </>
  );
}

export const InfraNode = memo(InfraNodeComponent);
