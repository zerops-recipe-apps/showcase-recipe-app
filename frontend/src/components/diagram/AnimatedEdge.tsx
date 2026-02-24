import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { usePipelineStore } from "../../store/pipeline";

function AnimatedEdgeComponent({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const isActive = usePipelineStore((s) => s.active.edges.has(id));
  const label = usePipelineStore((s) => s.active.edgeLabels[id]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isActive ? "var(--edge-active)" : "var(--edge-idle)",
          strokeWidth: isActive ? 2.5 : 1.5,
          strokeDasharray: isActive ? "6 3" : "none",
          transition: "stroke 0.3s, stroke-width 0.3s",
        }}
      />

      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--edge-active)"
          strokeWidth={2.5}
          strokeDasharray="6 3"
          className="animate-dash"
        />
      )}

      {label && (
        <foreignObject
          x={labelX - 80}
          y={labelY - 12}
          width={160}
          height={24}
          className="pointer-events-none"
        >
          <div className="flex justify-center">
            <span className="text-[10px] font-mono bg-zinc-900 text-white px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
              {label}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  );
}

export const AnimatedEdge = memo(AnimatedEdgeComponent);
