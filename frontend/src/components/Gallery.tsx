import { useState } from "react";
import { usePipelineStore, type GalleryItem } from "../store/pipeline";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

export function Gallery() {
  const gallery = usePipelineStore((s) => s.gallery);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = selectedIndex !== null ? gallery[selectedIndex] : null;

  const navigate = (dir: -1 | 1) => {
    if (selectedIndex === null) return;
    const next = selectedIndex + dir;
    if (next >= 0 && next < gallery.length) setSelectedIndex(next);
  };

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-zinc-700">Processed Images</span>
          <span className="text-xs text-zinc-400">{gallery.length} images</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          <AnimatePresence>
            {gallery.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 cursor-pointer"
                onClick={() => setSelectedIndex(i)}
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

      <AnimatePresence>
        {selected && selectedIndex !== null && (
          <Lightbox
            item={selected}
            index={selectedIndex}
            total={gallery.length}
            onClose={() => setSelectedIndex(null)}
            onPrev={() => navigate(-1)}
            onNext={() => navigate(1)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Lightbox({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: GalleryItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") onPrev();
        if (e.key === "ArrowRight") onNext();
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80 font-mono">
            {index + 1} / {total}
          </span>
          <span className="text-sm text-white/50">{item.filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={item.resizedUrl}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Download size={16} />
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav arrows */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {index < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Image */}
      <motion.img
        key={item.id}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.15 }}
        src={item.resizedUrl}
        alt={item.filename}
        className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Bottom info */}
      <div
        className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-center gap-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <InfoPill label="Size" value={`${item.metadata.width}x${item.metadata.height}`} />
        <InfoPill label="Format" value={item.metadata.format} />
        <InfoPill label="Processing" value={`${item.processingDurationMs}ms`} />
        <InfoPill label="Original" value={formatBytes(item.metadata.sizeOriginal)} />
        <InfoPill label="Resized" value={formatBytes(item.metadata.sizeResized)} />
        <div
          className="w-4 h-4 rounded-full border border-white/20"
          style={{ backgroundColor: item.metadata.dominantColor }}
          title={`Dominant: ${item.metadata.dominantColor}`}
        />
      </div>
    </motion.div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
      <span className="text-xs text-white/80 font-mono">{value}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}
