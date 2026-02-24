export interface ServiceNodeData {
  label: string;
  sublabel: string;
  hostname: string;
  port: string;
  icon: string;
  category: "runtime" | "data" | "messaging";
}
