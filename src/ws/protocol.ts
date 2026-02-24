export interface WSMessage {
  type: "upload_received" | "step" | "processed" | "error" | "stats_update" | "connected";
  payload: unknown;
}

export interface ConnectedPayload {
  clientId: string;
  activeUploads: number;
  totalProcessed: number;
}

export interface UploadReceivedPayload {
  id: string;
  filename: string;
  sizeBytes: number;
  timestamp: number;
  activeNodes: string[];
  activeEdges: string[];
  edgeLabels: Record<string, string>;
}

export interface StepPayload {
  id: string;
  step: string;
  detail: string;
  durationMs: number;
  timestamp: number;
  activeNodes: string[];
  activeEdges: string[];
  edgeLabels: Record<string, string>;
}

export interface ProcessedPayload {
  id: string;
  thumbnailUrl: string;
  resizedUrl: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    exif: Record<string, string> | null;
    dominantColor: string;
    sizeOriginal: number;
    sizeThumbnail: number;
    sizeResized: number;
  };
  totalDurationMs: number;
  timestamp: number;
  activeNodes: string[];
  activeEdges: string[];
  edgeLabels: Record<string, string>;
}

export interface ErrorPayload {
  id: string;
  error: string;
  step: string;
  timestamp: number;
}

export interface StatsPayload {
  totalProcessed: number;
  avgProcessingMs: number;
  activeJobs: number;
  last24hCount: number;
  storageUsedBytes: number;
}
