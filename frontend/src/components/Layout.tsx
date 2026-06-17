import { ArchitectureDiagram } from "./diagram/ArchitectureDiagram";
import { EventLog } from "./EventLog";
import { UploadZone } from "./UploadZone";
import { Gallery } from "./Gallery";
import { StatsBar } from "./StatsBar";
import { DemoBurst } from "./DemoBurst";
import { GraduationCap } from "lucide-react";
import { usePipelineStore } from "../store/pipeline";

export function Layout({ onOpenGuide }: { onOpenGuide?: () => void }) {
  const connected = usePipelineStore((s) => s.connected);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-bold text-xl tracking-tight">Pipeline</div>
            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
              Zerops Showcase
            </span>
          </div>
          <div className="flex items-center gap-4">
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                <GraduationCap size={16} />
                How it works
              </button>
            )}
            <DemoBurst />
            <UploadZone />
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
              <span className="text-xs text-zinc-500">
                {connected ? "Live" : "Reconnecting..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      <StatsBar />

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-[650px]">
            <ArchitectureDiagram />
          </div>
          <div className="lg:col-span-2 h-[650px]">
            <EventLog />
          </div>
        </div>
        <div className="mt-6">
          <Gallery />
        </div>
      </main>
    </div>
  );
}
