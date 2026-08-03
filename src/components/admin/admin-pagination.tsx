import Link from "next/link";

import { Button } from "@/components/ui/button";

type SearchParams = Record<string, string | string[] | undefined>;

export function AdminPagination({
  basePath,
  page,
  pages,
  searchParams,
  pageKey = "page"
}: {
  basePath: string;
  page: number;
  pages: number;
  searchParams: SearchParams;
  pageKey?: string;
}) {
  if (pages <= 1) return null;

  function href(nextPage: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string" && key !== pageKey) query.set(key, value);
    }
    if (nextPage > 1) query.set(pageKey, String(nextPage));
    const serialized = query.toString();
    return serialized ? `${basePath}?${serialized}` : basePath;
  }

  return (
    <nav className="flex items-center justify-between gap-4" aria-label="Paginación">
      {page > 1 ? <Button asChild variant="outline"><Link href={href(page - 1)} rel="prev">Anterior</Link></Button> : <span />}
      <span className="text-sm text-muted-foreground" aria-current="page">Página {page} de {pages}</span>
      {page < pages ? <Button asChild variant="outline"><Link href={href(page + 1)} rel="next">Siguiente</Link></Button> : <span />}
    </nav>
  );
}
