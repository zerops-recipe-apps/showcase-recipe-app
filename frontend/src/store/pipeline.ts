import { create } from "zustand";

export interface PipelineEvent {
  id: string;
  type: "upload" | "step" | "processed" | "error";
  timestamp: number;
  description: string;
  detail?: string;
  durationMs?: number;
}

export interface ActiveState {
  nodes: Set<string>;
  edges: Set<string>;
  edgeLabels: Record<string, string>;
}

export interface GalleryItem {
  id: string;
  filename: string;
  thumbnailUrl: string;
  resizedUrl: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    dominantColor: string;
    sizeOriginal: number;
    sizeThumbnail: number;
    sizeResized: number;
  };
  processingDurationMs: number;
  createdAt: string;
}

export interface Stats {
  totalProcessed: number;
  avgProcessingMs: number;
  activeJobs: number;
  last24hCount: number;
  storageUsedBytes: number;
}

interface PipelineStore {
  connected: boolean;
  setConnected: (v: boolean) => void;

  active: ActiveState;
  activateNodes: (nodes: string[], edges: string[], labels: Record<string, string>) => void;
  clearActive: () => void;

  events: PipelineEvent[];
  addEvent: (event: PipelineEvent) => void;
  loadEvents: () => Promise<void>;

  gallery: GalleryItem[];
  setGallery: (items: GalleryItem[]) => void;
  prependGalleryItem: (item: GalleryItem) => void;

  stats: Stats;
  setStats: (stats: Stats) => void;

  _timers: ReturnType<typeof setTimeout>[];

  handleWSMessage: (msg: { type: string; payload: any }) => void;
}

const ACTIVATION_DURATION_MS = 2000;

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  active: { nodes: new Set(), edges: new Set(), edgeLabels: {} },

  activateNodes: (nodes, edges, labels) => {
    set((state) => ({
      active: {
        nodes: new Set([...state.active.nodes, ...nodes]),
        edges: new Set([...state.active.edges, ...edges]),
        edgeLabels: { ...state.active.edgeLabels, ...labels },
      },
    }));

    const timer = setTimeout(() => {
      set((state) => {
        const newNodes = new Set(state.active.nodes);
        const newEdges = new Set(state.active.edges);
        const newLabels = { ...state.active.edgeLabels };
        nodes.forEach((n) => newNodes.delete(n));
        edges.forEach((e) => {
          newEdges.delete(e);
          delete newLabels[e];
        });
        return { active: { nodes: newNodes, edges: newEdges, edgeLabels: newLabels } };
      });
    }, ACTIVATION_DURATION_MS);

    get()._timers.push(timer);
  },

  clearActive: () =>
    set({ active: { nodes: new Set(), edges: new Set(), edgeLabels: {} } }),

  events: [],
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100),
    })),
  loadEvents: async () => {
    try {
      const res = await fetch("/api/events?limit=50");
      if (res.ok) {
        const data = await res.json();
        set((state) => {
          // Merge: keep any events already in state (from live WS) that aren't in the fetched list
          const fetchedIds = new Set(
            data.events.map((e: PipelineEvent) => `${e.id}-${e.type}-${e.timestamp}`)
          );
          const uniqueExisting = state.events.filter(
            (e) => !fetchedIds.has(`${e.id}-${e.type}-${e.timestamp}`)
          );
          return { events: [...uniqueExisting, ...data.events].slice(0, 100) };
        });
      }
    } catch (err) {
      console.warn("[store] Failed to load events:", err);
    }
  },

  gallery: [],
  setGallery: (items) => set({ gallery: items }),
  prependGalleryItem: (item) =>
    set((state) => ({
      gallery: state.gallery.some((g) => g.id === item.id)
        ? state.gallery
        : [item, ...state.gallery].slice(0, 50),
    })),

  stats: {
    totalProcessed: 0,
    avgProcessingMs: 0,
    activeJobs: 0,
    last24hCount: 0,
    storageUsedBytes: 0,
  },
  setStats: (stats) => set({ stats }),

  _timers: [],

  handleWSMessage: (msg) => {
    const { activateNodes, addEvent, setGallery, setStats } = get();

    switch (msg.type) {
      case "connected":
        set({ connected: true });
        break;

      case "upload_received": {
        const p = msg.payload;
        activateNodes(p.activeNodes, p.activeEdges, p.edgeLabels);
        addEvent({
          id: p.id,
          type: "upload",
          timestamp: p.timestamp,
          description: `Uploaded ${p.filename}`,
          detail: formatBytes(p.sizeBytes),
        });
        break;
      }

      case "step": {
        const p = msg.payload;
        activateNodes(p.activeNodes, p.activeEdges, p.edgeLabels);
        addEvent({
          id: p.id,
          type: "step",
          timestamp: p.timestamp,
          description: p.detail,
          durationMs: p.durationMs,
        });
        break;
      }

      case "processed": {
        const p = msg.payload;
        activateNodes(p.activeNodes, p.activeEdges, p.edgeLabels);
        addEvent({
          id: p.id,
          type: "processed",
          timestamp: p.timestamp,
          description: `Processed in ${p.totalDurationMs}ms`,
          detail: `${p.metadata.width}x${p.metadata.height}`,
          durationMs: p.totalDurationMs,
        });
        // Re-fetch gallery and stats to stay in sync with DB
        fetch("/api/gallery?limit=20")
          .then((r) => r.json())
          .then((data) => setGallery(data.items))
          .catch(() => {});
        fetch("/api/stats")
          .then((r) => r.json())
          .then((data) => setStats(data))
          .catch(() => {});
        break;
      }

      case "error": {
        const p = msg.payload;
        addEvent({
          id: p.id,
          type: "error",
          timestamp: p.timestamp,
          description: `Error: ${p.error}`,
          detail: `Failed at: ${p.step}`,
        });
        break;
      }

      case "stats_update": {
        setStats(msg.payload);
        break;
      }
    }
  },
}));

function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}
