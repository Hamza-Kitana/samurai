import { useRef, useState } from "react";
import { FileArchive, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

type ProductFileUploaderProps = {
  fileName: string;
  hasPendingFile: boolean;
  onFile: (file: File | null) => void;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProductFileUploader({
  fileName,
  hasPendingFile,
  onFile,
}: ProductFileUploaderProps) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sizeLabel, setSizeLabel] = useState<string | null>(null);

  const pick = (file: File | null) => {
    if (!file) {
      setSizeLabel(null);
      onFile(null);
      return;
    }
    setSizeLabel(formatSize(file.size));
    onFile(file);
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
          const file = e.dataTransfer.files?.[0] ?? null;
          pick(file);
        }}
        className={cn(
          "flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-5 text-center transition",
          dragging
            ? "border-primary bg-primary/10"
            : "border-white/15 bg-white/[0.02] hover:border-primary/45 hover:bg-primary/5",
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground/90">{t("product_file_drop")}</p>
        <p className="text-xs text-muted-foreground">{t("product_file_hint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.rar,.7z,.resource,.pack,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/octet-stream"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>

      {fileName ? (
        <div className="flex items-center gap-3 border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <FileArchive className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 text-start">
            <p className="truncate text-sm font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {hasPendingFile
                ? sizeLabel
                  ? `${t("product_file_ready")} · ${sizeLabel}`
                  : t("product_file_ready")
                : t("product_file_saved")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => pick(null)}
            className="flex h-8 w-8 items-center justify-center border border-white/15 text-destructive hover:border-destructive/50"
            aria-label={t("delete")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
