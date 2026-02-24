import { usePipelineStore } from "../store/pipeline";

function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function StatsBar() {
  const stats = usePipelineStore((s) => s.stats);

  const items = [
    { label: "Processed", value: stats.totalProcessed.toLocaleString() },
    { label: "Avg Time", value: `${stats.avgProcessingMs}ms` },
    { label: "Active Jobs", value: stats.activeJobs.toString() },
    { label: "Last 24h", value: stats.last24hCount.toLocaleString() },
    { label: "Storage Used", value: formatBytes(stats.storageUsedBytes) },
  ];

  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-8 overflow-x-auto">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{item.label}</span>
            <span className="text-sm font-semibold text-zinc-700 font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
