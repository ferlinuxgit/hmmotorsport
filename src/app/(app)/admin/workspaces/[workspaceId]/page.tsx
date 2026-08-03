import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { WorkspaceManager } from "@/components/admin/workspace-manager";
import { WorkspaceInvitations } from "@/components/admin/workspace-invitations";
import { FileActions } from "@/components/files/file-actions";
import { FileUploader } from "@/components/files/file-uploader";
import { Badge } from "@/components/ui/badge";
import { getAdminWorkspace } from "@/lib/admin/workspaces";
import { requireAdminAccount } from "@/lib/auth/rbac";
import { getStorageEnv } from "@/lib/config/env";
import { listWorkspaceFiles } from "@/lib/storage/service";
import { listWorkspaceInvitations } from "@/lib/workspaces/invitations";

export const metadata: Metadata = { title: "Workspace | Backoffice", robots: { index: false, follow: false } };

export default async function AdminWorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const parsed = z.string().uuid().safeParse((await params).workspaceId);
  if (!parsed.success) notFound();
  const account = await requireAdminAccount();
  const [workspace, invitations, files] = await Promise.all([
    getAdminWorkspace(parsed.data).catch(() => notFound()),
    listWorkspaceInvitations(parsed.data),
    listWorkspaceFiles(account, parsed.data)
  ]);
  const storage = getStorageEnv();
  const allowedMimeTypes = [...new Set(storage.STORAGE_ALLOWED_MIME_TYPES.split(",").map((item) => item.trim()).filter(Boolean))];

  return (
    <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <div><Link href="/admin/workspaces" className="text-sm text-muted-foreground hover:text-foreground">← Workspaces</Link><div className="mt-5 flex flex-wrap items-center gap-3"><h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{workspace.name}</h1><Badge variant={workspace.active ? "default" : "outline"}>{workspace.active ? "Activo" : "Inactivo"}</Badge></div><p className="mt-3 font-mono text-sm text-muted-foreground">/{workspace.slug} · {workspace.id}</p></div>
      <WorkspaceManager workspace={{ id: workspace.id, name: workspace.name, slug: workspace.slug, active: workspace.active, ownerId: workspace.ownerId, ownerEmail: workspace.ownerEmail }} members={workspace.members.map((member) => ({ userId: member.userId, email: member.email, name: member.name, active: member.active, role: member.role }))} />
      <WorkspaceInvitations workspaceId={workspace.id} invitations={invitations.map((item) => ({ ...item, expiresAt: item.expiresAt.toISOString(), createdAt: item.createdAt.toISOString() }))} />
      <section className="rounded-2xl border border-border/80 bg-card p-6"><h2 className="text-xl font-semibold">Archivos del workspace</h2><p className="mt-1 text-sm text-muted-foreground">Storage privado con autorización de membresía e integridad SHA-256.</p><div className="mt-5"><FileUploader workspaceId={workspace.id} maxBytes={storage.STORAGE_MAX_FILE_BYTES} allowedMimeTypes={allowedMimeTypes} /></div><div className="mt-5 divide-y divide-border/70">{files.length === 0 ? <p className="py-5 text-sm text-muted-foreground">Sin archivos.</p> : files.map((file) => <div key={file.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-medium">{file.originalName}</p><p className="text-xs text-muted-foreground">{file.mimeType} · {new Intl.NumberFormat("es").format(file.sizeBytes)} bytes</p></div><div className="flex items-center gap-2"><Badge variant={file.status === "ready" ? "default" : "secondary"}>{file.status}</Badge><FileActions fileId={file.id} ready={file.status === "ready"} /></div></div>)}</div></section>
    </main>
  );
}
