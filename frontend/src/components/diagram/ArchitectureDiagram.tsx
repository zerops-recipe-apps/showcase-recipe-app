import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { buildNodes, buildEdges } from "./nodes";
import { ServiceNode } from "./ServiceNode";
import { InfraNode } from "./InfraNode";
import { AnimatedEdge } from "./AnimatedEdge";
import { usePipelineStore } from "../../store/pipeline";

const nodeTypes: NodeTypes = {
  service: ServiceNode,
  infra: InfraNode,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
};

export function ArchitectureDiagram() {
  const coreMode = usePipelineStore((s) => s.coreMode);

  const nodes = useMemo(() => buildNodes(coreMode), [coreMode]);
  const edges = useMemo(() => buildEdges(coreMode), [coreMode]);

  return (
    <div className="w-full h-full rounded-xl border border-zinc-200 bg-zinc-50/50 overflow-hidden">
      <div className="px-4 py-2 border-b border-zinc-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-600">Live Architecture</span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">Zerops Project Infrastructure</span>
      </div>

      <ReactFlow
        key={coreMode}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        minZoom={0.8}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e4e4e7" />
      </ReactFlow>
    </div>
  );
}
