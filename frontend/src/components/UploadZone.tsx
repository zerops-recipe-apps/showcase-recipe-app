import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        console.error("Upload failed:", err);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        disabled={uploading}
        className={[
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
          "bg-zinc-900 text-white hover:bg-zinc-800",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        <Upload size={16} />
        {uploading ? "Uploading..." : "Upload Image"}
      </button>
    </>
  );
}
