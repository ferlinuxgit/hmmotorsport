import Link from "next/link";

import { getBackofficeNavigation } from "@/lib/modules/loader";

const coreItems = [
  { key: "overview", title: "Resumen", href: "/admin", description: "Salud y actividad operativa." },
  { key: "users", title: "Usuarios", href: "/admin/users", description: "Acceso, estado y roles." },
  { key: "audit", title: "Auditoría", href: "/admin/audit", description: "Acciones administrativas." },
  { key: "jobs", title: "Jobs", href: "/admin/jobs", description: "Cola, reintentos y errores." },
  { key: "files", title: "Archivos", href: "/admin/files", description: "Objetos, permisos y almacenamiento." },
  { key: "configuration", title: "Configuración", href: "/admin/configuration", description: "Settings y feature flags." },
  { key: "billing", title: "Billing", href: "/admin/billing", description: "Entitlements, refunds y reconciliación." }
] as const;

export function AdminNavigation() {
  const moduleItems = getBackofficeNavigation();

  return (
    <nav aria-label="Navegación del backoffice" className="border-b border-border/80 bg-card/50">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
        {[...coreItems, ...moduleItems].map((item) => (
          <Link
            key={item.key}
            href={item.href}
            title={item.description}
            className="shrink-0 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-border hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
