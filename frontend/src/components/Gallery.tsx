import { usePipelineStore } from "../store/pipeline";
import { motion, AnimatePresence } from "framer-motion";

export function Gallery() {
  const gallery = usePipelineStore((s) => s.gallery);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-zinc-700">Processed Images</span>
        <span className="text-xs text-zinc-400">{gallery.length} images</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        <AnimatePresence>
          {gallery.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 cursor-pointer"
              onClick={() => window.open(item.resizedUrl, "_blank")}
            >
              <img
                src={item.thumbnailUrl}
                alt={item.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end opacity-0 group-hover:opacity-100">
                <div className="p-2 w-full">
                  <div className="text-[10px] text-white font-mono">
                    {item.metadata.width}x{item.metadata.height}
                  </div>
                  <div className="text-[10px] text-white/70">
                    {item.processingDurationMs}ms
                  </div>
                </div>
              </div>

              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: item.metadata.dominantColor }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {gallery.length === 0 && (
        <div className="text-center text-zinc-400 text-sm py-8">
          No processed images yet. Upload something or trigger a demo burst.
        </div>
      )}
    </div>
  );
}
