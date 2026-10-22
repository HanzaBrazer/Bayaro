"use client";

import * as React from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  label?: string;
  helper?: string;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  onFileSelect?: (file: File | null) => void;
  className?: string;
}

export function FileUpload({
  label,
  helper,
  accept = "image/png,image/jpeg,image/svg+xml",
  maxSizeMB = 2,
  disabled,
  onFileSelect,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSizeMB} MB.`);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    onFileSelect?.(file);
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect?.(null);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <span className="block text-[13px] font-medium text-ink">{label}</span>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="flex items-center gap-3 rounded-input border border-line bg-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Pratinjau" className="h-12 w-12 rounded-btn border border-line object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{fileName}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:underline"
            >
              Ganti file
            </button>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label="Hapus file"
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-input border border-dashed border-line bg-surface px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary-soft/30 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-muted">
            <UploadCloud className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-ink">Klik untuk unggah</span>
          <span className="text-xs text-muted">PNG, JPG, atau SVG · maks {maxSizeMB} MB</span>
        </button>
      )}

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
