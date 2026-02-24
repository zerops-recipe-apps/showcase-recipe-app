import { usePipelineStore, type PipelineEvent } from "../store/pipeline";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Cog, CheckCircle, AlertCircle } from "lucide-react";

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  upload: { icon: Upload, color: "text-blue-500" },
  step: { icon: Cog, color: "text-amber-500" },
  processed: { icon: CheckCircle, color: "text-emerald-500" },
  error: { icon: AlertCircle, color: "text-red-500" },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function EventLog() {
  const events = usePipelineStore((s) => s.events);

  return (
    <div className="h-full rounded-xl border border-zinc-200 bg-white flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600">Event Log</span>
        <span className="text-[10px] text-zinc-400">{events.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <AnimatePresence initial={false}>
          {events.map((event, i) => (
            <EventRow key={`${event.id}-${event.timestamp}-${i}`} event={event} />
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="text-center text-zinc-400 text-sm py-12">
            Upload an image or trigger a demo burst to see events flow
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: PipelineEvent }) {
  const { icon: Icon, color } = typeConfig[event.type] || typeConfig.step;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex items-start gap-2 py-1.5 border-b border-zinc-100 last:border-0"
    >
      <Icon size={14} className={`${color} mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-700 leading-tight truncate">
          {event.description}
        </div>
        {event.detail && (
          <div className="text-[10px] text-zinc-400 mt-0.5">{event.detail}</div>
        )}
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-zinc-400 font-mono">
          {formatTime(event.timestamp)}
        </span>
        {event.durationMs !== undefined && (
          <span className="text-[10px] text-zinc-400">
            {event.durationMs}ms
          </span>
        )}
      </div>
    </motion.div>
  );
}
