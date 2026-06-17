import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X, Rocket } from "lucide-react";
import { STEPS } from "./steps";

export function Guide({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const go = useCallback(
    (next: number) => {
      setDir(next > index ? 1 : -1);
      setIndex(Math.max(0, Math.min(STEPS.length - 1, next)));
    },
    [index],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.97, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="flex h-[640px] max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight">Pipeline</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
              How it’s built on Zerops
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100"
          >
            Skip intro <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
          {/* Left: copy */}
          <div className="flex flex-col justify-center px-8 py-6">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={index}
                custom={dir}
                initial={{ opacity: 0, x: dir * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -24 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                  {step.eyebrow}
                </div>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-zinc-900">
                  {step.title}
                </h2>
                <div className="mt-4 text-[15px] leading-relaxed text-zinc-700">{step.body}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: visual */}
          <div className="flex items-center overflow-y-auto border-t border-zinc-100 bg-zinc-50/60 px-8 py-6 md:border-l md:border-t-0">
            <div className="w-full">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  {step.visual}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer / nav */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-3">
          <button
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to step ${i + 1}`}
                className={[
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-teal-500" : "w-1.5 bg-zinc-300 hover:bg-zinc-400",
                ].join(" ")}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Rocket size={15} /> Open the live demo
            </button>
          ) : (
            <button
              onClick={() => go(index + 1)}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Next <ArrowRight size={15} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
