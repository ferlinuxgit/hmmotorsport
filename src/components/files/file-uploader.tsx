"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type CreatedFile = { id: string };

function uploadBinary(url: string, file: File, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("content-type", file.type || "application/octet-stream");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else {
        try {
          reject(new Error((JSON.parse(request.responseText) as { error?: string }).error ?? "No se pudo subir el archivo"));
        } catch {
          reject(new Error("No se pudo subir el archivo"));
        }
      }
    });
    request.addEventListener("error", () => reject(new Error("La conexión se interrumpió durante la subida")));
    request.addEventListener("abort", () => reject(new Error("La subida fue cancelada")));
    request.send(file);
  });
}

export function FileUploader({ workspaceId, maxBytes, allowedMimeTypes }: { workspaceId?: string; maxBytes: number; allowedMimeTypes: string[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > maxBytes) {
      setError(`El archivo supera el límite de ${Math.round(maxBytes / 1_048_576)} MB.`);
      event.target.value = "";
      return;
    }
    if (!allowedMimeTypes.includes(file.type)) {
      setError("Este tipo de archivo no está permitido.");
      event.target.value = "";
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, sizeBytes: file.size, workspaceId })
      });
      const body = (await response.json()) as { error?: string; file?: CreatedFile; uploadUrl?: string };
      if (!response.ok || !body.file || !body.uploadUrl) throw new Error(body.error ?? "No se pudo preparar la subida");
      await uploadBinary(body.uploadUrl, file, setProgress);
      setProgress(100);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo subir el archivo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" className="sr-only" accept={allowedMimeTypes.join(",")} onChange={selectFile} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? `Subiendo ${progress}%` : "Subir archivo"}</Button>
        <p className="text-xs text-muted-foreground">Máximo {Math.round(maxBytes / 1_048_576)} MB · {allowedMimeTypes.length} tipos permitidos</p>
      </div>
      {busy ? <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`Subida al ${progress}%`}><div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div> : null}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
