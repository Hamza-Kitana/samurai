import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

type ProductImageUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
};

async function fileToCompressedDataUrl(file: File, maxSize = 1200, quality = 0.78): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export function ProductImageUploader({
  images,
  onChange,
  maxImages = 8,
}: ProductImageUploaderProps) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;

    const room = Math.max(0, maxImages - images.length);
    if (!room) return;

    setBusy(true);
    try {
      const next: string[] = [];
      for (const file of list.slice(0, room)) {
        next.push(await fileToCompressedDataUrl(file));
      }
      onChange([...images, ...next]);
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const setCover = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    if (!picked) return;
    next.unshift(picked);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 text-center transition",
          dragging
            ? "border-primary bg-primary/10"
            : "border-white/15 bg-white/[0.02] hover:border-primary/45 hover:bg-primary/5",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10">
          {busy ? <Upload className="h-5 w-5 animate-pulse text-primary" /> : <ImagePlus className="h-5 w-5 text-primary" />}
        </div>
        <p className="text-sm font-medium text-foreground/90">{t("images_drop")}</p>
        <p className="text-xs text-muted-foreground">{t("images_drop_hint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {images.map((src, index) => (
            <div
              key={`${index}-${src.slice(0, 32)}`}
              className="group relative aspect-[4/3] overflow-hidden border border-white/10 bg-[#0e0c0a]"
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute start-1.5 top-1.5 bg-primary px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
                  {t("images_cover")}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => setCover(index)}
                    className="flex-1 border border-white/20 bg-black/40 px-1 py-1 text-[10px] text-white hover:border-primary/50"
                  >
                    {t("images_make_cover")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="flex h-7 w-7 items-center justify-center border border-white/20 bg-black/40 text-destructive hover:border-destructive/50"
                  aria-label={t("delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
