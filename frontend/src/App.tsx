import { useEffect } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { usePipelineStore } from "./store/pipeline";
import { Layout } from "./components/Layout";

export default function App() {
  useWebSocket();

  const setGallery = usePipelineStore((s) => s.setGallery);
  const setStats = usePipelineStore((s) => s.setStats);

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

  return <Layout />;
}
