import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useWebSocket } from "./hooks/useWebSocket";
import { usePipelineStore } from "./store/pipeline";
import { Layout } from "./components/Layout";
import { Guide } from "./components/guide/Guide";

const GUIDE_SEEN_KEY = "zerops-guide-seen";

export default function App() {
  useWebSocket();

  const setGallery = usePipelineStore((s) => s.setGallery);
  const setStats = usePipelineStore((s) => s.setStats);

  const [showGuide, setShowGuide] = useState(
    () => localStorage.getItem(GUIDE_SEEN_KEY) !== "1",
  );

  const closeGuide = () => {
    localStorage.setItem(GUIDE_SEEN_KEY, "1");
    setShowGuide(false);
  };

  useEffect(() => {
    fetch("/api/gallery?limit=20")
      .then((r) => r.json())
      .then((data) => setGallery(data.items))
      .catch(console.error);

    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error);

    const interval = setInterval(() => {
      fetch("/api/stats")
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, [setGallery, setStats]);

  return (
    <>
      <Layout onOpenGuide={() => setShowGuide(true)} />
      <AnimatePresence>{showGuide && <Guide onClose={closeGuide} />}</AnimatePresence>
    </>
  );
}
