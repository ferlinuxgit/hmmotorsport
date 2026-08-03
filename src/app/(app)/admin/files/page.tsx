import type { Metadata } from "next";

import { FileActions } from "@/components/files/file-actions";
import { FileUploader } from "@/components/files/file-uploader";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStorageEnv } from "@/lib/config/env";
import { listAdminFiles, parseAdminFileQuery } from "@/lib/storage/admin";

export const metadata: Metadata = { title: "Archivos | Backoffice", robots: { index: false, follow: false } };
type SearchParams = Record<string, string | string[] | undefined>;
function toParams(input: SearchParams) { const value = new URLSearchParams(); for (const [key, item] of Object.entries(input)) if (typeof item === "string") value.set(key, item); return value; }
function formatBytes(value: number) { return new Intl.NumberFormat("es", { style: "unit", unit: value >= 1_048_576 ? "megabyte" : "kilobyte", maximumFractionDigits: 1 }).format(value / (value >= 1_048_576 ? 1_048_576 : 1024)); }

export default async function AdminFilesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  let query: ReturnType<typeof parseAdminFileQuery>;
  try { query = parseAdminFileQuery(toParams(raw)); } catch { query = parseAdminFileQuery(new URLSearchParams()); }
  const [result, env] = await Promise.all([listAdminFiles(query), Promise.resolve(getStorageEnv())]);
  const allowedMimeTypes = [...new Set(env.STORAGE_ALLOWED_MIME_TYPES.split(",").map((item) => item.trim()).filter(Boolean))];
  return <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
    <div className="space-y-3"><p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Storage</p><h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Archivos</h1><p className="max-w-3xl text-sm text-muted-foreground">Objetos privados, autorizados por cuenta o workspace, con integridad SHA-256 y provider reemplazable.</p></div>
    <Card><CardHeader><CardTitle>Subida privada</CardTitle><CardDescription>Archivo asociado a tu cuenta administrativa. Las subidas de negocio se asocian desde cada workspace.</CardDescription></CardHeader><CardContent><FileUploader maxBytes={env.STORAGE_MAX_FILE_BYTES} allowedMimeTypes={allowedMimeTypes} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Filtros</CardTitle><CardDescription>Busca por nombre, MIME, workspace o email.</CardDescription></CardHeader><CardContent><form method="get" className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><Input name="q" defaultValue={query.q} placeholder="Archivo, MIME, workspace o email" /><select name="status" defaultValue={query.status} className="h-11 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">Todos</option><option value="pending">Pending</option><option value="uploading">Uploading</option><option value="ready">Ready</option><option value="deleting">Deleting</option><option value="deleted">Deleted</option></select><Button type="submit">Aplicar</Button></form></CardContent></Card>
    <Card><CardHeader><CardTitle>{result.pagination.total} archivos</CardTitle><CardDescription>Provider activo: {env.STORAGE_PROVIDER}. Los objetos eliminados no se conservan.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="py-3 pr-4">Archivo</th><th className="py-3 pr-4">Ámbito</th><th className="py-3 pr-4">Estado</th><th className="py-3 pr-4">Integridad</th><th className="py-3">Acciones</th></tr></thead><tbody>{result.items.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No hay archivos.</td></tr> : result.items.map((file) => <tr key={file.id} className="border-b border-border/70 align-top"><td className="py-4 pr-4"><p className="font-medium">{file.originalName}</p><p className="text-xs text-muted-foreground">{file.mimeType} · {formatBytes(file.sizeBytes)} · {file.storageProvider}</p><p className="font-mono text-[11px] text-muted-foreground">{file.id}</p></td><td className="py-4 pr-4"><p>{file.workspaceName ?? "Cuenta privada"}</p><p className="text-xs text-muted-foreground">{file.uploaderEmail ?? "Usuario eliminado"}</p></td><td className="py-4 pr-4"><Badge variant={file.status === "ready" ? "default" : "secondary"}>{file.status}</Badge></td><td className="max-w-48 break-all py-4 pr-4 font-mono text-[11px] text-muted-foreground">{file.checksumSha256 ?? "Pendiente"}</td><td className="py-4">{file.status !== "deleted" ? <FileActions fileId={file.id} ready={file.status === "ready"} /> : <span className="text-xs text-muted-foreground">Sin objeto</span>}</td></tr>)}</tbody></table></CardContent></Card>
    <AdminPagination basePath="/admin/files" page={result.pagination.page} pages={result.pagination.pages} searchParams={raw} />
  </main>;
}
