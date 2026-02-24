import { useState } from "react";
import { Sparkles } from "lucide-react";

export function DemoBurst() {
  const [loading, setLoading] = useState(false);

  async function trigger() {
    setLoading(true);
    try {
      await fetch("/api/demo-burst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 8 }),
      });
    } catch (err) {
      console.error("Demo burst failed:", err);
    } finally {
      setTimeout(() => setLoading(false), 3000);
    }
  }

  return (
    <button
      onClick={trigger}
      disabled={loading}
      className={[
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        "border border-zinc-200 text-zinc-700 hover:bg-zinc-100",
        loading ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <Sparkles size={16} className={loading ? "animate-spin" : ""} />
      {loading ? "Generating..." : "Demo Burst"}
    </button>
  );
}
